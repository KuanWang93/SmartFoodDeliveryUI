import axios, { AxiosResponse } from 'axios'
import { store } from '../store'
import type { RootState } from '../store'

interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

const apiClient = axios.create({
  baseURL: '/api',
})

// 请求拦截器
apiClient.interceptors.request.use(config => {
  const url = config.url ?? ''
  if (url.startsWith('/auth/')) {
    return config
  }
  const { accessToken, refreshToken } = (store.getState() as RootState).auth
  config.headers = config.headers ?? {}
  if (accessToken) config.headers['Authorization'] = `Bearer ${accessToken}`
  if (refreshToken) config.headers['X-Refresh-Token'] = `Bearer ${refreshToken}`
  return config
})

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const body = response.data
    if (body.code !== 1) {
      // 业务错误，扔到 catch
      return Promise.reject(new Error(body.msg ?? 'Unknown error'))
    }
    // 成功：不要拆 data，直接返回整个 AxiosResponse
    return response
  },
  error => Promise.reject(error)
)

export default apiClient
