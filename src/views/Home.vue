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
        :style="`${item.id === songId ? 'color: #2ecc71' : ''}`"
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
const playProgress = ref<HTMLDivElement>()
const bufferedProgress = ref<HTMLDivElement>()
const currentTime = ref(0)
const duration = ref(0)
const readyPlay = ref(false)
const ric = ref<{ [Key: string]: string }>({})
const isMoving = ref(false)
const isScrolling = ref(false)
let timer: any = null

async function getLyric(params: { id: number | string }) {
  const res = (await lyric(params)) as any
  ric.value = formatLrc(res.lrc.lyric)
  if (Object.keys(ric.value).length && readyPlay.value) {
    audio.value?.play()
  }
}

const changeMusic = (item: any) => {
  ric.value = {}
  songId.value = item.id
  audio.value!.src = item.url
  duration.value = item.dt
  getLyric({ id: item.id })
}

const loadedmetadata = () => {
  readyPlay.value = true
}

const removeLrcHighLight = () => {
  document.querySelectorAll('.ric').forEach((el: Element) => {
    el.classList.remove('active')
  })
}

const lrcBoxScroll = () => {
  if (timer) clearTimeout(timer)
  isScrolling.value = true
  timer = setTimeout(() => {
    isScrolling.value = false
  }, 1000)
}

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
      const dy =
        ricDom.offsetTop - boxNode.clientHeight / 2 + ricDom.clientHeight / 2
      boxNode.scrollTop = dy
    }
  }
}

const changeBufferedWidth = () => {
  const bufferedWidth =
    audio.value!.buffered.length > 0
      ? (audio.value!.buffered.end(audio.value!.buffered.length - 1) /
          audio.value!.duration) *
        100
      : 0
  bufferedProgress.value!.style.width = Math.round(bufferedWidth) + '%'
}

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

const changeCurTime = (e: MouseEvent) => {
  if (audio.value!.currentSrc && !isMoving.value) {
    audio.value!.currentTime =
      (e.offsetX / progress.value!.clientWidth) * audio.value!.duration
  }
}

const changeCurTimeByLrc = (e: MouseEvent) => {
  audio.value!.currentTime =
    Number((e.target as HTMLLIElement).dataset.timeline) || 0
}

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
  padding-bottom: 160px;
  width: 60%;
  height: 500px;
  position: relative;
  overflow: auto;
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
      width: auto;
      height: 80px;
      border-radius: 10px;
      line-height: 60px;
      text-align: left;
      &.active {
        transition: 0.2s cubic-bezier(0.5, 1, 0.89, 1);
        color: #2ecc71;
        font-weight: bold;
        font-size: 28px;
      }
      &:hover {
        color: #2ecc71;
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
  background-color: #2ecc71;
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
    background-color: #2ecc71;
  }
}
</style>
