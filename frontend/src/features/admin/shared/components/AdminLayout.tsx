import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { FaBars, FaSearch, FaBell } from "react-icons/fa";
import { getStoredUser } from "../../../../network/auth";

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const user = getStoredUser();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col lg:pl-64">
        {/* Top Header */}
        <header className="h-16 bg-gray-900/50 backdrop-blur-md border-b border-gray-800 sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-400 hover:text-white"
            >
              <FaBars />
            </button>
            
            <div className="hidden md:flex items-center gap-3 bg-gray-800/50 border border-gray-700 px-4 py-2 rounded-xl w-64 lg:w-96 focus-within:border-lorryBlue focus-within:ring-1 focus-within:ring-lorryBlue/20 transition-all">
              <FaSearch className="text-gray-500 text-sm" />
              <input 
                type="text" 
                placeholder="Search operations..." 
                className="bg-transparent border-none outline-none text-sm text-gray-200 placeholder-gray-500 w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
              <FaBell />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-gray-900"></span>
            </button>

            <div className="h-8 w-px bg-gray-800"></div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-white leading-none mb-1">{user?.fullName}</p>
                <p className="text-[10px] text-lorryBlue font-bold uppercase tracking-wider">Super Admin</p>
              </div>
              <div className="w-10 h-10 bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-center text-lorryBlue font-bold shadow-lg shadow-black/20">
                {user?.fullName?.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
