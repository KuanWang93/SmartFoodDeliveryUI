import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface LastMessage {
  type: string;
  [key: string]: any; // 或者你有具体字段可以都写上
}

interface MerchantWebSocketState {
  isConnected: boolean,
  lastMessage: LastMessage | null,
}

const initialState: MerchantWebSocketState = {
  isConnected: false,
  lastMessage: null,
};

const riderWebSocketSlice = createSlice({
  name: "riderWebSocket",
  initialState,
  reducers: {
    setIsConnected(state, action: PayloadAction<boolean>) {
      state.isConnected = action.payload;
    },
    setLastMessage(state, action: PayloadAction<any>) {
      state.lastMessage = action.payload;
    },
  },
});

export const { setIsConnected, setLastMessage } = riderWebSocketSlice.actions;
export default riderWebSocketSlice.reducer;
