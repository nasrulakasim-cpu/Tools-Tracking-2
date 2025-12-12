import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { LogOut, LayoutDashboard, Box, FileText, User as UserIcon, MapPin, Menu, X, ChevronLeft } from 'lucide-react';
import { SYSTEM_BASES } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  setActivePage: (page: string) => void;
}

// Remaco Logo Component - Custom Design matching the Red Bulb Icon
export const RemacoLogo = ({ className = "w-8 h-8", textSize = "text-xl" }: { className?: string, textSize?: string }) => (
  <div className="flex items-center gap-3">
    <div className={`relative flex items-center justify-center text-tnbRed ${className}`}>
      {/* 
         Red Bulb with Lightning Bolt 
         Matching the provided visual: Thick lines, specific bulb shape, floating base, lightning inside.
      */}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full drop-shadow-sm">
        {/* Bulb Body: Rounded top square that tapers down */}
        <path d="M6 6C6 4.34315 7.34315 3 9 3H15C16.6569 3 18 4.34315 18 6V10C18 11.5 17 13 16 14L15.5 15V18.5C15.5 18.7761 15.2761 19 15 19H9C8.72386 19 8.5 18.7761 8.5 18.5V15L8 14C7 13 6 11.5 6 10V6Z" />
        
        {/* The Base: A separate pill shape at the bottom */}
        <path d="M10 22H14" />
        
        {/* The Lightning Bolt: Zig-zag inside */}
        <path d="M14 7L10 11.5H13L10 16" />
      </svg>
    </div>
    <div className="flex flex-col">
      <span className={`font-black tracking-wider text-white ${textSize}`}>REMACO</span>
      <span className="text-[10px] text-gray-300 leading-none tracking-tight">TNB POWER GENERATION</span>
    </div>
  </div>
);

export const Layout: React.FC<LayoutProps> = ({ children, activePage, setActivePage }) => {
  const { user, logout } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (!user) return <>{children}</>;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  const NavItem: React.FC<{ page: string; icon: any; label: string; indent?: boolean }> = ({ page, icon: Icon, label, indent = false }) => (
    <button
      onClick={() => {
        setActivePage(page);
        setIsMobileOpen(false); // Close mobile menu on click
      }}
      className={`flex items-center w-full px-4 py-3 text-sm font-medium transition-all duration-200 border-l-4 group ${
        activePage === page 
          ? 'bg-[#003875] text-white border-tnbRed' 
          : 'text-gray-300 border-transparent hover:bg-[#003875] hover:text-white hover:border-blue-300'
      } ${indent ? 'pl-8' : ''}`}
    >
      <Icon className={`w-5 h-5 mr-3 transition-colors ${activePage === page ? 'text-tnbRed' : 'text-gray-400 group-hover:text-white'}`} />
      <span className="truncate">{label}</span>
    </button>
  );

  const getPageTitle = () => {
    if (activePage === 'dashboard') return 'Dashboard';
    if (activePage === 'history') return 'History / Logs';
    if (activePage === 'users') return 'User Management';
    if (activePage.startsWith('inventory')) {
      if (activePage.includes(':')) {
        return `Inventory List: ${activePage.split(':')[1]}`;
      }
      return 'Inventory List';
    }
    return activePage;
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={`
          fixed md:static inset-y-0 left-0 z-40
          bg-tnbBlue text-white shadow-xl 
          transition-all duration-300 ease-in-out
          flex flex-col
          ${isMobileOpen ? 'translate-x-0 w-64' : 'translate-x-[-100%] md:translate-x-0'}
          ${isSidebarOpen ? 'md:w-64' : 'md:w-0 md:overflow-hidden'}
        `}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-[#003875] bg-[#00224a] relative">
          <RemacoLogo />
          {/* Mobile Close Button */}
          <button onClick={() => setIsMobileOpen(false)} className="absolute top-4 right-4 md:hidden text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* User Info */}
        <div className="p-4 bg-[#003875]/30 border-b border-[#003875]">
             <p className="text-xs text-blue-200 font-semibold uppercase tracking-wider">Logged in as</p>
             <p className="text-sm font-bold text-white truncate mt-1">{user.name}</p>
             <div className="flex items-center mt-1">
               <span className={`w-2 h-2 rounded-full mr-2 ${
                 user.role === UserRole.ADMIN ? 'bg-purple-400' : 
                 user.role === UserRole.BASE_MANAGER ? 'bg-teal-400' :
                 user.role === UserRole.STOREKEEPER ? 'bg-orange-400' : 'bg-green-400'
               }`}></span>
               <p className="text-xs text-gray-300 capitalize">{user.role.toLowerCase().replace('_', ' ')} • {user.base}</p>
             </div>
        </div>
        
        {/* Navigation Links */}
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#003875]">
          <NavItem page="dashboard" icon={LayoutDashboard} label="Dashboard" />
          
          {user.role === UserRole.ADMIN ? (
            <>
               <div className="pt-4 pb-2 px-4 flex items-center justify-between">
                 <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">Inventory By Base</p>
               </div>
               <NavItem page="inventory" icon={Box} label="Master List (All)" />
               {SYSTEM_BASES.map(base => (
                 <NavItem 
                    key={base} 
                    page={`inventory:${base}`} 
                    icon={MapPin} 
                    label={base} 
                    indent 
                 />
               ))}
            </>
          ) : (
            <NavItem page="inventory" icon={Box} label="Inventory List" />
          )}

          <NavItem page="history" icon={FileText} label="History / Logs" />
          
          {user.role === UserRole.ADMIN && (
            <NavItem page="users" icon={UserIcon} label="User Management" />
          )}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#003875] mt-auto bg-[#00224a]">
          <button
            onClick={logout}
            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-tnbRed hover:bg-red-700 rounded shadow-md transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
          <p className="text-[10px] text-center text-gray-500 mt-3">v1.2.0 • TNB Remaco</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative w-full">
        {/* Top Header Bar */}
        <header className="bg-white shadow-sm h-16 flex justify-between items-center px-4 md:px-6 z-20 border-b border-gray-200">
           <div className="flex items-center gap-4">
             {/* Toggle Button (Desktop & Mobile) */}
             <button 
                onClick={() => {
                   if (window.innerWidth >= 768) {
                     toggleSidebar();
                   } else {
                     toggleMobile();
                   }
                }} 
                className="p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-tnbBlue"
             >
                {/* On Desktop: Show Menu if closed, Chevron Left if open. On Mobile: Always Menu */}
                <div className="hidden md:block">
                    {isSidebarOpen ? <ChevronLeft className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </div>
                <div className="md:hidden">
                    <Menu className="w-6 h-6" />
                </div>
             </button>

             {/* Page Title */}
             <h2 className="text-xl font-bold text-tnbBlue capitalize tracking-tight">
                {getPageTitle()}
             </h2>
           </div>

           {/* Right Header Actions */}
           <div className="flex items-center space-x-4">
              {/* Only show simplistic log out on mobile header since sidebar handles it usually */}
              <button onClick={logout} className="md:hidden text-gray-500">
                <LogOut className="w-5 h-5" />
              </button>
              <div className="hidden md:flex items-center gap-3">
                 <div className="text-right hidden lg:block">
                   <p className="text-xs font-bold text-gray-900">{user.name}</p>
                   <p className="text-xs text-gray-500">{user.base}</p>
                 </div>
                 <div className="w-9 h-9 rounded-full bg-tnbRed text-white flex items-center justify-center font-bold shadow-sm">
                    {user.name.charAt(0)}
                 </div>
              </div>
           </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};