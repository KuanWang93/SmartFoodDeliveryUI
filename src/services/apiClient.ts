import axios from 'axios'
import { store } from '../store'
import type { RootState } from '../store'

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: '/api',
})

// 请求拦截器：自动加上两个 Token
apiClient.interceptors.request.use(config => {
  // 如果是登录/注册相关的 auth 接口，就跳过
  // config.url 可能是 '/auth/login' 或 '/api/auth/login'，请根据你实际调用时的路径调整
  const url = config.url ?? ''
  if (url.startsWith('/api/auth/') || url.startsWith('/auth/')) {
    return config
  }
  // 否则，从 Redux store 里拿当前的 auth 状态
  const state = store.getState() as RootState
  const { accessToken, refreshToken } = state.auth

  // 确保 headers 对象存在
  config.headers = config.headers ?? {}

  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`
  }
  if (refreshToken) {
    config.headers['X-Refresh-Token'] = `Bearer ${refreshToken}`
  }

  return config
})

export default apiClient
