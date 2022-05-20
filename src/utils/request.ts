import axios from 'axios'

const service = axios.create({
  baseURL: 'https://netease-cloud-music-api-theta.vercel.app',
  timeout: 5000
})

service.interceptors.request.use(
  (config) => {
    return config
  },
  (err) => Promise.reject(err)
)

service.interceptors.response.use(
  (res) => {
    return res.data
  },
  (err) => Promise.reject(err)
)

export default service
