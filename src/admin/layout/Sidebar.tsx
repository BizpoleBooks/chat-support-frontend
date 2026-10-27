// Sidebar.tsx
import { NavLink } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  BookOpen,
  Menu,
  BarChart3,
  Shield,
  Database,
  Cloud,
  Zap,
  X,
   Mail, // Add this for enquiries
  HelpCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const menu = [
  { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard, badge: null },
  { name: "Tenants", path: "/admin/tenant", icon: Users, badge: "12" },
  { name: "Conversations", path: "/admin/conversations", icon: MessageSquare, badge: "24" },
  // { name: "Knowledge Base", path: "/admin/knowledge", icon: BookOpen, badge: "8" },
  // { name: "Prompt-Settings", path: "/admin/admin/ai-settings", icon: BarChart3, badge: "New" },
  // { name: "Security", path: "/admin/security", icon: Shield, badge: null },
  // { name: "Database", path: "/admin/database", icon: Database, badge: null },
  { name: "Support Ticket", path: "/admin/ticket", icon: HelpCircle, badge: "3" },
   { name: "Enquiries", path: "/admin/enquiries", icon: Mail, badge: "5" },
  { name: "AI Models", path: "/admin/ai-models", icon: Zap, badge: "Beta" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeHover, setActiveHover] = useState<string | null>(null);

  return (
<aside
  className={`h-screen bg-gradient-to-b from-slate-950/95 via-slate-900/95 to-slate-950/95
  border-r border-slate-800/50 transition-all duration-500 ease-in-out backdrop-blur-xl
  ${collapsed ? "w-20" : "w-72"} 
  relative group z-50`}
>
      {/* Animated border effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none"></div>
      
      {/* Top Section with logo */}
      <div className="flex items-center justify-between p-5 border-b border-slate-800/50 relative">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="relative">
            
              <div className="relative w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg 
                flex items-center justify-center">
          <img src="/chpreview.png" alt="" />
              </div>
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
                BizNova AI
              </span>
              <p className="text-xs text-slate-400">Enterprise Suite</p>
            </div>
          </div>
        )}
        
        {collapsed && (
          <div className="w-full flex justify-center">
            <div className="relative">
           
              <div className="relative w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg 
                flex items-center justify-center">
                 <img src="/chpreview.png" alt="" />
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-2 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 
          hover:from-slate-700 hover:to-slate-800 transition-all duration-300 
          hover:scale-105 border border-slate-700/50 absolute -right-3
          ${collapsed ? 'rotate-180' : ''}`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-slate-300" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-slate-300" />
          )}
        </button>
      </div>

      {/* Menu Section */}
      <nav className="p-3 space-y-1.5 mt-2">
        {menu.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative
                ${
                  isActive
                    ? "bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-white shadow-lg border border-purple-500/20"
                    : "text-slate-300 hover:bg-slate-800/30 hover:text-white"
                }`
              }
              onMouseEnter={() => setActiveHover(item.path)}
              onMouseLeave={() => setActiveHover(null)}
            >
              {/* Hover effect line */}
              {activeHover === item.path && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-purple-400 to-blue-400 rounded-r-full"></div>
              )}
              
              {/* Icon with gradient effect */}
              <div className={`relative ${collapsed ? 'mx-auto' : ''}`}>
                <div className={`absolute inset-0 rounded-lg blur opacity-60 transition-opacity
                  ${activeHover === item.path ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-transparent'}`}></div>
                <Icon className={`relative w-5 h-5 transition-colors
                  ${activeHover === item.path ? 'text-white' : ''}`} />
              </div>
              
              {/* Text and badge */}
              {!collapsed && (
                <>
                  <span className="flex-1 text-sm font-medium">{item.name}</span>
                  {item.badge && (
                    <span className={`px-2 py-0.5 text-xs rounded-full font-semibold
                      ${item.badge === 'New' || item.badge === 'Beta' 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                        : 'bg-slate-800 text-slate-300'}`}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              
              {/* Tooltip for collapsed state */}
{collapsed && (
  <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900/95 backdrop-blur-xl 
    border border-slate-800 rounded-lg text-sm whitespace-nowrap opacity-0 
    group-hover:opacity-100 transition-opacity duration-200 pointer-events-none 
    z-[9999]">
                  {item.name}
                  {item.badge && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Section - Status */}
      {!collapsed && (
        <div className="absolute bottom-5 left-4 right-4">
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-800/50 
            rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur"></div>
                <div className="relative w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <span className="text-sm font-medium text-white">System Status</span>
            </div>
            <p className="text-xs text-slate-400">All systems operational</p>
            <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5">
              <div className="bg-gradient-to-r from-green-500 to-emerald-400 h-1.5 rounded-full w-4/5"></div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}