import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import authReducer from './slices/authSlice'
import orderReducer from './slices/orderSlice'
import addressReducer from './slices/addressSlice'
import merchantReducer from './slices/merchantSlice'
import merchantWebSocketReucer from './slices/merchantWebSocketSlice'
import riderWebSocketReucer from './slices/riderWebSocketSlice'
import locationReducer from "./slices/locationSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  order: orderReducer,
  address: addressReducer,
  merchant: merchantReducer,
  merchantWebSocket: merchantWebSocketReucer,
  riderWebSocket: riderWebSocketReucer,
  location: locationReducer,
})

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'merchant', 'address'],
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE']
      }
    })
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
