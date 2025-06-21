import { persistStore } from 'redux-persist'
import { store } from './index'

// Create the persistor which will persist and rehydrate the Redux store
export const persistor = persistStore(store)
