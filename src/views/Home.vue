<template>
  <div class="home">
    <audio
      ref="audio"
      src=""
      controls
      preload="metadata"
      @loadedmetadata="loadedmetadata"
      @timeupdate="timeupdate"
    ></audio>

    <div ref="progress" class="progress" @click="changeCurTime">
      <div ref="bufferedProgress" class="buffered-progress"></div>
      <div ref="playProgress" class="play-progress" @click.stop="changeCurTime">
        <div class="progress-btn" @mousedown="downProgressBtn"></div>
      </div>
    </div>

    <p>
      {{ formatDuration(currentTime * 1000) }} / {{ formatDuration(duration) }}
    </p>

    <div class="lrc-box" @wheel="lrcBoxScroll">
      <ul class="lrc-ctn" @click="changeCurTimeByLrc($event)">
        <Loading v-show="!Object.keys(ric).length" />
        <li
          class="ric"
          v-for="(lrc, key) in ric"
          :key="key"
          :data-timeline="key"
        >
          {{ lrc }}
        </li>
      </ul>
    </div>

    <Loading v-show="!result.length" />
    <ul v-show="result.length">
      <li
        :style="`${item.id === songId ? 'color: #31c27c' : ''}`"
        v-for="item in result"
        :key="item.id"
        @click="changeMusic(item)"
      >
        <span class="name">{{ item.name }}</span>
        <span class="dt">{{ item.duration }}</span>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { formatDuration, formatLrc } from '@/utils'
import { lyric, topSong } from '@/api'
import Loading from '@/components/Loading.vue'

const result = ref<any>([])
const songId = ref<null | number>(null)
const audio = ref<HTMLAudioElement>()
const progress = ref<HTMLDivElement>()

// 正在播放的进度
const playProgress = ref<HTMLDivElement>()
// 缓冲的进度
const bufferedProgress = ref<HTMLDivElement>()
// 播放的当前位置
const currentTime = ref(0)
// 总时长
const duration = ref(0)
const readyPlay = ref(false)
// 歌词
const ric = ref<{ [Key: string]: string }>({})
// 正在拖动进度条
const isMoving = ref(false)
// 正在滚动歌词
const isScrolling = ref(false)
let timer: any = null

// 根据歌曲id获取歌词
async function getLyric(params: { id: number | string }) {
  const res = (await lyric(params)) as any
  ric.value = formatLrc(res.lrc.lyric)
  if (Object.keys(ric.value).length && readyPlay.value) {
    audio.value!.play()
  }
}

// 点击播放歌曲
const changeMusic = (item: any) => {
  ric.value = {}
  songId.value = item.id
  audio.value!.src = item.url
  duration.value = item.dt
  getLyric({ id: item.id })
}

// 歌曲元数据加载完毕
const loadedmetadata = () => {
  readyPlay.value = true
}

// 歌词滚动
const lrcBoxScroll = () => {
  if (timer) clearTimeout(timer)
  isScrolling.value = true
  timer = setTimeout(() => {
    isScrolling.value = false
  }, 1000)
}

// 移除歌词高亮
const removeLrcHighLight = () => {
  document.querySelectorAll('.ric').forEach((el: Element) => {
    el.classList.remove('active')
  })
}

// 歌词高亮
const addLrcHighLight = () => {
  const dataTimeline = Object.keys(ric.value)
    .filter((item) => {
      return Number(item) <= currentTime.value
    })
    .reverse()[0]
  if (dataTimeline) {
    const ricDom = document.querySelector(
      `.ric[data-timeline="${dataTimeline}"]`
    ) as HTMLLIElement
    if (!ricDom.classList.contains('active')) {
      removeLrcHighLight()
      ricDom.classList.add('active')
      if (isScrolling.value) return
      const parentNode = ricDom.closest('.lrc-ctn') as HTMLUListElement
      const boxNode = parentNode.closest('.lrc-box') as HTMLDivElement
      // 当前需要高亮歌词距离父容器顶部的距离，减去父容器一半高度，在加上自身一半的高度。滚动到父元素垂直居中的位置。
      const dy =
        ricDom.offsetTop - boxNode.clientHeight / 2 + ricDom.clientHeight / 2
      boxNode.scrollTop = dy > 0 ? dy : 0
    }
  }
}

// 修改缓存进度条
const changeBufferedWidth = () => {
  const bufferedWidth =
    audio.value!.buffered.length > 0
      ? (audio.value!.buffered.end(audio.value!.buffered.length - 1) /
          audio.value!.duration) *
        100
      : 0
  bufferedProgress.value!.style.width = Math.round(bufferedWidth) + '%'
}

// 修改播放进度条
const changePlayWidth = () => {
  const width = (audio.value!.currentTime / audio.value!.duration) * 100 || 0
  playProgress.value!.style.width = Math.round(width) + '%'
}

const timeupdate = () => {
  if (isMoving.value) return
  currentTime.value = audio.value!.currentTime
  addLrcHighLight()
  changeBufferedWidth()
  changePlayWidth()
}

// 点击进度条修改播放位置
const changeCurTime = (e: MouseEvent) => {
  if (audio.value!.currentSrc && !isMoving.value) {
    audio.value!.currentTime =
      (e.offsetX / progress.value!.clientWidth) * audio.value!.duration
  }
}

// 点击歌词修改播放位置
const changeCurTimeByLrc = (e: MouseEvent) => {
  audio.value!.currentTime =
    Number((e.target as HTMLLIElement).dataset.timeline) || 0
}

// 按下进度指示按钮拖动修改进度
const downProgressBtn = (e: MouseEvent) => {
  const dx = e.clientX
  const width = playProgress.value!.clientWidth
  document.onmousemove = (e: MouseEvent) => {
    isMoving.value = true
    let x = (e.clientX - dx + width) / progress.value!.clientWidth
    x = x < 0 ? 0 : x > 1 ? 1 : x
    let ctime = x * audio.value!.duration || 0
    playProgress.value!.style.width = `${Math.round(x * 100)}%`
    currentTime.value = ctime
    document.onmouseup = () => {
      audio.value!.currentTime = ctime
      document.onmousemove = null
      setTimeout(() => {
        isMoving.value = false
      }, 300)
    }
  }
}

onMounted(() => {
  async function getSong() {
    const res = (await topSong()) as any
    result.value.push(
      ...res.songs.map((song: any) => ({
        ...song,
        url: `https://music.163.com/song/media/outer/url?id=${song.id}.mp3 `,
        duration: formatDuration(song.dt)
      }))
    )
  }
  getSong()
})
</script>

<style lang="scss" scoped>
.home {
  padding: 0 50px;
}
.lrc-box {
  padding: 10px 10px 290px;
  width: 60%;
  height: 500px;
  border-radius: 5px;
  box-shadow: 0 0 10px #dfe6e9;
  position: relative;
  overflow: auto;
  scroll-behavior: smooth;
  &::-webkit-scrollbar {
    display: none;
  }
}
ul {
  list-style: none;
  width: 100%;
  height: auto;
  overflow: auto;
  li {
    width: 300px;
    padding: 10px;
    cursor: pointer;
    span {
      display: inline-block;
    }
    .name {
      width: 200px;
      text-align: left;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }
    .dt {
      width: 50px;
    }
    &.ric {
      margin: 0 0 10px;
      padding: 10px;
      width: 100%;
      height: 80px;
      border-radius: 10px;
      line-height: 60px;
      text-align: left;
      &.active {
        transition: font-size 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        color: #31c27c;
        font-weight: bold;
        font-size: 28px;
      }
      &:hover {
        color: #31c27c;
      }
      &:last-child {
        margin: 0;
      }
    }
    &:nth-child(even) {
      background-color: #f8f8f8;
    }
  }
}
.progress {
  width: 300px;
  height: 10px;
  border-radius: 15px;
  background-color: #eee;
  position: relative;
  cursor: pointer;
}
.buffered-progress,
.play-progress {
  position: absolute;
  height: 100%;
  border-radius: inherit;
  cursor: pointer;
}
.buffered-progress {
  width: 0;
  background-color: rgba(0, 0, 0, 0.1);
  z-index: 1;
}
.play-progress {
  width: 0;
  background-color: #31c27c;
  z-index: 2;
}
.progress-btn {
  user-select: none;
  position: absolute;
  top: -4px;
  right: -9px;
  width: 18px;
  height: 18px;
  border-radius: 100%;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background-color: #fff;
  z-index: 4;
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 10px;
    height: 10px;
    border-radius: 100%;
    background-color: #31c27c;
  }
}
</style>
