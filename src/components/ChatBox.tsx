import { useState, useRef, useEffect } from "react";
import { askChatBot } from "../api/chat.api";
import { Send, X, Paperclip, Zap, Sparkles,History,Ticket,ArrowLeft } from "lucide-react";
import  type{ ChatMessage, AIMessage, ChatUser } from "../types/chat.types";
import api from "../api/axios";
import logo from "../assets/ch4.png"
import gif from "../assets/ch.gif"
export default function ChatBox({ tenantSlug, user }: { tenantSlug: string,  user?: ChatUser ,  product?: string }) {

  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
const [file, setFile] = useState<File | null>(null);

const [tickets, setTickets] = useState<any[]>([]);
const [showTicketsPanel, setShowTicketsPanel] = useState(false);
const [lastPanel, setLastPanel] = useState<"history" | "tickets" | null>(null);
const [showTicketConfirm, setShowTicketConfirm] = useState(false);
const [collectingDescription, setCollectingDescription] = useState(false);
const [ticketDescription, setTicketDescription] = useState("");
const [sessionId, setSessionId] = useState<string | null>(null);

const [sessions, setSessions] = useState<any[]>([]);
const [showSessions, setShowSessions] = useState(false);
const [activeSession, setActiveSession] = useState<string | null>(null);
const [collectingEmailForTicket, setCollectingEmailForTicket] = useState(false);
const [tempUser, setTempUser] = useState<ChatUser | null>(null);
const [quickActions, setQuickActions] = useState<any[]>([]);
const [activeProduct, setActiveProduct] = useState<string | null>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
      if (!sessionId) {
    const newSession = "bznv_" + crypto.randomUUID();
    setSessionId(newSession);
   // wait for next click OR re-trigger
  }
if (!message.trim() && !file) return;


  // 1️⃣ Save user message
  const userMessage = message;
const filePreview =
  file
    ? {
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file),
      }
    : undefined;

  // 2️⃣ Build updated chat list
 const updatedMessages: ChatMessage[] = [
  ...messages,
{
  sender: "user",
  text: userMessage,
  files: filePreview ? [filePreview] : [],
}
];


 // 3️⃣ Update UI immediately
  
  setLoading(true);
  setMessage("");

  // 4️⃣ Convert last messages → AI format
  const historyForAI: AIMessage[] = updatedMessages
    .slice(-6) // last 3 turns
    .map(m => ({
      role: m.sender === "user" ? "user" : "assistant",
      text: m.text,
    }));

  try {
    // 5️⃣ Call backend
    const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const phoneRegex = /\b\d{10}\b/;

const emailMatch = message.match(emailRegex)?.[0];
const phoneMatch = message.match(phoneRegex)?.[0];

const activeUser = user || tempUser;

const enrichedUser = {
  ...activeUser,
  email: activeUser?.email || emailMatch,
  phone: activeUser?.phone || phoneMatch,
};
// ✅ HANDLE EMAIL FLOW FIRST (BEFORE API CALL)
// 🚨 HANDLE EMAIL FIRST (BEFORE ANY UI UPDATE)
if (collectingEmailForTicket) {
  const emailMatch = message.match(emailRegex)?.[0];
  const phoneMatch = message.match(phoneRegex)?.[0];

  if (!emailMatch && !phoneMatch) {
    setMessages(prev => [
      ...prev,
      {
        sender: "bot",
        text: "❌ Please enter a valid email or phone number.",
      },
    ]);
    return;
  }

  // 🔥 CALL BACKEND FOR REAL VERIFICATION
  const verifyRes = await askChatBot(
   message, // dummy message
    [],
    tenantSlug,
    null,
    sessionId ?? undefined,
    { email: emailMatch, phone: phoneMatch }
  );

  // ❌ INVALID USER
  if (verifyRes.classification === "not_registered") {
    setMessages(prev => [
      ...prev,
      { sender: "user", text: message },
      {
        sender: "bot",
        text: "❌ This email is not registered. Please enter a valid registered email.",
      },
    ]);

    setLoading(false);
    return;
  }

  // ✅ VALID USER
  setTempUser({
    email: emailMatch,
    phone: phoneMatch,
  });

  setCollectingEmailForTicket(false);

  setMessages(prev => [
    ...prev,
    { sender: "user", text: message },
    { sender: "bot", text: `✅ Verified: ${emailMatch}` },
    {
      sender: "bot",
      text: "Please describe your issue so our support team can help you.",
    },
  ]);

  setTimeout(() => {
    setCollectingDescription(true);
  }, 0);

  setLoading(false);
  return;
}
setMessages(updatedMessages); 
// 🚨 STOP AI when collecting description
if (collectingDescription) {
  setLoading(false);
  return;
}
const response = await askChatBot(
  userMessage,
  historyForAI,
  tenantSlug,
  file,
  sessionId ?? undefined,
  enrichedUser,
   activeProduct || undefined 
);

setFile(null);

if (response.classification === "unrelated") {
  setMessages(prev => [
    ...prev,
    {
      sender: "bot",
      text: "I can help with HelpDeskPro related questions. Let me know how I can assist you 🙂",
    },
  ]);
}

else if (response.classification === "collect_user_for_ticket") {
  setMessages(prev => [
    ...prev,
    {
      sender: "bot",
      text: response.text,
    },
  ]);
}

else if (response.classification === "not_registered") {
  setMessages(prev => [
    ...prev,
    {
      sender: "bot",
      text: response.text,
    },
  ]);
}

else if (response.classification === "kb_no_answer") {
  setShowTicketConfirm(true);

  setMessages(prev => [
    ...prev,
    { sender: "bot", text: response.text },
    { sender: "bot", text: "Would you like to raise a support ticket?" },
  ]);
}

else if (response.classification === "raise_ticket") {
  if (!user && !enrichedUser?.email && !enrichedUser?.phone) {
    setMessages(prev => [
      ...prev,
      {
        sender: "bot",
        text: "Please provide your registered email before raising a ticket.",
      },
    ]);
    setLoading(false);
    return;
  }

  // ✅ FIRST set state
  setCollectingDescription(true);

  // ✅ THEN delay message (IMPORTANT)
  setTimeout(() => {
    setMessages(prev => [
      ...prev,
      {
        sender: "bot",
        text: "Please describe your issue so our support team can help you.",
      },
    ]);
  }, 0);
}
// 🛒 PRODUCT INTEREST
else if (response.classification === "product_interest") {
  setActiveProduct(response.product || null);

  setMessages(prev => [
    ...prev,
    { sender: "bot", text: response.text }
  ]);
}

// 📩 COLLECT CONTACT
else if (response.classification === "collect_contact") {
  setMessages(prev => [
    ...prev,
    { sender: "bot", text: response.text }
  ]);
}

// ✅ ENQUIRY DONE
else if (response.classification === "enquiry_done") {
  setMessages(prev => [
    ...prev,
    { sender: "bot", text: response.text }
  ]);

  // 🔥 redirect user
  if (response.redirect) {
    setTimeout(() => {
      window.open(response.redirect!, "_blank");
    }, 1000);
  }

  // 🔄 reset product after completion
  setActiveProduct(null);
}
else {
  setMessages(prev => [
    ...prev,
    {
      sender: "bot",
      text: response.text,
      files: response.files || [],
    },
  ]);
}
  } catch {
    setMessages(prev => [
      ...prev,
      { sender: "bot", text: "Something went wrong 😢" },
    ]);
  } finally {
    setLoading(false);
  }
};


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
const createTicketFromChat = async () => {
  try {
    const chatTranscript = messages
      .map(m => {
        const sender = m.sender === "user" ? "User" : "BizNova";

        let text = `${sender}: ${m.text || ""}`;

        if (m.files && m.files.length > 0) {
          const files = m.files.map(f => `[File: ${f.name}]`).join(", ");
          text += ` ${files}`;
        }

        return text;
      })
      .join("\n\n");

    const finalDescription = `
--- Customer Additional Description ---
${ticketDescription}

--- Chat Transcript ---
${chatTranscript}
    `;
const lastUserMessage = [...messages]
  .reverse()
  .find(m => m.sender === "user")?.text;
    const res = await api.post("/tickets", {
       subject: lastUserMessage?.slice(0, 80) || "Chat Support Request",
      description: finalDescription,
      priority: "medium",
      tenantSlug,
        user
    });

    setMessages(prev => [
      ...prev,
      {
        sender: "bot",
        text: `✅ Ticket created successfully! ID: #${res.data.id}`,
      },
    ]);

    // reset states
    setCollectingDescription(false);
    setTicketDescription("");

  } catch {
    setMessages(prev => [
      ...prev,
      {
        sender: "bot",
        text: "❌ Failed to create ticket. Please try again.",
      },
    ]);
  }
};
const loadSessions = async () => {
  try {
    if (!user?.id) return;

    const res = await api.get("/chat-history/sessions", {
      headers: {
        "x-tenant-slug": tenantSlug
      },
      params: {
        user_id: user.id
      }
    });

    const filtered = res.data.filter((s: any) => {
      const expiry = new Date(s.expires_at).getTime();
      return expiry > Date.now();
    });

    setSessions(filtered);

  } catch (err) {
    console.error("Failed to load sessions", err);
  }
};
const loadTickets = async () => {
  try {
    if (!user?.id) {
      console.warn("User ID missing, skipping ticket load");
      return;
    }

    const res = await api.get(
      `/tickets/user/list?user_id=${user.id}`,
      {
        headers: {
          "x-tenant-slug": tenantSlug
        }
      }
    );

    setTickets(res.data);

  } catch (err) {
    console.error("Failed to load tickets", err);
  }
};

useEffect(() => {
  if (!isOpen) return;

  const newSession = "bznv_" + crypto.randomUUID();

  const loadQuickActions = async () => {
    try {
      const res = await api.get("/knowledge/quick-actions", {
        headers: { "x-tenant-slug": tenantSlug }
      });

      console.log("QuickActions:", res.data); // 🔍 debug

      setQuickActions(res.data);
    } catch (err) {
      console.error("Failed to load quick actions", err);
    }
  };

  // ✅ ALWAYS load quick actions
  loadQuickActions();
 setActiveProduct(null);
  // ✅ Session always
  setSessionId(newSession);
  setActiveSession(newSession);
  setMessages([]);

  // ⚠️ ONLY load these if user exists
  if (user?.id) {
    loadSessions();
    loadTickets();
  }

}, [isOpen]); // ✅ ADD THIS
const openSession = async (sessionId: string) => {
  try {
    const res = await api.get(`/chat-history/${sessionId}`, {
      headers: {
        "x-tenant-slug": tenantSlug
      }
    });

    const mapped = res.data.map((m: any) => ({
      sender: m.sender,
      text: m.message,
      files: []
    }));

    setMessages(mapped);
    setSessionId(sessionId);
    setActiveSession(sessionId);
    setShowSessions(false);

  } catch (err) {
    console.error("Failed loading chat", err);
  }
};
const closePanels = () => {
  setShowSessions(false);
  setShowTicketsPanel(false);
};
const handleQuickAction = async (q: any) => {
  if (!sessionId) {
    const newSession = "bznv_" + crypto.randomUUID();
    setSessionId(newSession);
  }

const query = q.quick_action_label || q.title;

  const updatedMessages: ChatMessage[] = [
    ...messages,
    {
      sender: "user",
      text: q.quick_action_label,
      files: []
    }
  ];

  setMessages(updatedMessages);
  setLoading(true);

  try {
    const response = await askChatBot(
      query,
      [],
      tenantSlug,
      null,
      sessionId ?? undefined,
      user
    );

    setMessages(prev => [
      ...prev,
      {
        sender: "bot",
        text: response.text,
        files: response.files || []
      }
    ]);

  } catch {
    setMessages(prev => [
      ...prev,
      { sender: "bot", text: "Something went wrong 😢" }
    ]);
  } finally {
    setLoading(false);
  }
};
  return (
    <>
      {/* Floating Chat Icon with Heartbeat - LARGER SIZE */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-50 group"
      >
        {/* Heartbeat ring animation - LARGER */}
        <div className="absolute -inset-6">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-heartbeat" />
          <div className="absolute inset-3 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 animate-heartbeat" style={{ animationDelay: '0.3s' }} />
        </div>

        {/* Main icon container - LARGER */}
       
          {/* Glow effect */}
          
                  <div className="absolute -inset-2 animate-ping rounded-full bg-purple-500/20" />

          {/* Icon content - LARGER */}
         {/* Icon content - LARGER */}
<div className="relative w-[130px] h-[130px]  overflow-hidden  transition-colors p-2">
  <div >
    <img 
      src={gif}  
      alt="BizNova"
      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
    />
  </div>
</div>
          
          {/* Live indicator - LARGER */}
       
    <div className="text-center">
  <div className="bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold text-sm">
    Hi I'm BizNova
  </div>

</div>

        {/* Tooltip - Adjusted position */}
        <div className="absolute right-28 bottom-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white px-4 py-2 rounded-xl text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap shadow-2xl border border-gray-700 transform translate-x-4 group-hover:translate-x-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="font-semibold">Chat with BizNova AI</span>
          </div>
          <p className="text-gray-300 text-xs mt-1">Instant intelligent support</p>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rotate-45 w-2 h-2 bg-gray-900 border-r border-b border-gray-700" />
        </div>
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end p-4">
          {/* Backdrop with blur */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-black/60 via-purple-900/20 to-blue-900/20 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Chat Container */}
          <div className="relative w-full max-w-md h-[85vh] bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 rounded-3xl border border-gray-800/50 shadow-2xl flex flex-col animate-slideIn overflow-hidden">
            {/* Glass effect header */}
            <div className="p-5 border-b border-gray-800/50 bg-gradient-to-r from-gray-900/80 via-gray-900/90 to-gray-900/80 backdrop-blur-xl">
              <div className="flex justify-between items-center relative">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {/* Avatar with glow */}
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 p-0.5">
                      <div className="w-full h-full rounded-2xl bg-gray-900 flex items-center justify-center overflow-hidden">
                        <img 
                          src={logo}
                          alt="BizNova"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = `
                              <div class="w-full h-full rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                                <span class="text-white font-bold text-lg">BN</span>
                              </div>
                            `;
                          }}
                        />
                      </div>
                    </div>
                    {/* Online indicator */}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 border-2 border-gray-950 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent animate-gradient">
                        BizNova AI
                      </h3>
                      <span className="px-2 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30">
                        <Zap className="w-3 h-3 inline mr-1" />
                        AI Assistant
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Active now
                      </span>
                      • Replies instantly
                    </p>
                  </div>
                </div>
<div className="flex items-center gap-2">

  {/* 🟦 CHAT HISTORY */}
  <button
    onClick={() => {
      setShowSessions(prev => !prev);
      setShowTicketsPanel(false);
       setLastPanel("history");
    }}
    className="p-2 rounded-lg hover:bg-gray-800 transition group"
    title="Previous Chats"
  >
    <History className="w-5 h-5 text-gray-400 group-hover:text-white" />
  </button>

  {/* 🟣 TICKETS */}
  <button
   onClick={() => {
      setShowTicketsPanel(prev => !prev);
      setShowSessions(false);
       setLastPanel("tickets");
    }}
    className="p-2 rounded-lg hover:bg-gray-800 transition group"
    title="Your Tickets"
  >
  <Ticket className="w-5 h-5 text-yellow-400 group-hover:text-white" />
  </button>

  {/* ❌ CLOSE */}
  <button 
    onClick={() => setIsOpen(false)}
    className="p-2.5 hover:bg-gray-800/50 rounded-xl transition-all duration-200 hover:rotate-90 group"
  >
    <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
  </button>

</div>
</div>
</div>
          {showSessions && (
  <div className="absolute top-[70px] right-5 w-72 max-h-[400px] overflow-y-auto 
  bg-gray-950 border border-gray-800 rounded-xl shadow-2xl z-50">

    {/* 🟦 CHAT HISTORY */}
<div className="p-3 border-b border-gray-800 flex items-center gap-2">
  <button
    onClick={closePanels}
    className="text-gray-400 hover:text-white transition"
  >
    <ArrowLeft className="w-4 h-4" />
  </button>

  <span className="text-sm text-gray-400">Chats</span>
</div>

    {sessions.length === 0 && (
      <div className="p-3 text-xs text-gray-500">
        No previous chats
      </div>
    )}

    {sessions.map((s) => (
      <div
        key={s.session_id}
        onClick={() => openSession(s.session_id)}
        className={`p-3 border-b border-gray-900 cursor-pointer hover:bg-gray-900 transition
        ${activeSession === s.session_id ? "bg-blue-600/10" : ""}`}
      >
        <p className="text-sm text-gray-200 truncate">
          {s.title || "New chat"}
        </p>

        <p className="text-xs text-gray-500 mt-1">
          {new Date(s.created_at).toLocaleDateString()}
        </p>
      </div>
    ))}

   

    {/* ➕ NEW CHAT */}
    <button
      onClick={() => {
        const newSession = "bznv_" + crypto.randomUUID();
        setSessionId(newSession);
        setActiveSession(newSession);
        setMessages([]);
        setShowSessions(false);
      }}
      className="w-full text-left p-3 border-t border-gray-800 text-blue-400 hover:bg-gray-900"
    >
      + Start New Chat
    </button>

  </div>
)}
{showTicketsPanel && (
  <div className="absolute top-[70px] right-5 w-72 max-h-[400px] overflow-y-auto 
  bg-gray-950 border border-gray-800 rounded-xl shadow-2xl z-50">

    {/* 🟣 HEADER */}
 <div className="p-3 border-b border-gray-800 flex items-center gap-2">
  <button
    onClick={closePanels}
    className="text-gray-400 hover:text-white transition"
  >
  <ArrowLeft className="w-4 h-4" />
  </button>

  <span className="text-sm text-purple-400">Your Tickets</span>
</div>

    {/* EMPTY */}
    {tickets.length === 0 && (
      <div className="p-3 text-xs text-gray-500">
        No tickets yet
      </div>
    )}

    {/* LIST */}
    {tickets.map((t) => (
      <div
        key={t.id}
        onClick={() => {
          setShowTicketsPanel(false);

          setMessages(prev => [
            ...prev,
            {
              sender: "bot",
              text: `🎫 Ticket #${t.id}\nStatus: ${t.status}\nSubject: ${t.subject}`,
            },
          ]);

  setShowTicketsPanel(false);
        }}
        className="p-3 border-b border-gray-900 cursor-pointer hover:bg-gray-900 transition"
      >
        <p className="text-sm text-purple-300 truncate">
          #{t.id} - {t.subject}
        </p>

        <p className="text-xs text-gray-500 mt-1">
          {t.status} • {new Date(t.created_at).toLocaleDateString()}
        </p>
      </div>
      
    ))}
{/* ➕ CREATE NEW TICKET */}
<button
onClick={() => {
  setShowTicketsPanel(false);

  const activeUser = user || tempUser;

  if (!activeUser?.email && !activeUser?.phone) {
    // ❗ Ask email first
    setCollectingEmailForTicket(true);

    setMessages(prev => [
      ...prev,
      {
        sender: "bot",
        text: "Before raising a ticket, please provide your registered email or phone number.",
      },
    ]);
  } else {
    // ✅ Already verified → go to description
    setCollectingDescription(true);

    setMessages(prev => [
      ...prev,
      {
        sender: "bot",
        text: "Please describe your issue so our support team can help you.",
      },
    ]);
  }
}}
  className="w-full text-left p-3 border-b border-gray-800 
  text-green-400 hover:bg-gray-900 transition font-medium"
>
  + Create New Ticket
</button>
  </div>
)}
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-gray-950 via-gray-950 to-gray-900">
              {/* Welcome message */}
              {lastPanel && messages.length > 0 && (
  <div className="flex justify-center mb-3">
    <button
      onClick={() => {
        if (lastPanel === "history") {
          setShowSessions(true);
        }

        if (lastPanel === "tickets") {
          setShowTicketsPanel(true);
        }

        setMessages([]); // clear current view
      }}
      className="flex items-center gap-2 px-4 py-2 text-xs 
      bg-gray-800/80 border border-gray-700 rounded-full 
      text-gray-300 hover:bg-gray-700 transition"
    >
      <ArrowLeft className="w-3 h-3" />

      {lastPanel === "history" ? "Back to chats" : "Back to tickets"}
    </button>
  </div>
)}
              {messages.length === 0 ? (
                <div className="space-y-6">
                  {/* Welcome card */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 p-0.5 flex-shrink-0">
                      <div className="w-full h-full rounded-xl bg-gray-900 flex items-center justify-center overflow-hidden">
                        <img 
                          src={logo} 
                          alt="BizNova"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = `
                              <div class="w-full h-full rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                                <span class="text-white font-bold text-xs">BN</span>
                              </div>
                            `;
                          }}
                        />
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 border border-gray-800/50 rounded-2xl rounded-tl-none p-5 shadow-lg backdrop-blur-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <h4 className="font-bold text-white text-base">BizNova AI Assistant</h4>
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                      </div>
                      <p className="text-gray-200 text-sm leading-relaxed">
                        Hello there! 👋 I'm your BizNova AI Assistant, powered by advanced intelligence. 
                        I'm here to help you with any questions, support issues, or guidance you need. 
                        Feel free to ask me anything!
                      </p>

                      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-800/50">
                        <div className="flex gap-1">
                          {["AI", "24/7", "Fast"].map((tag, i) => (
                            <span key={i} className="px-2 py-1 bg-gray-800/50 text-gray-300 text-xs rounded-lg border border-gray-700">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                    </div>
                  </div>
                 {quickActions.length > 0 && messages.length === 0 && (
  <div className="mt-6 ml-12">

    {/* 🔥 HEADER */}
    <p className="text-sm text-gray-400 mb-3">
      You can ask about:
    </p>

    {/* 🔥 QUESTIONS LIST */}
    <div className="space-y-2">
      {quickActions.map((q) => {
        const question = q.quick_action_label || q.title;

        return (
          <button
            key={q.id}
            onClick={() => handleQuickAction(q)}
            className="w-full text-left px-4 py-3 
              bg-gray-900/70 border border-gray-700 
              rounded-xl text-sm text-gray-200
              hover:bg-gray-800 hover:border-blue-500/50
              transition-all duration-200"
          >
            {question}
          </button>
        );
      })}
    </div>

  </div>
)}
                </div>
                
              ) : (
                <>
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"} group`}
                    >
                      {m.sender === "bot" && (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 p-0.5 flex-shrink-0 mt-1 mr-3">
                          <div className="w-full h-full rounded-xl bg-gray-900 flex items-center justify-center overflow-hidden">
                            <img 
                              src={logo} 
                              alt="BizNova"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement!.innerHTML = `
                                  <div class="w-full h-full rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                                    <span class="text-white font-bold text-xs">BN</span>
                                  </div>
                                `;
                              }}
                            />
                          </div>
                        </div>
                      )}


                      <div className={`max-w-[80%] ${m.sender === "user" ? "order-1" : "order-2"}`}>
                        <div className={`rounded-2xl p-5 shadow-lg backdrop-blur-sm ${
                          m.sender === "user" 
                            ? "bg-gradient-to-r from-blue-600/90 via-blue-700/90 to-blue-600/90 text-white rounded-br-none border border-blue-500/30" 
                            : "bg-gradient-to-r from-gray-900/80 to-gray-800/80 border border-gray-800/50 text-gray-200 rounded-tl-none"
                        }`}>
                       {m.files && m.files.length > 0 && (
  <div className="mb-3 space-y-2">
    {m.files.map((file, idx) => (
      <div key={idx}>
        {file.type?.startsWith("image") ? (
          <img
            src={file.url}
            alt={file.name}
            className="max-w-[220px] rounded-xl border border-gray-700 shadow-md"
          />
        ) : (
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 bg-gray-800/70 rounded-xl border border-gray-700 hover:bg-gray-700 transition cursor-pointer"
          >
            <Paperclip className="w-5 h-5 text-red-400" />
            <span className="text-sm text-white truncate flex-1">
              {file.name}
            </span>
            <span className="text-xs text-blue-400 underline">
              Open
            </span>
          </a>
        )}
      </div>
    ))}
  </div>
)}

{m.text && (
  <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
)}

                        </div>
                      </div>
                      {m.sender === "user" && (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 mt-1 ml-3 shadow-lg">
                          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                            <span className="text-white font-bold text-xs">You</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

{showTicketConfirm && !collectingDescription && (
  <div className="flex gap-3 mt-2 ml-12">
    <button
      onClick={() => {
        setCollectingDescription(true);
        setShowTicketConfirm(false);

        setMessages(prev => [
          ...prev,
          {
            sender: "bot",
            text: "Please describe your issue briefly so our support team can help you better.",
          },
        ]);
      }}
      className="px-3 py-1.5 text-sm bg-green-600/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-600/30"
    >
      Yes
    </button>

    <button
      onClick={() => {
        setShowTicketConfirm(false);

        setMessages(prev => [
          ...prev,
          {
            sender: "bot",
            text: "No problem! Continue chatting 😊",
          },
        ]);
      }}
      className="px-3 py-1.5 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
    >
      No
    </button>
  </div>
)}
{collectingDescription && (
  <div className="mt-4 space-y-3">
    <textarea
      value={ticketDescription}
      onChange={(e) => setTicketDescription(e.target.value)}
      placeholder="Describe your issue..."
      className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-white"
    />

    <button
      onClick={createTicketFromChat}
      className="px-4 py-2 bg-purple-600 rounded-xl hover:bg-purple-700"
    >
      🎫 Submit Ticket
    </button>
  </div>
)}
                </>
              )}

              {/* Loading Indicator */}
              {loading && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 p-0.5 flex-shrink-0">
                    <div className="w-full h-full rounded-xl bg-gray-900 flex items-center justify-center overflow-hidden">
                      <img 
                        src={logo} 
                        alt="BizNova"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = `
                            <div class="w-full h-full rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                              <span class="text-white font-bold text-xs">BN</span>
                            </div>
                          `;
                        }}
                      />
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 border border-gray-800/50 rounded-2xl rounded-tl-none p-5 shadow-lg backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse" style={{animationDelay: "0ms"}}></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse" style={{animationDelay: "150ms"}}></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse" style={{animationDelay: "300ms"}}></div>
                      </div>
                      <span className="text-sm text-gray-300 font-medium">BizNova is thinking...</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Processing your request with AI intelligence</p>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

           {/* Input Area */}
<div className="p-5 border-t border-gray-800/50 bg-gradient-to-r from-gray-900/90 via-gray-900 to-gray-900/90 backdrop-blur-xl">
  <div className="flex gap-3">
    <div className="flex-1 relative">

      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        id="fileInput"
        onChange={e => setFile(e.target.files?.[0] || null)}
      />

      {/* 📎 Attach button on LEFT (inside input) */}
<button
  type="button"
  onClick={() => document.getElementById("fileInput")?.click()}
  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800/50 transition"
  title="Attach image or PDF"
>
  <Paperclip className="w-5 h-5" />
</button>



      {/* Text input */}
      <input
        type="text"
        value={message}
        onChange={e => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Message BizNova AI..."
        className="w-full pl-12 pr-[120px] py-4 bg-gray-900/50 border border-gray-800/50 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent backdrop-blur-sm transition-all"
      />

      {/* Send button */}
      <button
        onClick={sendMessage}
        disabled={(!message.trim() && !file) || loading}
        className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 group"
      >
        <Send className="w-4 h-4 group-hover:rotate-12 transition-transform" />
        Send
      </button>
    </div>
  </div>

  {/* Quick tip */}
  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
    <Sparkles className="w-3 h-3" />
    <span>AI-powered responses • Secure & private</span>
  </div>

  {/* Selected file */}
  {file && (
    <div className="mt-2 text-xs text-gray-400 flex items-center gap-2">
      📎 {file.name}
      <button
        onClick={() => setFile(null)}
        className="text-red-400 hover:text-red-300"
      >
        ✕
      </button>
    </div>
  )}
</div>

          </div>
          
        </div>
      )}

      {/* Custom animations */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%) scale(0.95);
            opacity: 0;
          }
          to {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
        }
        
        @keyframes heartbeat {
          0%, 100% {
            transform: scale(1);
            opacity: 0.2;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.1;
          }
        }

        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-heartbeat {
          animation: heartbeat 2s ease-in-out infinite;
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        .animate-slideIn {
          animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        // /* Custom scrollbar */
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }

        .overflow-y-auto::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
          border-radius: 10px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #7c3aed);
        }
      `}</style>
    </>
  );
}