import { useEffect, useState, useMemo, useCallback } from "react";
import api from "../../api/axios";
import { 
  MessageSquare,
  User,
  Bot,
  Search,
  Clock,
  ChevronRight,
  Loader2,
  ChevronDown,
  Filter,
  Hash,
  Globe,
  Download,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

type Session = {
  session_id: string;
  tenant_slug: string;
  product_slug?: string;
  title: string;
  created_at: string;
  message_count: number;
    name?: string
  email?: string
  phone?: string
  last_message?: string;
  last_message_time?: string;

  sentiment?: 'positive' | 'neutral' | 'negative';
};

type Message = {
  sender: "user" | "bot";
  message: string;
  created_at: string;
  metadata?: {
    tokens?: number;
    response_time?: number;
  };
};

type DateRange = 'today' | 'week' | 'month' | 'custom' | 'all';
type SortOption = 'newest' | 'oldest' | 'most_messages' | 'least_messages';

export default function Conversations() {
  // State management
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [expandedSessions, setExpandedSessions] = useState<{[key: string]: Message[]}>({});
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState<{[key: string]: boolean}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange>("week");
  const [customDateStart, setCustomDateStart] = useState<string>("");
  const [customDateEnd, setCustomDateEnd] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Statistics


  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [sessions, searchTerm, selectedTenant, dateRange, customDateStart, customDateEnd, sortBy, ]);



  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/admin/chat-history");
      setSessions(res.data);
    } catch (error) {
      console.error("Failed to load sessions:", error);
      setError("Failed to load conversations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

const totalSessions = sessions.length;

const totalMessages = sessions.reduce(
  (acc, s) => acc + (s.message_count || 0),
  0
);

const uniqueTenants = new Set(
  sessions.map(s => s.tenant_slug)
).size;

const today = new Date();
today.setHours(0, 0, 0, 0);

const activeToday = sessions.filter(
  s => new Date(s.created_at) >= today
).length;

  const applyFiltersAndSort = () => {
    let filtered = [...sessions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(session => 
        session.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.tenant_slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.last_message?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Tenant filter
    if (selectedTenant !== "all") {
      filtered = filtered.filter(session => session.tenant_slug === selectedTenant);
    }



    // Date range filter
    if (dateRange !== "all") {
const now = new Date();

const today = new Date();
today.setHours(0, 0, 0, 0);

const weekAgo = new Date();
weekAgo.setDate(now.getDate() - 7);

const monthAgo = new Date();
monthAgo.setMonth(now.getMonth() - 1);

      filtered = filtered.filter(session => {
        const sessionDate = new Date(session.created_at);
        switch (dateRange) {
          case "today":
            return sessionDate >= today;
          case "week":
            return sessionDate >= weekAgo;
          case "month":
            return sessionDate >= monthAgo;
          case "custom":
            if (customDateStart && customDateEnd) {
              return sessionDate >= new Date(customDateStart) && 
                     sessionDate <= new Date(customDateEnd);
            }
            return true;
          default:
            return true;
        }
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "most_messages":
          return (b.message_count || 0) - (a.message_count || 0);
        case "least_messages":
          return (a.message_count || 0) - (b.message_count || 0);
        default:
          return 0;
      }
    });

    setFilteredSessions(filtered);
    setTotalItems(filtered.length);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleRefresh = () => {
    loadSessions();
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(filteredSessions, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `conversations_${new Date().toISOString()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const toggleSession = useCallback(async (sessionId: string, tenant: string) => {
    if (openSessionId === sessionId) {
      setOpenSessionId(null);
    } else {
      setOpenSessionId(sessionId);
      
      if (!expandedSessions[sessionId]) {
        try {
          setLoadingMessages(prev => ({ ...prev, [sessionId]: true }));
          const res = await api.get(`/chat-history/${sessionId}`, {
            headers: { "x-tenant-slug": tenant }
            
          });
          setExpandedSessions(prev => ({
            ...prev,
            [sessionId]: res.data
          }));
        } catch (error) {
          console.error("Failed to load messages:", error);
        } finally {
          setLoadingMessages(prev => ({ ...prev, [sessionId]: false }));
        }
      }
    }
  }, [openSessionId, expandedSessions]);

  // Pagination
  const paginatedSessions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredSessions.slice(startIndex, endIndex);
  }, [filteredSessions, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTenantOptions = () => {
    const tenants = Array.from(new Set(sessions.map(s => s.tenant_slug)));
    return ['all', ...tenants];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/10 to-black flex items-center justify-center">
        <div className="relative">
          <Loader2 className="h-16 w-16 text-purple-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 bg-purple-500/20 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/10 to-black">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header with Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Conversations Analytics
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Monitor and analyze all customer conversations
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 
                       transition-colors group"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4 text-slate-400 group-hover:text-purple-400 
                                  transition-colors" />
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 
                       transition-colors flex items-center gap-2 text-sm text-slate-300 
                       hover:text-white"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

  {/* Total Conversations */}
  <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-xl 
                border border-purple-500/20 p-4 backdrop-blur-sm">
    <div className="flex items-center justify-between mb-2">
      <MessageSquare className="h-5 w-5 text-purple-400" />
      <span className="text-xs text-purple-400">+{activeToday} today</span>
    </div>
    <div className="text-2xl font-bold text-white">{totalSessions}</div>
    <div className="text-xs text-slate-400 mt-1">Total Conversations</div>
  </div>

  {/* Total Messages */}
  <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl 
                border border-blue-500/20 p-4 backdrop-blur-sm">
    <div className="flex items-center justify-between mb-2">
      <Hash className="h-5 w-5 text-blue-400" />
      <span className="text-xs text-blue-400">
        {totalSessions > 0 ? (totalMessages / totalSessions).toFixed(1) : 0} avg
      </span>
    </div>
    <div className="text-2xl font-bold text-white">{totalMessages}</div>
    <div className="text-xs text-slate-400 mt-1">Total Messages</div>
  </div>

  {/* Active Tenants */}
  <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl 
                border border-green-500/20 p-4 backdrop-blur-sm">
    <div className="flex items-center justify-between mb-2">
      <Globe className="h-5 w-5 text-green-400" />
      <span className="text-xs text-green-400">{uniqueTenants} active</span>
    </div>
    <div className="text-2xl font-bold text-white">{uniqueTenants}</div>
    <div className="text-xs text-slate-400 mt-1">Active Tenants</div>
  </div>

</div>
        {/* Search and Filters */}
        <div className="bg-black/40 rounded-xl border border-white/10 p-4 mb-6 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by title, tenant, or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg 
                         text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 
                         transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 
                           hover:text-slate-400"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 rounded-lg border transition-all flex items-center gap-2
                ${showFilters 
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' 
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}
            >
              <Filter className="h-4 w-4" />
              Filters
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Expanded Filters */}
      {showFilters && (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/10">
    {/* Tenant Filter */}
    <div>
      <label className="block text-xs text-slate-400 mb-1">Tenant</label>
      <select
        value={selectedTenant}
        onChange={(e) => setSelectedTenant(e.target.value)}
        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg 
                 text-slate-300 text-sm focus:outline-none focus:border-purple-500
                 [&>option]:bg-slate-800 [&>option]:text-slate-200"
      >
        <option value="all" className="bg-slate-800 text-slate-200">All Tenants</option>
        {getTenantOptions().filter(t => t !== 'all').map(tenant => (
          <option key={tenant} value={tenant} className="bg-slate-800 text-slate-200">
            {tenant}
          </option>
        ))}
      </select>
    </div>

    {/* Date Range Filter */}
    <div>
      <label className="block text-xs text-slate-400 mb-1">Date Range</label>
      <select
        value={dateRange}
        onChange={(e) => setDateRange(e.target.value as DateRange)}
        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg 
                 text-slate-300 text-sm focus:outline-none focus:border-purple-500
                 [&>option]:bg-slate-800 [&>option]:text-slate-200"
      >
        <option value="today" className="bg-slate-800 text-slate-200">Today</option>
        <option value="week" className="bg-slate-800 text-slate-200">Last 7 Days</option>
        <option value="month" className="bg-slate-800 text-slate-200">Last 30 Days</option>
        <option value="custom" className="bg-slate-800 text-slate-200">Custom Range</option>
      </select>
    </div>

    {/* Custom Date Range */}
    {dateRange === 'custom' && (
      <>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Start Date</label>
          <input
            type="date"
            value={customDateStart}
            onChange={(e) => setCustomDateStart(e.target.value)}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg 
                     text-slate-300 text-sm focus:outline-none focus:border-purple-500
                     [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">End Date</label>
          <input
            type="date"
            value={customDateEnd}
            onChange={(e) => setCustomDateEnd(e.target.value)}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg 
                     text-slate-300 text-sm focus:outline-none focus:border-purple-500
                     [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
          />
        </div>
      </>
    )}

    {/* Sort By */}
    <div>
      <label className="block text-xs text-slate-400 mb-1">Sort By</label>
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value as SortOption)}
        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg 
                 text-slate-300 text-sm focus:outline-none focus:border-purple-500
                 [&>option]:bg-slate-800 [&>option]:text-slate-200"
      >
        <option value="newest" className="bg-slate-800 text-slate-200">Newest First</option>
        <option value="oldest" className="bg-slate-800 text-slate-200">Oldest First</option>
        <option value="most_messages" className="bg-slate-800 text-slate-200">Most Messages</option>
        <option value="least_messages" className="bg-slate-800 text-slate-200">Least Messages</option>
      </select>
    </div>
  </div>
)}
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl 
                        flex items-center gap-3 text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
            <button 
              onClick={handleRefresh}
              className="ml-auto text-sm hover:text-red-300 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-400">
            Showing <span className="text-white font-medium">{paginatedSessions.length}</span> of{' '}
            <span className="text-white font-medium">{totalItems}</span> conversations
          </p>
          
          {/* Items per page */}
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg 
                     text-white text-sm focus:outline-none focus:border-purple-500"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>

        {/* Sessions List */}
        <div className="space-y-3">
          {paginatedSessions.length === 0 ? (
            <div className="text-center py-12 bg-black/40 rounded-xl border border-white/5">
              <MessageSquare className="h-12 w-12 mx-auto text-slate-600 mb-3" />
              <p className="text-slate-400">No conversations found</p>
              <button 
                onClick={() => {
                  setSearchTerm("");
                  setSelectedTenant("all");
                  setDateRange("week");
                
                }}
                className="mt-4 text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            paginatedSessions.map((session) => (
              <div
                key={session.session_id}
                className="bg-black/40 rounded-xl border border-white/10 overflow-hidden 
                         backdrop-blur-sm hover:border-purple-500/30 transition-all"
              >
                {/* Session Header */}
                <button
                  onClick={() => toggleSession(session.session_id, session.tenant_slug)}
                  className="w-full text-left p-4 hover:bg-white/5 transition-all"
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar with status indicator */}
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 
                                    flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-white" />
                      </div>
                   
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-white truncate max-w-[200px] sm:max-w-md">
                            {session.title || 'Untitled Conversation'}
                          </h3>
                          
                          {/* Status Badge */}
                    
                        </div>

                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(session.created_at)}
                        </span>
                      </div>

                 <div className="flex flex-col gap-1 text-sm mb-2">

  <div className="flex items-center gap-2 flex-wrap">
    <span className="px-2 py-0.5 bg-purple-500/10 rounded-full text-purple-400 
    text-xs border border-purple-500/20">
      {session.tenant_slug}
    </span>

    <span className="text-slate-500 text-xs flex items-center gap-1">
      <MessageSquare className="h-3 w-3" />
      {session.message_count || 0} messages
    </span>
  </div>

  {/* CUSTOMER INFO */}
  {(session.name || session.email || session.phone) && (
    <div className="text-xs text-slate-400 flex flex-wrap gap-3">

      {session.name && (
        <span className="flex items-center gap-1">
          👤 {session.name}
        </span>
      )}
{session.product_slug && (
  <span className="px-2 py-0.5 bg-green-500/10 rounded-full text-green-400 text-xs border border-green-500/20">
    {session.product_slug}
  </span>
)}
      {session.email && (
        <span className="flex items-center gap-1">
          📧 {session.email}
        </span>
      )}

      {session.phone && (
        <span className="flex items-center gap-1">
          📞 {session.phone}
        </span>
      )}

    </div>
  )}


                        <span className="text-slate-500 text-xs flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {session.message_count || 0} messages
                        </span>
                      </div>

                      {/* Last message preview with highlight if matches search */}
                      {session.last_message && (
                        <p className="text-sm text-slate-400 truncate">
                          {searchTerm && session.last_message.toLowerCase().includes(searchTerm.toLowerCase()) ? (
                            <>
                              {session.last_message.split(new RegExp(`(${searchTerm})`, 'gi')).map((part, i) => 
                                part.toLowerCase() === searchTerm.toLowerCase() ? (
                                  <span key={i} className="bg-yellow-500/20 text-yellow-400 px-0.5 rounded">
                                    {part}
                                  </span>
                                ) : part
                              )}
                            </>
                          ) : (
                            session.last_message
                          )}
                        </p>
                      )}
                    </div>

                    {/* Expand/Collapse Icon with message count */}
                    <div className="flex items-center gap-2">
                      {session.message_count > 0 && (
                        <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full">
                          {session.message_count}
                        </span>
                      )}
                      {openSessionId === session.session_id ? (
                        <ChevronDown className="h-5 w-5 text-purple-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-slate-600" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded Messages Section */}
                {openSessionId === session.session_id && (
                  <div className="border-t border-white/10 bg-black/60">
                    {loadingMessages[session.session_id] ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
                      </div>
                    ) : expandedSessions[session.session_id]?.length > 0 ? (
                      <div className="p-4 space-y-4 max-h-96 overflow-y-auto scrollbar-thin">
                        {expandedSessions[session.session_id].map((message, index) => (
                          <div
                            key={index}
                            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} 
                                       animate-fadeIn`}
                          >
                            <div className={`flex gap-2 max-w-[85%] ${message.sender === "user" ? "flex-row-reverse" : ""}`}>
                              {/* Avatar */}
                              <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center
                                ${message.sender === "user" 
                                  ? 'bg-gradient-to-br from-purple-500 to-blue-500' 
                                  : 'bg-white/10'
                                }`}
                              >
                                {message.sender === "user" 
                                  ? <User className="h-3 w-3 text-white" />
                                  : <Bot className="h-3 w-3 text-white/80" />
                                }
                              </div>

                              {/* Message Bubble */}
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium text-slate-400">
                                    {message.sender === "user" ? "User" : "BizNova AI"}
                                  </span>
                                  <span className="text-xs text-slate-600">
                                    {new Date(message.created_at).toLocaleTimeString([], { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </span>
                                  {message.metadata?.response_time && (
                                    <span className="text-xs text-slate-600">
                                      · {message.metadata.response_time}s
                                    </span>
                                  )}
                                </div>
                                <div
                                  className={`p-3 rounded-2xl text-sm ${
                                    message.sender === "user"
                                      ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-tr-none'
                                      : 'bg-white/10 backdrop-blur-sm text-white rounded-tl-none border border-white/10'
                                  }`}
                                >
                                  <p className="whitespace-pre-wrap leading-relaxed">{message.message}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-slate-500">No messages in this conversation</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2
                ${currentPage === 1
                  ? 'border-white/5 text-slate-600 cursor-not-allowed'
                  : 'border-white/10 text-slate-400 hover:text-white hover:border-purple-500/50'
                }`}
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
              Previous
            </button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm transition-all
                      ${currentPage === pageNum
                        ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="text-slate-600">...</span>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className="w-8 h-8 rounded-lg text-sm text-slate-400 hover:text-white 
                             hover:bg-white/5 transition-all"
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2
                ${currentPage === totalPages
                  ? 'border-white/5 text-slate-600 cursor-not-allowed'
                  : 'border-white/10 text-slate-400 hover:text-white hover:border-purple-500/50'
                }`}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Footer Stats */}
      
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}