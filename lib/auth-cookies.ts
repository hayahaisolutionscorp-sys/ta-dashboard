import { getCookie, setCookie, deleteCookie } from "cookies-next";

const AUTH_TOKEN_KEY = "ta-auth-token";
const AUTH_USER_KEY = "ta-auth-user";

// Cookie options for auth tokens
const cookieOptions = {
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

// Set auth token cookie
export function setAuthToken(token: string): void {
  setCookie(AUTH_TOKEN_KEY, token, cookieOptions);
}

// Get auth token from cookie
export function getAuthToken(): string | undefined {
  const token = getCookie(AUTH_TOKEN_KEY);
  return token ? String(token) : undefined;
}

// Remove auth token cookie
export function removeAuthToken(): void {
  deleteCookie(AUTH_TOKEN_KEY, { path: "/" });
}

// Set user data cookie (for SSR access)
export function setAuthUser(user: object): void {
  setCookie(AUTH_USER_KEY, JSON.stringify(user), cookieOptions);
}

// Get user data from cookie
export function getAuthUser<T>(): T | undefined {
  const user = getCookie(AUTH_USER_KEY);
  if (!user) return undefined;
  try {
    return JSON.parse(String(user)) as T;
  } catch {
    return undefined;
  }
}

// Remove user data cookie
export function removeAuthUser(): void {
  deleteCookie(AUTH_USER_KEY, { path: "/" });
}

// Clear all auth cookies
export function clearAuthCookies(): void {
  removeAuthToken();
  removeAuthUser();
}

// Check if user is authenticated (client-side)
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}
