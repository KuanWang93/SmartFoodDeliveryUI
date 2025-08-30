import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface RiderLocation {
  lat: number | null;
  lng: number | null;
}

const initialState: RiderLocation = { lat: null, lng: null };

const locationSlice = createSlice({
  name: "location",
  initialState,
  reducers: {
    setLocation(state, action: PayloadAction<{ lat: number; lng: number }>) {
      state.lat = action.payload.lat;
      state.lng = action.payload.lng;
    },
    clearLocation(state) {
      state.lat = null;
      state.lng = null;
    }
  }
});

export const { setLocation, clearLocation } = locationSlice.actions;

export default locationSlice.reducer;
