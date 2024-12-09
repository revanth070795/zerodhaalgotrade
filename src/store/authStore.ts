import { create } from 'zustand';
import { KiteCredentials } from '../types/kite.ts';
import { AuthService } from '../services/authService.ts';
import { authAPI } from '../services/api.ts';

interface AuthState {
  credentials: KiteCredentials | null;
  isAuthenticated: boolean;
  setCredentials: (credentials: KiteCredentials) => void;
  logout: () => void;
  initializeAuth: () => void;
  handleRedirect: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  credentials: null,
  isAuthenticated: false,

  setCredentials: (credentials) => {
    AuthService.saveCredentialsToCookie(credentials);
    set({ credentials, isAuthenticated: true });
  },

  logout: () => {
    AuthService.clearCredentials();
    set({ credentials: null, isAuthenticated: false });
  },

  initializeAuth: () => {
    const savedCredentials = AuthService.getCredentialsFromCookie();
    if (savedCredentials) {
      set({ credentials: savedCredentials, isAuthenticated: true });
    }
  },

  handleRedirect: async () => {
    const requestToken = AuthService.getRequestTokenFromUrl();
    if (requestToken && get().credentials?.apiKey && get().credentials?.apiSecret) {
      const accessTokenRes = await authAPI.callback(requestToken, get().credentials?.apiKey || '');
      const accessToken = accessTokenRes.accessToken;
      const updatedCredentials = {
        ...get().credentials!,
        requestToken,
        accessToken,
      };
      get().setCredentials(updatedCredentials);
      // Remove the request_token from URL without refreshing
      window.history.replaceState({}, document.title, window.location.pathname);
      return true;
    }
    return false;
  },
}));