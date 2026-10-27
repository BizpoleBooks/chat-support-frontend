export type ChatMessage = {
  sender: "user" | "bot";
  text: string;
files?: {
  name: string;
  type: string;
  url: string;
}[];
};


export type AIMessage = {
  role: "user" | "assistant";
  text: string;
};
export interface ChatResponse {
  text: string;
  files?: {
    name: string;
    type: string;
    url: string;
  }[];

  classification?: 
    | "kb"
    | "greeting"
    | "unrelated"
    | "kb_no_answer"
    | "raise_ticket"
    | "collect_user_for_ticket"
    | "not_registered"
    | "product_interest"     // ✅ NEW
    | "collect_contact"      // ✅ NEW
    | "enquiry_done";        // ✅ NEW

  product?: string;   // ✅ NEW
  redirect?: string;  // ✅ NEW
}

export type ChatUser = {
  id?: string
  name?: string
  email?: string
  phone?: string
}