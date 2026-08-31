import { api, setToken } from "./client";

export async function login(email, password) {
  const data = await api.post("/auth/login", { email, password });
  setToken(data.access_token);
  return data.user;
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } finally {
    setToken(null);
  }
}

export function me() {
  return api.get("/auth/me");
}
