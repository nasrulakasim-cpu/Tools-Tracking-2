import React from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { LogOut, LayoutDashboard, Box, FileText, User as UserIcon, MapPin } from 'lucide-react';
import { SYSTEM_BASES } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  setActivePage: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activePage, setActivePage }) => {
  const { user, logout } = useApp();

  if (!user) return <>{children}</>;

  const NavItem: React.FC<{ page: string; icon: any; label: string; indent?: boolean }> = ({ page, icon: Icon, label, indent = false }) => (
    <button
      onClick={() => setActivePage(page)}
      className={`flex items-center w-full px-4 py-3 text-sm font-medium transition-all duration-200 border-l-4 ${
        activePage === page 
          ? 'bg-gray-800 text-white border-blue-500' 
          : 'text-gray-400 border-transparent hover:bg-gray-800 hover:text-white'
      } ${indent ? 'pl-8' : ''}`}
    >
      <Icon className={`w-5 h-5 mr-3 ${activePage === page ? 'text-blue-500' : 'text-gray-500'}`} />
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
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white shadow-xl z-20 hidden md:flex md:flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center space-x-2 mb-4">
             <div className="bg-blue-600 p-1.5 rounded-lg">
               <Box className="w-6 h-6 text-white" />
             </div>
             <div>
               <h1 className="text-xl font-bold tracking-tight">InventoryQ</h1>
             </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
             <p className="text-xs text-gray-400 font-semibold uppercase">Logged in as</p>
             <p className="text-sm font-medium text-white truncate">{user.name}</p>
             <p className="text-xs text-gray-500 capitalize">{user.role.toLowerCase()} • {user.base}</p>
          </div>
        </div>
        
        <nav className="flex-1 pt-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
          <NavItem page="dashboard" icon={LayoutDashboard} label="Dashboard" />
          
          {user.role === UserRole.ADMIN ? (
            <>
               <div className="pt-4 pb-2 px-4">
                 <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Inventory By Base</p>
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

        <div className="p-4 border-t border-gray-800 mt-auto">
          <button
            onClick={logout}
            className="flex items-center justify-center w-full px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors shadow-md"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header Bar */}
        <header className="bg-white shadow-sm h-16 flex justify-between items-center px-6 z-10">
           <div className="md:hidden flex items-center">
             <Box className="w-6 h-6 text-blue-600 mr-2" />
             <span className="font-bold text-gray-800 text-lg">InventoryQ</span>
           </div>
           
           <div className="hidden md:block">
              <h2 className="text-lg font-semibold text-gray-700 capitalize">
                {getPageTitle()}
              </h2>
           </div>

           <div className="flex items-center space-x-4">
              <button onClick={logout} className="md:hidden text-gray-500">
                <LogOut className="w-5 h-5" />
              </button>
           </div>
        </header>

        <div className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};