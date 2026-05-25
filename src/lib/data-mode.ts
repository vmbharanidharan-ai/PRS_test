export type DataMode = "local" | "account";

const KEY = "genescreen_data_mode";
const TOKEN_KEY = "genescreen_token";
const USER_KEY = "genescreen_user_id";

export function getDataMode(): DataMode | null {
  if (typeof window === "undefined") return null;
  const m = sessionStorage.getItem(KEY);
  return m === "local" || m === "account" ? m : null;
}

export function setDataMode(mode: DataMode): void {
  sessionStorage.setItem(KEY, mode);
  if (mode === "local") {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }
}

export function getAuthToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setAuth(token: string, userId: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, userId);
  sessionStorage.setItem(KEY, "account");
}

export function clearAuth(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export function isAccountMode(): boolean {
  return getDataMode() === "account" && !!getAuthToken();
}
