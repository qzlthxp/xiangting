<template>
  <div class="home">
    <p class="singer-name">歌手：{{ singerName }}</p>
    <div class="controls">
      <div class="input-box">
        <label for="singerId"
          >歌手id：
          <input id="singerId" type="text" v-model="singerId" />
        </label>
        <button @click="getSong(singerId)">获取歌手歌曲</button>
      </div>
      <audio
        ref="audio"
        src=""
        controls
        preload="metadata"
        @loadedmetadata="loadedmetadata"
        @timeupdate="timeupdate"
        @ended="nextSong"
      ></audio>

      <div ref="progress" class="progress" @click="changeCurTime">
        <div ref="bufferedProgress" class="buffered-progress"></div>
        <div
          ref="playProgress"
          class="play-progress"
          @click.stop="changeCurTime"
        >
          <div class="progress-btn" @mousedown="downProgressBtn"></div>
        </div>
      </div>

      <p class="time">
        {{ formatDuration(currentTime * 1000) }} /
        {{ formatDuration(duration) }}
      </p>
    </div>

    <div class="song-container">
      <div class="songs-box">
        <Loading v-show="!result.length" />
        <ul class="songs" v-show="result.length">
          <li
            class="song"
            :style="`${item.id === songId ? 'color: #31c27c' : ''}`"
            v-for="item in result"
            :key="item.id"
            @click="changeMusic(item)"
          >
            <span class="name" :title="item.name">{{ item.name }}</span>
            <span class="dt">{{ item.duration }}</span>
          </li>
        </ul>
      </div>

      <div class="lrc-box" @wheel="lrcBoxScroll">
        <ul class="lrc-ctn" @click="changeCurTimeByLrc($event)">
          <Loading v-show="!Object.keys(ric).length" :msg="loadingMsg" />
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
    </div>

    <a
      title="github"
      class="github-link"
      href="https://github.com/qzlthxp/xiangting"
      target="_blank"
    >
      <img src="../assets/github-round.png" alt="github" />
    </a>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { formatDuration, formatLrc } from '@/utils'
import { lyric, topSong } from '@/api'
import Loading from '@/components/Loading.vue'

const singerId = ref('')
const singerName = ref('')
const singerIds = [
  '2116',
  '3684',
  '9606',
  '5781',
  '1143033',
  '12138269',
  '7763',
  '12631485',
  '5771',
  '4292',
  '35531',
  '31376161',
  '6472',
  '6452',
  '11127',
  '12002248',
  '7214',
  '1198123',
  '8926',
  '2843',
  '12676697',
  '14312549',
  '31165848',
  '36032190',
  '9940',
  '44266',
  '1197168',
  '36181946',
  '12429072',
  '31309410',
  '6460',
  '32399227',
  '780003',
  '14714082',
  '7424',
  '1132392',
  '1050282',
  '12852319',
  '9621',
  '33435854',
  '5538',
  '10204',
  '1019154',
  '12276375',
  '1030001',
  '9272',
  '3699',
  '122455',
  '35187624',
  '7063',
  '29588305',
  '893484',
  '784257',
  '1007170',
  '10562',
  '861777',
  '12156137',
  '12085562',
  '159300',
  '1045123'
]

const loadingMsg = ref('请先选择左侧歌曲')

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

// 当前歌曲播放完毕自动播放
const nextSong = () => {
  let song: any = result.value?.[0]
  for (let i = 0; i < result.value.length; i++) {
    if (result.value[i].id === songId.value) {
      if (i !== result.value.length - 1) {
        song = result.value?.[i + 1]
        break
      }
    }
  }
  songId.value = song.id
  changeMusic(song)
}

// 点击播放歌曲
const changeMusic = (item: any) => {
  ric.value = {}
  loadingMsg.value = ''
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

async function getSong(id: string) {
  result.value.length = 0
  const res = (await topSong(id)) as any
  singerName.value = res.songs[0].ar[0].name
  result.value.push(
    ...res.songs.map((song: any) => ({
      ...song,
      url: `https://music.163.com/song/media/outer/url?id=${song.id}.mp3 `,
      duration: formatDuration(song.dt)
    }))
  )
}

onMounted(() => {
  singerId.value = singerIds[Math.floor(Math.random() * singerIds.length)]
  getSong(singerId.value)
})
</script>

<style lang="scss" scoped>
.home {
  padding: 50px;
  position: relative;
}
.controls {
  margin-bottom: 50px;
  display: flex;
  align-items: center;
  .input-box,
  audio,
  .progress {
    margin-right: 50px;
  }
}
.song-container {
  width: 100%;
  height: 500px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.songs-box,
.lrc-box {
  height: 100%;
  box-shadow: 0 0 10px #dfe6e9;
  border-radius: 5px;
  position: relative;
  overflow: auto;
  scroll-behavior: smooth;
}
.songs-box {
  padding: 10px;
  width: 350px;
  overflow: auto;
}
.lrc-box {
  margin-left: 50px;
  padding: 10px 10px 290px;
  flex: 1;
  &::-webkit-scrollbar {
    display: none;
  }
}
ul {
  list-style: none;
  width: 100%;
  height: auto;
  li {
    margin-bottom: 10px;
    padding: 10px;
    width: 100%;
    background-color: #f8f8f8;
    border-radius: 10px;
    cursor: pointer;
    &.song {
      display: flex;
      justify-content: space-between;
      align-items: center;
      .name {
        max-width: 150px;
        text-align: left;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
      }
    }
    &.ric {
      width: 100%;
      height: 80px;
      line-height: 60px;
      text-align: left;
      &.active {
        transition: font-size 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        color: #31c27c;
        font-weight: bold;
        font-size: 28px;
      }
      &:nth-child(odd) {
        background-color: #fff;
      }
    }
    &:last-child {
      margin: 0;
    }
    &:hover {
      color: #31c27c;
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
.github-link {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
}
.github-link img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
