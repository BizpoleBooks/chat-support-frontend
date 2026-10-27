import { BarChart3, Users, MessageSquare, Zap, TrendingUp, ChevronRight, MoreVertical, Activity } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, Area, CartesianGrid } from "recharts";
import { useEffect, useState } from "react";

const data = [
  { name: "Mon", users: 120, growth: 5 },
  { name: "Tue", users: 210, growth: 12 },
  { name: "Wed", users: 180, growth: -8 },
  { name: "Thu", users: 260, growth: 20 },
  { name: "Fri", users: 320, growth: 15 },
  { name: "Sat", users: 290, growth: -4 },
  { name: "Sun", users: 400, growth: 25 },
];

const gradientColors = [
  { from: "from-purple-500", to: "to-blue-500" },
  { from: "from-emerald-500", to: "to-cyan-500" },
  { from: "from-amber-500", to: "to-orange-500" },
  { from: "from-pink-500", to: "to-rose-500" },
];

export default function Dashboard() {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
  }, []);

  return (
    <div className="space-y-8 p-4">
      {/* Page Title with Gradient */}
      <div className={`transition-all duration-700 ${animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              Dashboard Overview
            </h1>
            <p className="text-slate-400 mt-2 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Monitor your AI platform performance and tenants in real-time
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105">
              Refresh Data
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 shadow-lg shadow-purple-500/25">
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards with Animation Stagger */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Total Tenants", value: "128", icon: Users, change: "+12%" },
          { title: "Active Conversations", value: "842", icon: MessageSquare, change: "+24%" },
          { title: "AI Requests Today", value: "12.5K", icon: Zap, change: "+18%" },
          { title: "System Uptime", value: "98.9%", icon: BarChart3, change: "+0.3%" },
        ].map((stat, index) => (
          <div
            key={index}
            className={`transition-all duration-500 delay-${index * 100} ${
              animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <StatCard
              title={stat.title}
              value={stat.value}
              change={stat.change}
              icon={stat.icon}
              gradient={gradientColors[index]}
              index={index}
            />
          </div>
        ))}
      </div>

      {/* Analytics Chart Section */}
      <div className={`transition-all duration-700 delay-300 ${animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Weekly User Growth</h2>
              <p className="text-slate-400 text-sm mt-1">Last 7 days performance</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"></div>
                <span className="text-sm text-slate-300">Active Users</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 text-sm">
                <TrendingUp className="w-4 h-4" />
                <span>+18.5% from last week</span>
              </div>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#94a3b8"
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: "12px",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.3)"
                  }}
                  formatter={(value) => [`${value} users`, "Active"]}
                />
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="url(#colorUsers)"
                  fill="url(#colorUsers)"
                  strokeWidth={3}
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="url(#colorUsers)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#8b5cf6" }}
                  activeDot={{ r: 6, fill: "#ffffff", stroke: "#8b5cf6", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all duration-700 delay-500 ${animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        
        {/* Recent Tenants */}
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Recent Tenants</h2>
              <p className="text-slate-400 text-sm mt-1">Active tenant management</p>
            </div>
            <button className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <TenantRow name="TechCorp" status="Active" plan="Enterprise" users="245" />
            <TenantRow name="StartupX" status="Pending" plan="Startup" users="42" />
            <TenantRow name="GlobalSoft" status="Active" plan="Business" users="128" />
            <TenantRow name="NextGen AI" status="Suspended" plan="Enterprise" users="89" />
            <TenantRow name="CloudNine" status="Active" plan="Pro" users="67" />
          </div>
        </div>

        {/* Recent Conversations */}
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Latest Conversations</h2>
              <p className="text-slate-400 text-sm mt-1">Recent AI interactions</p>
            </div>
            <MoreVertical className="w-5 h-5 text-slate-400 cursor-pointer hover:text-white transition-colors" />
          </div>

          <div className="space-y-4">
            <ConversationItem 
              title="Order Refund Issue" 
              time="2 min ago" 
              status="resolved"
              priority="high"
            />
            <ConversationItem 
              title="Login Authentication Error" 
              time="10 min ago" 
              status="pending"
              priority="high"
            />
            <ConversationItem 
              title="Pricing Plan Query" 
              time="1 hr ago" 
              status="resolved"
              priority="medium"
            />
            <ConversationItem 
              title="API Integration Help" 
              time="3 hr ago" 
              status="in-progress"
              priority="low"
            />
            <ConversationItem 
              title="Feature Request" 
              time="5 hr ago" 
              status="resolved"
              priority="medium"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Enhanced Components ---------- */

function StatCard({ title, value, change, icon: Icon, gradient, index }: any) {
  const [hover, setHover] = useState(false);

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${gradient.from} ${gradient.to} 
        border border-slate-800 rounded-2xl p-6 transition-all duration-500 
        hover:scale-[1.02] hover:shadow-2xl cursor-pointer group
        ${hover ? 'shadow-xl' : 'shadow-lg'}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Animated background effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient.from} ${gradient.to} opacity-10 transition-opacity duration-500 ${hover ? 'opacity-20' : 'opacity-10'}`}></div>
      
      {/* Floating particles */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className="text-white/90 text-sm font-medium">{title}</div>
          <div className={`p-2 rounded-lg bg-white/10 backdrop-blur-sm transition-transform duration-300 ${hover ? 'scale-110' : ''}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div className="text-3xl font-bold text-white">{value}</div>
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-sm font-medium transition-all duration-300 ${hover ? 'scale-105' : ''}`}>
            <TrendingUp className="w-4 h-4" />
            <span className="text-white">{change}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TenantRow({ name, status, plan, users }: any) {
  const statusColors = {
    Active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    Pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    Suspended: "bg-rose-500/20 text-rose-400 border-rose-500/30"
  };

  const planColors = {
    Enterprise: "text-purple-400 bg-purple-500/10",
    Business: "text-blue-400 bg-blue-500/10",
    Pro: "text-cyan-400 bg-cyan-500/10",
    Startup: "text-emerald-400 bg-emerald-500/10"
  };

  return (
    <div className="flex items-center justify-between p-4 bg-slate-800/30 hover:bg-slate-800/50 rounded-xl transition-all duration-300 group hover:scale-[1.01] cursor-pointer">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <Users className="w-5 h-5 text-slate-400" />
        </div>
        <div>
          <div className="font-medium text-white">{name}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-1 rounded-md ${planColors[plan] || ''}`}>
              {plan}
            </span>
            <span className="text-xs text-slate-500">• {users} users</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-xs px-3 py-1 rounded-full border ${statusColors[status]}`}>
          {status}
        </span>
        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
      </div>
    </div>
  );
}

function ConversationItem({ title, time, status, priority }: any) {
  const statusIcons = {
    resolved: "✓",
    pending: "⏱",
    "in-progress": "⟳"
  };

  const priorityColors = {
    high: "bg-rose-500/20 text-rose-400",
    medium: "bg-amber-500/20 text-amber-400",
    low: "bg-blue-500/20 text-blue-400"
  };

  return (
    <div className="flex items-center justify-between p-3 bg-slate-800/20 hover:bg-slate-800/40 rounded-xl transition-all duration-300 hover:scale-[1.01] cursor-pointer group">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-900/50 to-blue-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
          <MessageSquare className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <div className="text-white font-medium">{title}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded ${priorityColors[priority]}`}>
              {priority}
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-slate-600"></span>
              {statusIcons[status]} {status}
            </span>
          </div>
        </div>
      </div>
      <div className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
        {time}
      </div>
    </div>
  );
}