import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import api from "../../api/axios";

export default function AdminTicketDetail() {
  const { id } = useParams();
  const [ticket, setTicket] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  const [updating, setUpdating] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/tickets/${id}`);
      setTicket(res.data.ticket);
      
      // Parse messages from the response
      if (res.data.messages && res.data.messages.length > 0) {
        // If messages is an array of message objects
        setMessages(res.data.messages);
      } else if (res.data.ticket.description) {
        // If description contains the chat transcript, parse it
        const parsedMessages = parseChatFromDescription(res.data.ticket.description);
        setMessages(parsedMessages);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error("Failed to fetch ticket:", error);
    } finally {
      setLoading(false);
    }
  };

  // Parse chat messages from the description format
const parseChatFromDescription = (description: string) => {
  if (!description) return [];

  const messages: any[] = [];
  let additionalDescription = "";

  // ✅ 1. Extract Additional Description
  const descMatch = description.match(
    /--- Customer Additional Description ---\s*([\s\S]*?)\s*--- Chat Transcript ---/
  );

  if (descMatch && descMatch[1].trim()) {
    additionalDescription = descMatch[1].trim();
  }

  // ✅ 2. Extract Chat Transcript FIRST
  const transcriptMatch = description.match(
    /--- Chat Transcript ---\s*([\s\S]*)/
  );

  if (transcriptMatch) {
    const lines = transcriptMatch[1].split("\n");

    let currentSender = "";
    let currentMessage = "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const userMatch = trimmed.match(/^(User|Customer):\s*(.*)/i);
      const botMatch = trimmed.match(/^(BizNova|Admin|Support):\s*(.*)/i);

if (userMatch || botMatch) {
  if (currentSender && currentMessage) {
    messages.push({
      sender: currentSender,
      message: currentMessage.trim(),
      timestamp: new Date().toISOString(),
    });
  }

  if (userMatch) {
    currentSender = "user";
    currentMessage = userMatch[2];
  } else if (botMatch) {
    currentSender = "admin";
    currentMessage = botMatch[2];
  }
}
    }

    if (currentSender && currentMessage) {
      messages.push({
        sender: currentSender,
        message: currentMessage.trim(),
        timestamp: new Date().toISOString(),
      });
    }
  }

  // ✅ 3. PUSH DESCRIPTION AT THE END
  if (additionalDescription) {
    messages.push({
      sender: "user",
      message: additionalDescription,
      timestamp: new Date().toISOString(),
      type: "description",
    });
  }

  return messages;
};

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const updateStatus = async (status: string) => {
    try {
      setUpdating(true);
      await api.put(`/tickets/${id}/status`, { status });
      await fetchData();
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setUpdating(false);
    }
  };




  const getStatusColor = (status: string) => {
    const colors = {
      open: "bg-green-500/20 text-green-400",
      in_progress: "bg-yellow-500/20 text-yellow-400",
      closed: "bg-red-500/20 text-red-400",
    };
    return colors[status as keyof typeof colors] || "bg-slate-500/20 text-slate-400";
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: "bg-red-500/20 text-red-400",
      medium: "bg-blue-500/20 text-blue-400",
      low: "bg-slate-600/20 text-slate-400",
    };
    return colors[priority as keyof typeof colors] || "bg-slate-500/20 text-slate-400";
  };

  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ticket not found</h2>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-purple-600 rounded-xl hover:bg-purple-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 min-h-screen bg-gradient-to-br from-slate-950 to-black text-white">
      <div className="max-w-4xl mx-auto bg-slate-900/80 
      border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">
                Ticket #{ticket.id}
              </h1>
              <span className={`px-3 py-1 text-xs rounded-lg ${getPriorityColor(ticket.priority)}`}>
                {ticket.priority}
              </span>
            </div>
            <p className="text-slate-400 text-lg">
              {ticket.subject}
            </p>
            <div className="mt-4 bg-slate-950/60 border border-slate-800 
rounded-xl p-4 text-sm space-y-1">

  <div className="text-slate-400 text-xs mb-2">
    Customer Information
  </div>

  {ticket.name && (
    <div>
      <span className="text-slate-500">Name:</span>{" "}
      <span className="text-white">{ticket.name}</span>
    </div>
  )}

  {ticket.email && (
    <div>
      <span className="text-slate-500">Email:</span>{" "}
      <span className="text-blue-400">{ticket.email}</span>
    </div>
  )}

  {ticket.phone && (
    <div>
      <span className="text-slate-500">Phone:</span>{" "}
      <span className="text-white">{ticket.phone}</span>
    </div>
  )}

  {ticket.tenant_slug && (
    <div>
      <span className="text-slate-500">Source:</span>{" "}
      <span className="text-purple-400">{ticket.tenant_slug}</span>
    </div>
  )}

</div>
          </div>

          <span className={`px-4 py-2 text-sm rounded-xl font-medium ${getStatusColor(ticket.status)}`}>
            {ticket.status === "in_progress" ? "IN PROGRESS" : ticket.status.toUpperCase()}
          </span>
        </div>

        {/* Chat View */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 
                      max-h-[450px] overflow-y-auto space-y-4 mb-4"
             style={{ minHeight: "300px" }}>
          
          {messages.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No messages yet
            </div>
          ) : (
            messages.map((msg: any, i: number) => (
              <div
                key={i}
                className={`flex ${
                  msg.sender === "admin" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm shadow-md ${
                    msg.sender === "admin"
                      ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-br-none"
                      : msg.sender === "user"
                      ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-tl-none"
                      : "bg-slate-800 text-slate-200 border border-slate-700"
                  }`}
                >
                  <div className="text-xs opacity-75 mb-1 flex justify-between items-center">
                    <span>
                      {msg.sender === "admin" 
                        ? "Support Agent" 
                        : msg.sender === "user" 
                        ? "Customer" 
                        : "System"}
                    </span>
                    {msg.timestamp && (
                      <span className="ml-2">
                        {formatTime(msg.timestamp)}
                      </span>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap break-words">
                    {msg.message}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Reply Input */}
       

        {/* Status Controls */}
        <div className="mt-8">
          <label className="text-sm text-slate-400 block mb-3">
            Update Status:
          </label>
          <div className="flex gap-3">
            {["open", "in_progress", "closed"].map(status => (
              <button
                key={status}
                onClick={() => updateStatus(status)}
                disabled={updating || ticket.status === status}
                className={`px-4 py-2 rounded-xl text-sm transition-all flex-1
                  ${ticket.status === status
                    ? "bg-purple-600 text-white cursor-default"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                  } disabled:opacity-50 disabled:cursor-not-allowed
                  ${updating ? "animate-pulse" : ""}
                `}
              >
                {status === "in_progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Metadata */}
        <div className="mt-6 text-xs text-slate-500 flex justify-between pt-4 border-t border-slate-800">
          <span>Created: {new Date(ticket.created_at).toLocaleString()}</span>
          {ticket.updated_at && (
            <span>Updated: {new Date(ticket.updated_at).toLocaleString()}</span>
          )}
        </div>
      </div>
    </div>
  );
}