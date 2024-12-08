import { KiteCredentials } from '../types/kite.ts';

const COOKIE_NAME = 'kite_credentials';
const REQUEST_TOKEN_PARAM = 'request_token';

export class AuthService {
  static getCredentialsFromCookie(): KiteCredentials | null {
    try {
      const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith(`${COOKIE_NAME}=`))
        ?.split('=')[1];

      if (cookieValue) {
        return JSON.parse(decodeURIComponent(cookieValue));
      }
    } catch (error) {
      console.error('Error reading credentials from cookie:', error);
    }
    return null;
  }

  static saveCredentialsToCookie(credentials: KiteCredentials): void {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 1); // Cookie expires in 1 day
    
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(
      JSON.stringify(credentials)
    )}; expires=${expirationDate.toUTCString()}; path=/`;
  }

  static clearCredentials(): void {
    document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }

  static getRequestTokenFromUrl(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(REQUEST_TOKEN_PARAM);
  }

  static generateLoginUrl(apiKey: string): string {
    return `https://kite.zerodha.com/connect/login?api_key=${apiKey}&v=3`;
  }
}