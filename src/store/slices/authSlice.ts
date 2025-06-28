// src/store/authSlice.ts
import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit'
import type { RootState } from '../../store'

export interface AuthState {
  role: string | null
  accessToken: string | null
  refreshToken: string | null
  image: string | null
  username: string | null
}

const initialState: AuthState = {
  role: null,
  accessToken: null,
  refreshToken: null,
  image: null,
  username: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login(
      state,
      action: PayloadAction<{
        role: string
        accessToken: string
        refreshToken: string
        image: string
        username: string
      }>
    ) {
      Object.assign(state, action.payload)
    },
    logout(state) {
      Object.assign(state, initialState)
    },
  },
})

export const { login, logout } = authSlice.actions

// 直接选取整个 auth state
export const selectAuth = (state: RootState) => state.auth

// 创建一个 memoized selector，只处理 username 并加默认值
export const selectUsername = createSelector(
  selectAuth,
  auth => auth.username ?? 'Merchant'
)

export default authSlice.reducer
