import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { isAxiosError } from "axios";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileText,
  History,
  MessageCircle,
  Paperclip,
  Plus,
  Send,
  Sparkles,
  Ticket,
  X,
  Zap,
} from "lucide-react";
import { askChatBot } from "../api/chat.api";
import type { AIMessage, ChatMessage, ChatUser } from "../types/chat.types";
import { createChatBoxApi } from "../api/client";
import logo from "../assets/ch4.png?no-inline";
import gif from "../assets/ch.gif?no-inline";

export type ChatBoxProps = {
  apiUrl: string;
  tenantSlug: string;
  token?: string;
  user?: ChatUser;
  product?: string;
  title?: string;
  welcomeMessage?: string;
  botImage?: string;
  launcherImage?: string;
  onMessageSent?: (message: string) => void;
  onError?: (error: unknown) => void;
  onClose?: () => void;
};

type Panel = "chat" | "history" | "tickets";

type ChatSession = {
  session_id: string;
  title?: string;
  created_at: string;
  expires_at?: string;
};

type SupportTicket = {
  id: string | number;
  subject: string;
  status: string;
  created_at: string;
};

type QuickAction = {
  id: string | number;
  title?: string;
  quick_action_label?: string;
};

const makeSessionId = () => `bznv_${crypto.randomUUID()}`;

const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const phoneRegex = /\b\d{10}\b/;

// Show the backend's own message for request problems (file too large, wrong type)
// and for 503 "assistant unavailable"; other 5xx keep the generic text
const errorText = (error: unknown, fallback: string) =>
  isAxiosError(error) &&
  ((error.response?.status ?? 500) < 500 || error.response?.status === 503) &&
  typeof error.response?.data?.text === "string"
    ? error.response.data.text
    : fallback;

export default function ChatBox({
  apiUrl,
  tenantSlug,
  token,
  user,
  product,
  title = "BizNova AI",
  welcomeMessage = "How can we help today?",
  botImage,
  launcherImage,
  onMessageSent,
  onError,
  onClose,
}: ChatBoxProps) {
  const api = useMemo(() => createChatBoxApi(apiUrl, token), [apiUrl, token]);
  const assistantImage = botImage || logo;
  const launcherImageSrc = launcherImage || gif;
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);

  const [panel, setPanel] = useState<Panel>("chat");
  const [sessionId, setSessionId] = useState<string>(() => makeSessionId());
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [showTicketConfirm, setShowTicketConfirm] = useState(false);

  const [collectingEmailForTicket, setCollectingEmailForTicket] = useState(false);
  const [collectingDescription, setCollectingDescription] = useState(false);
  const [ticketDescription, setTicketDescription] = useState("");
  const [tempUser, setTempUser] = useState<ChatUser | null>(null);
  const [activeProduct, setActiveProduct] = useState<string | null>(product || null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const closeChat = () => {
    setIsOpen(false);
    onClose?.();
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, panel]);

  const loadQuickActions = async () => {
    try {
      const res = await api.get("/knowledge/quick-actions", {
        headers: { "x-tenant-slug": tenantSlug },
      });
      setQuickActions(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to load quick actions", error);
      onError?.(error);
    }
  };

  const loadSessions = async () => {
    if (!user?.id) return;

    try {
      const res = await api.get("/chat-history/sessions", {
        headers: { "x-tenant-slug": tenantSlug },
        params: { user_id: user.id },
      });

      const data = Array.isArray(res.data) ? res.data : [];
      setSessions(
        data.filter((session: ChatSession) => {
          if (!session.expires_at) return true;
          return new Date(session.expires_at).getTime() > Date.now();
        }),
      );
    } catch (error) {
      console.error("Failed to load sessions", error);
      onError?.(error);
    }
  };

  const loadTickets = async () => {
    if (!user?.id) {
      setTickets([]);
      return;
    }

    try {
      const res = await api.get("/tickets/user/list", {
        headers: { "x-tenant-slug": tenantSlug },
        params: { user_id: user.id },
      });
      setTickets(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to load tickets", error);
      onError?.(error);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    void loadQuickActions();
    setPanel("chat");
    setActiveProduct(product || null);

    // Start a new session each time the widget is opened.
    const newSession = makeSessionId();
    setSessionId(newSession);
    setActiveSession(newSession);
    setMessages([]);
    setFile(null);
    setShowTicketConfirm(false);
    setCollectingEmailForTicket(false);
    setCollectingDescription(false);
    setTicketDescription("");

    if (user?.id) {
      void loadSessions();
      void loadTickets();
    }
    // The widget should initialize when opened or when tenant/user changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tenantSlug, user?.id, product]);

  const openSession = async (id: string) => {
    try {
      const res = await api.get(`/chat-history/${id}`, {
        headers: { "x-tenant-slug": tenantSlug },
      });

      const mapped: ChatMessage[] = (Array.isArray(res.data) ? res.data : []).map(
        (item: { sender: "user" | "bot"; message: string }) => ({
          sender: item.sender,
          text: item.message,
          files: [],
        }),
      );

      setMessages(mapped);
      setSessionId(id);
      setActiveSession(id);
      setPanel("chat");
      setShowTicketConfirm(false);
    } catch (error) {
      console.error("Failed loading chat", error);
      onError?.(error);
    }
  };

  const startNewChat = () => {
    const newSession = makeSessionId();
    setSessionId(newSession);
    setActiveSession(newSession);
    setMessages([]);
    setPanel("chat");
    setFile(null);
    setMessage("");
    setActiveProduct(product || null);
    setShowTicketConfirm(false);
    setCollectingEmailForTicket(false);
    setCollectingDescription(false);
    setTicketDescription("");
  };

  const sendMessage = async () => {
    if (loading || collectingDescription) return;
    if (!message.trim() && !file) return;

    const currentSessionId = sessionId || makeSessionId();
    if (!sessionId) {
      setSessionId(currentSessionId);
      setActiveSession(currentSessionId);
    }

    const userMessage = message.trim();
    const selectedFile = file;
    const filePreview = selectedFile
      ? {
          name: selectedFile.name,
          type: selectedFile.type,
          url: URL.createObjectURL(selectedFile),
        }
      : undefined;

    const userChatMessage: ChatMessage = {
      sender: "user",
      text: userMessage,
      files: filePreview ? [filePreview] : [],
    };

    setMessage("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setLoading(true);

    const activeUser = user || tempUser;
    const emailMatch = userMessage.match(emailRegex)?.[0];
    const phoneMatch = userMessage.match(phoneRegex)?.[0];

    try {
      onMessageSent?.(userMessage);
      // Ticket identity verification happens before normal chatbot handling.
      if (collectingEmailForTicket) {
        setMessages((prev) => [...prev, userChatMessage]);

        if (!emailMatch && !phoneMatch) {
          setMessages((prev) => [
            ...prev,
            {
              sender: "bot",
              text: "Please enter a valid registered email address or 10-digit phone number.",
            },
          ]);
          return;
        }

        const verifyRes = await askChatBot(
          api,
          userMessage,
          [],
          tenantSlug,
          null,
          currentSessionId,
          { email: emailMatch, phone: phoneMatch },
        );

        if (verifyRes.classification === "not_registered") {
          setMessages((prev) => [
            ...prev,
            {
              sender: "bot",
              text:
                verifyRes.text ||
                "This contact was not found. Please enter a registered email address or phone number.",
            },
          ]);
          return;
        }

        const verifiedUser = {
          ...(activeUser || {}),
          ...(emailMatch ? { email: emailMatch } : {}),
          ...(phoneMatch ? { phone: phoneMatch } : {}),
        } as ChatUser;

        setTempUser(verifiedUser);
        setCollectingEmailForTicket(false);
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: `Contact verified: ${emailMatch || phoneMatch}.`,
          },
          {
            sender: "bot",
            text: "Please describe your issue so our support team can help you.",
          },
        ]);
        setCollectingDescription(true);
        return;
      }

      const updatedMessages = [...messages, userChatMessage];
      setMessages(updatedMessages);

      const historyForAI: AIMessage[] = updatedMessages.slice(-6).map((item) => ({
        role: item.sender === "user" ? "user" : "assistant",
        text: item.text,
      }));

      const enrichedUser = {
        ...(activeUser || {}),
        email: activeUser?.email || emailMatch,
        phone: activeUser?.phone || phoneMatch,
      };

      const response = await askChatBot(
        api,
        userMessage,
        historyForAI,
        tenantSlug,
        selectedFile,
        currentSessionId,
        enrichedUser,
        activeProduct || undefined,
      );

      if (response.classification === "unrelated") {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text:
              response.text ||
              "I can help with BizNova-related questions, product enquiries, and support issues.",
          },
        ]);
      } else if (
        response.classification === "collect_user_for_ticket" ||
        response.classification === "not_registered" ||
        response.classification === "collect_contact"
      ) {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: response.text },
        ]);
      } else if (response.classification === "kb_no_answer") {
        setShowTicketConfirm(true);
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: response.text },
          {
            sender: "bot",
            text: "Would you like to raise a support ticket?",
          },
        ]);
      } else if (response.classification === "raise_ticket") {
        if (!user && !enrichedUser.email && !enrichedUser.phone) {
          setCollectingEmailForTicket(true);
          setMessages((prev) => [
            ...prev,
            {
              sender: "bot",
              text: "Please provide your registered email address or phone number before raising a ticket.",
            },
          ]);
        } else {
          setCollectingDescription(true);
          setMessages((prev) => [
            ...prev,
            {
              sender: "bot",
              text: "Please describe your issue so our support team can help you.",
            },
          ]);
        }
      } else if (response.classification === "product_interest") {
        setActiveProduct(response.product || null);
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: response.text },
        ]);
      } else if (response.classification === "enquiry_done") {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: response.text },
        ]);

        if (response.redirect) {
          window.open(response.redirect, "_blank", "noopener,noreferrer");
        }
        setActiveProduct(null);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: response.text,
            files: response.files || [],
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to send chat message", error);
      onError?.(error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: errorText(
            error,
            "Something went wrong while processing your message. Please try again.",
          ),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (action: QuickAction) => {
    if (loading) return;

    const query = action.quick_action_label || action.title || "";
    if (!query) return;

    const currentSessionId = sessionId || makeSessionId();
    setSessionId(currentSessionId);
    setActiveSession(currentSessionId);
    setPanel("chat");
    setLoading(true);

    const userChatMessage: ChatMessage = { sender: "user", text: query, files: [] };
    // Same recent history as typed messages, so follow-ups after a quick action keep context
    const historyForAI: AIMessage[] = [...messages, userChatMessage].slice(-6).map((item) => ({
      role: item.sender === "user" ? "user" : "assistant",
      text: item.text,
    }));

    setMessages((prev) => [...prev, userChatMessage]);

    try {
      onMessageSent?.(query);
      const response = await askChatBot(
        api,
        query,
        historyForAI,
        tenantSlug,
        null,
        currentSessionId,
        user || tempUser || undefined,
        activeProduct || undefined,
      );

      if (response.classification === "product_interest") {
        setActiveProduct(response.product || null);
      }
      if (response.classification === "kb_no_answer") {
        setShowTicketConfirm(true);
      }
      if (response.classification === "raise_ticket") {
        setCollectingDescription(true);
      }
      if (response.classification === "enquiry_done") {
        setActiveProduct(null);
        if (response.redirect) {
          window.open(response.redirect, "_blank", "noopener,noreferrer");
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: response.text,
          files: response.files || [],
        },
      ]);
    } catch (error) {
      console.error("Quick action failed", error);
      onError?.(error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: errorText(error, "Something went wrong while processing that request."),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const createTicketFromChat = async () => {
    if (!ticketDescription.trim() || loading) return;

    setLoading(true);
    try {
      const chatTranscript = messages
        .map((item) => {
          const sender = item.sender === "user" ? "User" : "BizNova";
          let text = `${sender}: ${item.text || ""}`;

          if (item.files?.length) {
            text += ` ${item.files.map((attached) => `[File: ${attached.name}]`).join(", ")}`;
          }
          return text;
        })
        .join("\n\n");

      const finalDescription = [
        "--- Customer Additional Description ---",
        ticketDescription.trim(),
        "",
        "--- Chat Transcript ---",
        chatTranscript,
      ].join("\n");

      const lastUserMessage = [...messages]
        .reverse()
        .find((item) => item.sender === "user")?.text;

      const activeUser = user || tempUser;
      const res = await api.post(
        "/tickets",
        {
          subject: lastUserMessage?.slice(0, 80) || "Chat Support Request",
          description: finalDescription,
          priority: "medium",
          tenantSlug,
          user: activeUser,
        },
        { headers: { "x-tenant-slug": tenantSlug } },
      );

      const ticketId = res.data?.id ?? res.data?.ticket?.id ?? "created";
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: `Support ticket created successfully. Ticket ID: #${ticketId}`,
        },
      ]);

      setCollectingDescription(false);
      setCollectingEmailForTicket(false);
      setTicketDescription("");
      void loadTickets();
    } catch (error) {
      console.error("Failed to create ticket", error);
      onError?.(error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Failed to create the support ticket. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const renderMessageFiles = (item: ChatMessage) =>
    item.files?.map((attached, index) => (
      <div key={`${attached.name}-${index}`} className="mb-2">
        {attached.type?.startsWith("image/") ? (
          <img
            src={attached.url}
            alt={attached.name}
            className="max-h-56 max-w-full rounded-xl border border-slate-200 object-contain"
          />
        ) : (
          <a
            href={attached.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-blue-700 hover:bg-blue-50"
          >
            <FileText size={16} className="shrink-0" />
            <span className="break-all">{attached.name}</span>
          </a>
        )}
      </div>
    ));

  return (
    <>
      {/* Floating launcher */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={`Open ${title} chat`}
        className="group fixed bottom-5 right-5 z-40 flex items-center gap-3 rounded-full border border-slate-200 bg-white p-2 pr-4 shadow-xl shadow-slate-900/10 transition duration-300 hover:-translate-y-1 hover:shadow-2xl sm:bottom-7 sm:right-7"
      >
        <span className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-slate-950">
          <img src={launcherImageSrc} alt="" className="h-full w-full object-cover" />
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
        </span>
        <span className="text-left">
          <span className="block text-sm font-bold text-slate-900">
            {title}
          </span>
          <span className="mt-0.5 block text-[11px] text-slate-500">
            Ask us anything
          </span>
        </span>
        <MessageCircle
          size={17}
          className="ml-1 text-blue-600 transition group-hover:scale-110"
        />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end sm:p-4 lg:p-6">
          <button
            type="button"
            aria-label="Close chat"
            onClick={closeChat}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[3px]"
          />

          <section
            aria-label={`${title} support chat`}
            className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-[min(800px,calc(100dvh-32px))] sm:max-w-[440px] sm:rounded-[26px] sm:border sm:border-slate-200"
          >
            {/* Header */}
            <header className="relative shrink-0 overflow-hidden bg-slate-950 px-5 pb-4 pt-5">
              <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-blue-600/25 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 left-20 h-36 w-36 rounded-full bg-violet-600/20 blur-3xl" />

              <div className="relative flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-white/10">
                    <img src={assistantImage} alt={title} className="h-full w-full object-cover" />
                    <span className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-950 bg-emerald-400" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-base font-bold tracking-tight text-white">
                        {title}
                      </h2>
                      <span className="rounded-md border border-blue-400/20 bg-blue-400/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-200">
                        <Zap size={10} className="mr-1 inline" />
                        Assistant
                      </span>
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      {welcomeMessage}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    title="Chat history"
                    aria-label="Chat history"
                    onClick={() => {
                      setPanel(panel === "history" ? "chat" : "history");
                      if (panel !== "history") {
                        void loadSessions();
                        setShowTicketConfirm(false);
                      }
                    }}
                    className={`rounded-xl p-2.5 transition ${
                      panel === "history"
                        ? "bg-white/15 text-white"
                        : "text-slate-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <History size={18} />
                  </button>
                  <button
                    type="button"
                    title="Support tickets"
                    aria-label="Support tickets"
                    onClick={() => {
                      setPanel(panel === "tickets" ? "chat" : "tickets");
                      if (panel !== "tickets") {
                        void loadTickets();
                        setShowTicketConfirm(false);
                      }
                    }}
                    className={`rounded-xl p-2.5 transition ${
                      panel === "tickets"
                        ? "bg-white/15 text-white"
                        : "text-slate-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Ticket size={18} />
                  </button>
                  <button
                    type="button"
                    title="Close"
                    aria-label="Close chat"
                    onClick={closeChat}
                    className="rounded-xl p-2.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                  >
                    <X size={19} />
                  </button>
                </div>
              </div>

              <div className="relative mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={15} className="text-blue-300" />
                  <span className="text-xs font-medium text-slate-200">
                    {welcomeMessage}
                  </span>
                </div>
                <span className="rounded-md bg-emerald-400/10 px-2 py-1 text-[9px] font-bold tracking-wider text-emerald-300">
                  ONLINE
                </span>
              </div>
            </header>

            {/* Body */}
            <main className="flex-1 overflow-y-auto bg-slate-50 px-4 py-5 sm:px-5">
              {panel === "history" ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Chat history</h3>
                      <p className="mt-1 text-xs text-slate-500">Pick up where you left off.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPanel("chat")}
                      aria-label="Back to chat"
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-200"
                    >
                      <ArrowLeft size={18} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={startNewChat}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    <Plus size={17} /> Start a new chat
                  </button>

                  {!user?.id ? (
                    <EmptyState
                      icon={<History size={25} />}
                      title="Sign in to view chat history"
                      description="Previous conversations are available to registered users."
                    />
                  ) : sessions.length === 0 ? (
                    <EmptyState
                      icon={<History size={25} />}
                      title="No previous chats"
                      description="Your previous conversations will appear here."
                    />
                  ) : (
                    <div className="space-y-2">
                      {sessions.map((session) => (
                        <button
                          type="button"
                          key={session.session_id}
                          onClick={() => void openSession(session.session_id)}
                          className={`w-full rounded-xl border p-3.5 text-left transition ${
                            activeSession === session.session_id
                              ? "border-blue-300 bg-blue-50"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {session.title || "New conversation"}
                          </p>
                          <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                            <Clock3 size={12} />
                            {new Date(session.created_at).toLocaleDateString()}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : panel === "tickets" ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Support tickets</h3>
                      <p className="mt-1 text-xs text-slate-500">Your support requests in one place.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPanel("chat")}
                      aria-label="Back to chat"
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-200"
                    >
                      <ArrowLeft size={18} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPanel("chat");
                      const activeUser = user || tempUser;

                      if (!activeUser?.email && !activeUser?.phone) {
                        setCollectingEmailForTicket(true);
                        setMessages((prev) => [
                          ...prev,
                          {
                            sender: "bot",
                            text: "Before raising a ticket, please provide your registered email or phone number.",
                          },
                        ]);
                      } else {
                        setCollectingDescription(true);
                        setMessages((prev) => [
                          ...prev,
                          {
                            sender: "bot",
                            text: "Please describe your issue so our support team can help you.",
                          },
                        ]);
                      }
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    <Plus size={17} /> Create support ticket
                  </button>

                  {!user?.id ? (
                    <EmptyState
                      icon={<Ticket size={25} />}
                      title="Sign in to view tickets"
                      description="You can still start a ticket from the chat."
                    />
                  ) : tickets.length === 0 ? (
                    <EmptyState
                      icon={<Ticket size={25} />}
                      title="No tickets yet"
                      description="Your submitted support tickets will appear here."
                    />
                  ) : (
                    <div className="space-y-2">
                      {tickets.map((ticket) => (
                        <button
                          type="button"
                          key={ticket.id}
                          onClick={() => {
                            setPanel("chat");
                            setMessages((prev) => [
                              ...prev,
                              {
                                sender: "bot",
                                text: `Ticket #${ticket.id}\nStatus: ${ticket.status}\nSubject: ${ticket.subject}`,
                              },
                            ]);
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-200 hover:shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold tracking-wider text-blue-600">
                                TICKET #{ticket.id}
                              </p>
                              <p className="mt-1.5 truncate text-sm font-semibold text-slate-800">
                                {ticket.subject}
                              </p>
                            </div>
                            <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                              {ticket.status}
                            </span>
                          </div>
                          <p className="mt-3 text-xs text-slate-500">
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-5">
                  {messages.length === 0 && (
                    <div className="space-y-5">
                      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-950">
                            <img src={assistantImage} alt={title} className="h-full w-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-bold text-slate-900">Welcome to BizNova</h3>
                              <span className="rounded-md bg-blue-50 px-2 py-1 text-[9px] font-bold tracking-wide text-blue-700">
                                AI ASSISTANT
                              </span>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              Ask a question, explore our products, or get help with a support issue. I’m here to help.
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
                          <Zap size={13} className="text-blue-500" />
                          AI-powered assistance
                          <span className="text-slate-300">·</span>
                          Fast support
                        </div>
                      </div>

                      {quickActions.length > 0 && (
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">Popular questions</h4>
                          <p className="mt-1 text-xs text-slate-500">Choose a topic to get started.</p>
                          <div className="mt-3 space-y-2">
                            {quickActions.map((action) => (
                              <button
                                type="button"
                                key={action.id}
                                disabled={loading}
                                onClick={() => void handleQuickAction(action)}
                                className="group flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-left transition hover:border-blue-300 hover:bg-blue-50/60 disabled:opacity-50"
                              >
                                <span className="text-sm font-medium leading-5 text-slate-700 group-hover:text-blue-700">
                                  {action.quick_action_label || action.title}
                                </span>
                                <span className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600">
                                  →
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {messages.map((item, index) => (
                    <div
                      key={`${index}-${item.sender}`}
                      className={`flex items-end gap-2.5 ${
                        item.sender === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {item.sender === "bot" && (
                        <div className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                          <img src={assistantImage} alt={title} className="h-full w-full object-cover" />
                        </div>
                      )}

                      <div className={`min-w-0 max-w-[82%] ${item.sender === "user" ? "order-first" : ""}`}>
                        <div
                          className={`rounded-2xl px-4 py-3 ${
                            item.sender === "user"
                              ? "rounded-br-md bg-blue-600 text-white shadow-sm"
                              : "rounded-bl-md border border-slate-200/80 bg-white text-slate-700 shadow-sm"
                          }`}
                        >
                          {renderMessageFiles(item)}
                          {item.text && (
                            <p className="whitespace-pre-wrap break-words text-[13px] leading-6">
                              {item.text}
                            </p>
                          )}
                        </div>
                        <p className={`mt-1 px-1 text-[10px] text-slate-400 ${item.sender === "user" ? "text-right" : ""}`}>
                          {item.sender === "user" ? "You" : title}
                        </p>
                      </div>

                      {item.sender === "user" && (
                        <div className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-[10px] font-bold text-slate-600">
                          YOU
                        </div>
                      )}
                    </div>
                  ))}

                  {showTicketConfirm && !collectingDescription && (
                    <div className="ml-10 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <p className="text-sm font-semibold text-slate-800">
                        Would you like to create a support ticket?
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowTicketConfirm(false);
                            const activeUser = user || tempUser;
                            if (!activeUser?.email && !activeUser?.phone) {
                              setCollectingEmailForTicket(true);
                              setMessages((prev) => [
                                ...prev,
                                {
                                  sender: "bot",
                                  text: "Please provide your registered email or phone number before raising a ticket.",
                                },
                              ]);
                            } else {
                              setCollectingDescription(true);
                              setMessages((prev) => [
                                ...prev,
                                {
                                  sender: "bot",
                                  text: "Please describe your issue so our support team can help you.",
                                },
                              ]);
                            }
                          }}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          Yes, create ticket
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowTicketConfirm(false);
                            setMessages((prev) => [
                              ...prev,
                              { sender: "bot", text: "No problem. You can continue chatting." },
                            ]);
                          }}
                          className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                        >
                          Continue chat
                        </button>
                      </div>
                    </div>
                  )}

                  {collectingDescription && (
                    <div className="ml-10 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Ticket size={17} className="text-blue-600" />
                        <h4 className="text-sm font-bold text-slate-900">Create support ticket</h4>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        Describe the problem so our support team can assist you.
                      </p>
                      <textarea
                        value={ticketDescription}
                        onChange={(event) => setTicketDescription(event.target.value)}
                        placeholder="Describe your issue..."
                        rows={4}
                        className="mt-3 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      />
                      <button
                        type="button"
                        onClick={() => void createTicketFromChat()}
                        disabled={!ticketDescription.trim() || loading}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <CheckCircle2 size={16} />
                        {loading ? "Submitting..." : "Submit ticket"}
                      </button>
                    </div>
                  )}

                  {loading && (
                    <div className="flex items-end gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <img src={assistantImage} alt={title} className="h-full w-full object-cover" />
                      </div>
                      <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
                        <div className="flex items-center gap-2.5">
                          <div className="flex gap-1">
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500 [animation-delay:150ms]" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500 [animation-delay:300ms]" />
                          </div>
                          <span className="text-xs font-medium text-slate-500">BizNova is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </main>

            {/* Composer */}
            {panel === "chat" && (
              <footer className="shrink-0 border-t border-slate-200/80 bg-white px-4 pb-4 pt-3 sm:px-5">
                {file && (
                  <div className="mb-2 flex items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <Paperclip size={15} className="shrink-0 text-blue-600" />
                      <span className="truncate text-xs font-medium text-slate-700">{file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      aria-label="Remove attachment"
                      className="rounded-md p-1 text-slate-500 hover:bg-blue-100 hover:text-red-500"
                    >
                      <X size={15} />
                    </button>
                  </div>
                )}

                <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 transition focus-within:border-blue-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(event) => setFile(event.target.files?.[0] || null)}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach image or PDF"
                    aria-label="Attach file"
                    disabled={loading || collectingDescription}
                    className="mb-0.5 shrink-0 rounded-xl p-2.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 disabled:opacity-40"
                  >
                    <Paperclip size={19} />
                  </button>

                  <input
                    type="text"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading || collectingDescription}
                    placeholder={
                      collectingEmailForTicket
                        ? "Enter registered email or phone..."
                        : collectingDescription
                          ? "Use the ticket form above..."
                          : "Type your message..."
                    }
                    className="min-w-0 flex-1 bg-transparent px-1 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                  />

                  <button
                    type="button"
                    onClick={() => void sendMessage()}
                    disabled={(!message.trim() && !file) || loading || collectingDescription}
                    aria-label="Send message"
                    className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                  >
                    <Send size={17} />
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-center gap-1.5">
                  <Sparkles size={12} className="text-blue-500" />
                  <p className="text-[10px] font-medium text-slate-400">
                    Powered by {title}
                  </p>
                </div>
              </footer>
            )}
          </section>
        </div>
      )}
    </>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        {icon}
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-700">{title}</p>
      <p className="mx-auto mt-1 max-w-[240px] text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}
