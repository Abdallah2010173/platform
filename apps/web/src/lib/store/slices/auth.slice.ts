import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthUser, clearSession, getStoredTokens, getStoredUser, persistSession } from '@/lib/auth';

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: AuthUser;
        accessToken: string;
        refreshToken: string;
      }>,
    ) => {
      const { user, accessToken, refreshToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.isAuthenticated = true;
      persistSession(accessToken, refreshToken, user);
    },
    clearCredentials: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      clearSession();
    },
    updateAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', action.payload);
      }
    },
    hydrate: (state) => {
      const { accessToken, refreshToken } = getStoredTokens();
      const user = getStoredUser();
      if (accessToken && refreshToken && user) {
        state.accessToken = accessToken;
        state.refreshToken = refreshToken;
        state.user = user;
        state.isAuthenticated = true;
      }
    },
  },
});

export const { setCredentials, clearCredentials, updateAccessToken, hydrate } = authSlice.actions;
export default authSlice.reducer;
