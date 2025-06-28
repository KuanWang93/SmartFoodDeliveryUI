import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Dish {
  id: number
  name: string
  price: number
  quantity: number
}

interface CartState {
  items: Dish[]
}

const initialState: CartState = { items: [] }

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<Dish>) {
      state.items.push(action.payload)
    },
    removeItem(state, action: PayloadAction<number>) {
      state.items = state.items.filter(d => d.id !== action.payload)
    },
    clearCart(state) {
      state.items = []
    },
  },
})

export const { addItem, removeItem, clearCart } = cartSlice.actions
export default cartSlice.reducer
