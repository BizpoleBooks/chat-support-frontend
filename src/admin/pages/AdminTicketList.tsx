import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";

interface TicketStats {
  total: number;
  open: number;
  in_progress: number;
  closed: number;
  high_priority: number;
  medium_priority: number;
  low_priority: number;
  avg_response_time?: string;
  oldest_ticket?: string;
}

export default function AdminTicketList() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [stats, setStats] = useState<TicketStats>({
    total: 0,
    open: 0,
    in_progress: 0,
    closed: 0,
    high_priority: 0,
    medium_priority: 0,
    low_priority: 0
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        const res = await api.get("/tickets");
        setTickets(res.data);
        calculateStats(res.data);
      } catch (error) {
        console.error("Failed to fetch tickets:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const calculateStats = (ticketData: any[]) => {
    const now = new Date();
    const stats: TicketStats = {
      total: ticketData.length,
      open: ticketData.filter(t => t.status === "open").length,
      in_progress: ticketData.filter(t => t.status === "in_progress").length,
      closed: ticketData.filter(t => t.status === "closed").length,
      high_priority: ticketData.filter(t => t.priority === "high").length,
      medium_priority: ticketData.filter(t => t.priority === "medium").length,
      low_priority: ticketData.filter(t => t.priority === "low").length,
    };

    // Calculate average response time (mock calculation - adjust based on your data)
    const openTickets = ticketData.filter(t => t.status !== "closed");
    if (openTickets.length > 0) {
      const totalAge = openTickets.reduce((acc, t) => {
        const created = new Date(t.created_at);
        const ageInHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
        return acc + ageInHours;
      }, 0);
      stats.avg_response_time = (totalAge / openTickets.length).toFixed(1) + "h";
    }

    // Find oldest open ticket
    const oldestOpen = ticketData
      .filter(t => t.status !== "closed")
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
    
    if (oldestOpen) {
      const ageInDays = Math.floor((now.getTime() - new Date(oldestOpen.created_at).getTime()) / (1000 * 60 * 60 * 24));
      stats.oldest_ticket = ageInDays + "d";
    }

    setStats(stats);
  };

  // Get last message from chat
  const getLastMessage = (desc: string) => {
    if (!desc) return "";
    const lines = desc.split("\n\n");
    const lastLine = lines[lines.length - 1] || "";
    return lastLine.replace(/^(User|BizNova):/i, "").trim();
  };

  const getStatusColor = (status: string) => {
    const colors = {
      open: "bg-green-500/20 text-green-400 border-green-500/30",
      in_progress: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      closed: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return colors[status as keyof typeof colors] || "bg-slate-500/20 text-slate-400";
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: "bg-red-500/20 text-red-400 border-red-500/30",
      medium: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      low: "bg-slate-600/20 text-slate-400 border-slate-600/30",
    };
    return colors[priority as keyof typeof colors] || "bg-slate-500/20 text-slate-400";
  };

  // Filter and sort tickets
  const filteredTickets = tickets
    .filter(t => filter === "all" || t.status === filter)
    .filter(t => priorityFilter === "all" || t.priority === priorityFilter)
    .filter(t => 
      searchTerm === "" || 
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toString().includes(searchTerm) ||
      getLastMessage(t.description).toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "created_at") {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === "priority") {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        comparison = (priorityOrder[a.priority as keyof typeof priorityOrder] || 0) - 
                    (priorityOrder[b.priority as keyof typeof priorityOrder] || 0);
      } else if (sortBy === "status") {
        const statusOrder = { open: 3, in_progress: 2, closed: 1 };
        comparison = (statusOrder[a.status as keyof typeof statusOrder] || 0) - 
                    (statusOrder[b.status as keyof typeof statusOrder] || 0);
      }
      return sortOrder === "desc" ? -comparison : comparison;
    });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTickets = filteredTickets.slice(indexOfFirstItem, indexOfLastItem);
  
  useEffect(() => {
    setTotalPages(Math.ceil(filteredTickets.length / itemsPerPage));
    setCurrentPage(1); // Reset to first page when filters change
  }, [filteredTickets.length, itemsPerPage, filter, priorityFilter, searchTerm]);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-black p-10">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Support Dashboard
            </h1>
            <p className="text-slate-400 mt-1">Manage and respond to customer tickets</p>
          </div>
          <div className="bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700">
            <span className="text-slate-400">Total: </span>
            <span className="text-white font-semibold">{stats.total}</span>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Status Stats */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-sm text-slate-400 mb-4">Ticket Status</h3>
            <div className="space-y-3">
              <div 
                onClick={() => setFilter("all")}
                className={`flex justify-between items-center p-2 rounded-lg cursor-pointer transition-all ${
                  filter === "all" ? "bg-purple-600/20" : "hover:bg-slate-800/50"
                }`}
              >
                <span className="text-slate-300">All Tickets</span>
                <span className="text-white font-semibold">{stats.total}</span>
              </div>
              <div 
                onClick={() => setFilter("open")}
                className={`flex justify-between items-center p-2 rounded-lg cursor-pointer transition-all ${
                  filter === "open" ? "bg-green-600/20" : "hover:bg-slate-800/50"
                }`}
              >
                <span className="text-green-400">Open</span>
                <span className="text-white font-semibold">{stats.open}</span>
              </div>
              <div 
                onClick={() => setFilter("in_progress")}
                className={`flex justify-between items-center p-2 rounded-lg cursor-pointer transition-all ${
                  filter === "in_progress" ? "bg-yellow-600/20" : "hover:bg-slate-800/50"
                }`}
              >
                <span className="text-yellow-400">In Progress</span>
                <span className="text-white font-semibold">{stats.in_progress}</span>
              </div>
              <div 
                onClick={() => setFilter("closed")}
                className={`flex justify-between items-center p-2 rounded-lg cursor-pointer transition-all ${
                  filter === "closed" ? "bg-red-600/20" : "hover:bg-slate-800/50"
                }`}
              >
                <span className="text-red-400">Closed</span>
                <span className="text-white font-semibold">{stats.closed}</span>
              </div>
            </div>
          </div>

          {/* Priority Stats */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-sm text-slate-400 mb-4">Priority Distribution</h3>
            <div className="space-y-3">
              <div 
                onClick={() => setPriorityFilter("all")}
                className={`flex justify-between items-center p-2 rounded-lg cursor-pointer transition-all ${
                  priorityFilter === "all" ? "bg-purple-600/20" : "hover:bg-slate-800/50"
                }`}
              >
                <span className="text-slate-300">All Priorities</span>
                <span className="text-white font-semibold">{stats.total}</span>
              </div>
              <div 
                onClick={() => setPriorityFilter("high")}
                className={`flex justify-between items-center p-2 rounded-lg cursor-pointer transition-all ${
                  priorityFilter === "high" ? "bg-red-600/20" : "hover:bg-slate-800/50"
                }`}
              >
                <span className="text-red-400">High</span>
                <span className="text-white font-semibold">{stats.high_priority}</span>
              </div>
              <div 
                onClick={() => setPriorityFilter("medium")}
                className={`flex justify-between items-center p-2 rounded-lg cursor-pointer transition-all ${
                  priorityFilter === "medium" ? "bg-blue-600/20" : "hover:bg-slate-800/50"
                }`}
              >
                <span className="text-blue-400">Medium</span>
                <span className="text-white font-semibold">{stats.medium_priority}</span>
              </div>
              <div 
                onClick={() => setPriorityFilter("low")}
                className={`flex justify-between items-center p-2 rounded-lg cursor-pointer transition-all ${
                  priorityFilter === "low" ? "bg-slate-600/20" : "hover:bg-slate-800/50"
                }`}
              >
                <span className="text-slate-400">Low</span>
                <span className="text-white font-semibold">{stats.low_priority}</span>
              </div>
            </div>
          </div>

          {/* Response Time Stats */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-sm text-slate-400 mb-4">Response Metrics</h3>
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-bold text-white mb-1">
                  {stats.avg_response_time || "N/A"}
                </div>
                <div className="text-xs text-slate-500">Avg. Response Time</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white mb-1">
                  {stats.oldest_ticket || "N/A"}
                </div>
                <div className="text-xs text-slate-500">Oldest Open Ticket</div>
              </div>
              <div className="pt-2">
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: `${(stats.open / (stats.total || 1)) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Open Rate</span>
                  <span>{((stats.open / (stats.total || 1)) * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-sm text-slate-400 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => {
                  setFilter("open");
                  setPriorityFilter("high");
                }}
                className="w-full text-left px-3 py-2 rounded-lg bg-red-600/20 border border-red-500/30 
                         hover:bg-red-600/30 transition-colors"
              >
                <div className="text-red-400 font-medium">View High Priority</div>
                <div className="text-xs text-slate-400">{stats.high_priority} open tickets</div>
              </button>
              <button 
                onClick={() => {
                  setFilter("all");
                  setPriorityFilter("all");
                  setSearchTerm("");
                }}
                className="w-full text-left px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 
                         hover:bg-slate-800 transition-colors"
              >
                <div className="text-slate-300 font-medium">Clear All Filters</div>
                <div className="text-xs text-slate-400">Reset to default view</div>
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search tickets by ID, subject, message, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 
                     text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 
                     transition-colors"
          />
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 
                     text-white focus:outline-none focus:border-purple-500"
          >
            <option value="created_at">Sort by Date</option>
            <option value="priority">Sort by Priority</option>
            <option value="status">Sort by Status</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 
                     text-white focus:outline-none focus:border-purple-500"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>

          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 
                     text-white focus:outline-none focus:border-purple-500"
          >
            <option value="5">5 per page</option>
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-4 text-sm text-slate-400">
          <span>
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredTickets.length)} of {filteredTickets.length} tickets
          </span>
          {(filter !== "all" || priorityFilter !== "all" || searchTerm) && (
            <button
              onClick={() => {
                setFilter("all");
                setPriorityFilter("all");
                setSearchTerm("");
              }}
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Ticket List */}
        {currentTickets.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/30 rounded-3xl border border-slate-800">
            <svg
              className="mx-auto h-12 w-12 text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-slate-300">No tickets found</h3>
            <p className="text-slate-500">Try adjusting your search or filter</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {currentTickets.map(t => (
                <div
                  key={t.id}
                  onClick={() => navigate(`/admin/tickets/${t.id}`)}
                  className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl 
                           cursor-pointer hover:border-purple-500 hover:scale-[1.02]
                           transition-all duration-300 group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="text-sm font-mono text-purple-400">
                          #{t.id}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-lg ${getStatusColor(t.status)}`}>
                          {t.status.replace("_", " ")}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-lg ${getPriorityColor(t.priority)}`}>
                          {t.priority}
                        </span>
                   <div className="text-xs text-slate-400 mt-1 space-y-1">
  {t.name && <div>👤 {t.name}</div>}
  {t.email && <div>📧 {t.email}</div>}
  {t.phone && <div>📞 {t.phone}</div>}
  {t.tenant_slug && (
    <div className="text-purple-400">
      🏢 {t.tenant_slug}
    </div>
  )}
</div>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {t.subject}
                      </h3>
                      
                      <p className="text-sm text-slate-400 line-clamp-2 mb-3">
                        {getLastMessage(t.description)}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>Created: {new Date(t.created_at).toLocaleString()}</span>
                        {t.updated_at && t.updated_at !== t.created_at && (
                          <span>Updated: {new Date(t.updated_at).toLocaleString()}</span>
                        )}
                      </div>
                    </div>

                    <svg
                      className="h-5 w-5 text-slate-500 group-hover:text-purple-400 transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-800 
                           text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed
                           hover:border-purple-500 transition-colors"
                >
                  Previous
                </button>
                
                <div className="flex gap-2">
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNumber = i + 1;
                    // Show first page, last page, and pages around current page
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`w-10 h-10 rounded-lg border transition-colors ${
                            currentPage === pageNumber
                              ? "bg-purple-600 border-purple-500 text-white"
                              : "bg-slate-900/50 border-slate-800 text-slate-400 hover:border-purple-500"
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    } else if (
                      pageNumber === currentPage - 2 ||
                      pageNumber === currentPage + 2
                    ) {
                      return <span key={pageNumber} className="text-slate-600">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-800 
                           text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed
                           hover:border-purple-500 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}