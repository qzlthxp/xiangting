import request from '../utils/request'

export function topSong(id: string) {
  return request({
    url: `/artist/top/song?id=${id}`,
    method: 'get'
  })
}

export function songDetail(params: any) {
  return request({
    url: '/song/detail',
    method: 'get',
    params
  })
}

export function lyric(params: { id: number | string }) {
  return request({
    url: '/lyric',
    method: 'get',
    params
  })
}
