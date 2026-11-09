import axios from "axios";

export function createChatBoxApi(apiUrl: string, token?: string) {
  const normalizedApiUrl = apiUrl.replace(/\/+$/, "");

  return axios.create({
    baseURL: normalizedApiUrl,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}
