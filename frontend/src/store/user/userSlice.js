

import {createSlice} from "@reduxjs/toolkit"


const initialState = {
    user:null,
    isAutenticated:false
}

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAutenticated = true;
    },
    clearUser: (state) => {
      state.user = null;
      state.isAutenticated = false;
    },

    // ✅ NEW (minimal updates only)
    addFollowing: (state, action) => {
      if (!state.user?.following) state.user.following = [];
      if (!state.user.following.includes(action.payload)) {
        state.user.following.push(action.payload);
      }
    },
    removeFollowing: (state, action) => {
      if (!state.user?.following) return;
      state.user.following = state.user.following.filter(
        (id) => id !== action.payload
      );
    },
  },
});



export const {setUser,clearUser , addFollowing ,removeFollowing} = userSlice.actions

export default userSlice.reducer