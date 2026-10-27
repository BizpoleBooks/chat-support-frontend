// AdminLayout.tsx
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function AdminLayout() {
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col relative">
        <Navbar />
        
        <div className="flex-1 overflow-y-auto p-6 relative">
          {/* Animated gradient background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-40 -left-20 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
          </div>
          
          {/* Main content with glass effect */}
          <div className="relative z-10">
            <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-800/50 p-6 shadow-2xl shadow-black/20">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}