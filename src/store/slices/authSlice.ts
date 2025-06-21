// src/store/slices/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface AuthState {
  role: string | null
  accessToken: string | null
  refreshToken: string | null
}

const initialState: AuthState = {
  role: null,
  accessToken: null,
  refreshToken: null,
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
        refreshToken?: string
      }>
    ) {
      state.role = action.payload.role
      state.accessToken = action.payload.accessToken
      // 如果后端也给了 refreshToken，就存：
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken
      }
    },
    logout(state) {
      state.role = null
      state.accessToken = null
      state.refreshToken = null
    },
  },
})

export const { login, logout } = authSlice.actions
export default authSlice.reducer
