import { create } from 'zustand';
import { KiteCredentials } from '../types/kite.ts';
import { AuthService } from '../services/authService.ts';

interface AuthState {
  credentials: KiteCredentials | null;
  isAuthenticated: boolean;
  setCredentials: (credentials: KiteCredentials) => void;
  logout: () => void;
  initializeAuth: () => void;
  handleRedirect: () => boolean;
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

  handleRedirect: () => {
    const requestToken = AuthService.getRequestTokenFromUrl();
    if (requestToken && get().credentials?.apiKey && get().credentials?.apiSecret) {
      const updatedCredentials = {
        ...get().credentials!,
        requestToken,
      };
      get().setCredentials(updatedCredentials);
      // Remove the request_token from URL without refreshing
      window.history.replaceState({}, document.title, window.location.pathname);
      return true;
    }
    return false;
  },
}));