import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from './index'

// 用于 dispatch，带类型推导
export const useAppDispatch = () => useDispatch<AppDispatch>()
// 用于 selector，带类型推导
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
