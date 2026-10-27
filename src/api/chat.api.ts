import api from "./axios";
import type { AIMessage, ChatResponse,ChatUser } from "../types/chat.types";

export const askChatBot = async (
  message: string,
  history: AIMessage[],
  tenantSlug: string,
  file?: File | null,
    sessionId?: string,
        user?: ChatUser,
          product?: string  
): Promise<ChatResponse> => {

  const formData = new FormData();
  formData.append("message", message);
  formData.append("history", JSON.stringify(history));
  formData.append("session_id", sessionId || "");
if (product) {
  formData.append("product", product);
}
  if (file) {
    formData.append("file", file);
  }
  if (user) {
    if (user.id) formData.append("user_id", user.id);
    if (user.name) formData.append("name", user.name);
    if (user.email) formData.append("email", user.email);
    if (user.phone) formData.append("phone", user.phone);
  }
  const response = await api.post("/chat/ask", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      "x-tenant-slug": tenantSlug,
    },
  });

  return response.data as ChatResponse; // ✅ force correct type
};