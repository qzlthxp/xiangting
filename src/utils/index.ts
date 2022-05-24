export function formatDuration(duration: number | string): string {
  const time = Number(duration) / 1000 / 60
  const minute = Math.trunc(time)
  const second = ('0' + Math.trunc((time - minute) * 60)).slice(-2)
  return `${minute}:${second}`
}

export function formatLrc(lyric: string) {
  const obj: {
    [Key: string]: string
  } = {}
  const lyricArray = lyric.split('\n').filter(Boolean)
  lyricArray.forEach((item: string) => {
    const data = decodeURIComponent(item).replace(/\s/g, '')
    const time = data.match(/\[.*\]/g)
    const timeArr = time?.[0]
      .slice(1, time?.[0].length - 1)
      .split(':')
      .reverse()
    let second = 0
    timeArr?.forEach((item, index) => {
      second += 60 ** index * parseFloat(item)
    })
    obj[Math.round(second)] = data.replace(/\[.*\]/g, '') || '● ● ●'
  })
  return obj
}

export function debounce(fn: any, delay = 1000, immediate = false) {
  let timer: any = null
  let flag = true
  return function (this: any, ...args: any[]): void {
    if (timer) clearTimeout(timer)
    if (immediate) {
      if (flag) {
        fn.apply(this, args)
        flag = false
        timer = setTimeout(() => {
          flag = true
        }, delay)
      }
    } else {
      timer = setTimeout(() => {
        fn.apply(this, args)
      }, delay)
    }
  }
}
