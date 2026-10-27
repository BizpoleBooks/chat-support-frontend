// Navbar.tsx
import { Bell, Search, ChevronDown, Settings, HelpCircle, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(3);
  const [searchActive, setSearchActive] = useState(false);

  // Handle dark mode toggle
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-2xl border-b border-slate-800/50 px-6 flex items-center justify-between sticky top-0 z-50">
      
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur opacity-70 animate-pulse"></div>
          <h1 className="relative text-xl font-bold bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
            Dashboard
          </h1>
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm">
          <span className="text-slate-400">/</span>
          <span className="text-slate-300">Admin Panel</span>
          <span className="text-slate-400">/</span>
          <span className="text-blue-400 font-medium">Overview</span>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">

        {/* Theme Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-all duration-300 hover:scale-105"
          aria-label="Toggle theme"
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-amber-300" />
          ) : (
            <Moon className="w-5 h-5 text-indigo-300" />
          )}
        </button>

        {/* Search - Enhanced with animation */}
        <div className={`relative transition-all duration-300 ${searchActive ? 'w-64' : 'w-48'}`}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tenants, conversations..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 
            rounded-xl text-sm text-white placeholder-slate-400
            focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent
            transition-all duration-300 backdrop-blur-sm"
            onFocus={() => setSearchActive(true)}
            onBlur={() => setSearchActive(false)}
          />
        </div>

        {/* Help Button */}
        <button 
          className="p-2.5 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 
          hover:from-slate-700 hover:to-slate-800 transition-all duration-300 
          hover:scale-105 border border-slate-700/50"
          aria-label="Help"
        >
          <HelpCircle className="w-5 h-5 text-slate-300" />
        </button>

        {/* Notification with animated indicator */}
        <button className="relative p-2.5 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 
          hover:from-slate-700 hover:to-slate-800 transition-all duration-300 
          hover:scale-105 border border-slate-700/50 group"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-slate-300 group-hover:text-purple-300 transition-colors" />
          {notifications > 0 && (
            <>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 
                rounded-full text-xs font-bold flex items-center justify-center animate-bounce">
                {notifications}
              </span>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 
                rounded-full animate-ping opacity-75"></span>
            </>
          )}
        </button>

        {/* Settings */}
        <button 
          className="p-2.5 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 
          hover:from-slate-700 hover:to-slate-800 transition-all duration-300 
          hover:scale-105 border border-slate-700/50"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5 text-slate-300" />
        </button>

        {/* Profile Dropdown - Enhanced */}
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl 
            bg-gradient-to-r from-slate-800/50 to-slate-900/50
            hover:from-slate-800 hover:to-slate-900
            transition-all duration-300 hover:scale-105 border border-slate-700/50 group"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 
                rounded-full blur opacity-60 animate-pulse"></div>
              <div className="relative w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 
                flex items-center justify-center rounded-full text-sm font-bold shadow-lg">
                SA
              </div>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-white">Super Admin</p>
              <p className="text-xs text-slate-400">Administrator</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu with animation */}
          {open && (
            <div className="absolute right-0 mt-3 w-56 bg-slate-900/95 backdrop-blur-2xl border border-slate-800/50 
              rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-fadeIn"
              onMouseLeave={() => setOpen(false)}
            >
              <div className="p-4 border-b border-slate-800/50">
                <p className="font-medium text-white">Super Admin</p>
                <p className="text-sm text-slate-400">admin@biznova.com</p>
              </div>
              
              <div className="py-2">
                <button className="flex items-center gap-3 w-full text-left px-4 py-3 hover:bg-slate-800/50 
                  text-sm transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 
                    flex items-center justify-center group-hover:from-purple-500/30 group-hover:to-blue-500/30">
                    👤
                  </div>
                  <span>Profile Settings</span>
                </button>
                
                <button className="flex items-center gap-3 w-full text-left px-4 py-3 hover:bg-slate-800/50 
                  text-sm transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 
                    flex items-center justify-center group-hover:from-purple-500/30 group-hover:to-blue-500/30">
                    ⚙️
                  </div>
                  <span>Account Settings</span>
                </button>
                
                <button className="flex items-center gap-3 w-full text-left px-4 py-3 hover:bg-slate-800/50 
                  text-sm transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 
                    flex items-center justify-center group-hover:from-purple-500/30 group-hover:to-blue-500/30">
                    🔒
                  </div>
                  <span>Privacy & Security</span>
                </button>
                
                <div className="border-t border-slate-800/50 my-2"></div>
                
                <button className="flex items-center gap-3 w-full text-left px-4 py-3 text-red-400 
                  hover:bg-red-500/10 text-sm transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500/20 to-pink-500/20 
                    flex items-center justify-center group-hover:from-red-500/30 group-hover:to-pink-500/30">
                    🚪
                  </div>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}