import React, { useState, useMemo, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Layout, RemacoLogo } from './components/Layout';
import { InventoryTable } from './components/InventoryTable';
import { UserRole, RequestStatus, RequestType, MovementRequest, InventoryItem, ItemStatus, User } from './types';
import { generateQF21 } from './services/pdfService';
import { Check, X, FileText, Package, Clock, ArrowRightLeft, AlertCircle, Download, Zap, ChevronRight, LogIn, Upload, Plus, UserPlus, Users, Filter, Calendar, MapPin, Briefcase } from 'lucide-react';
import { SYSTEM_BASES } from './constants';

// --- Login Screen ---
const LoginScreen = () => {
  const { login, users } = useApp();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex overflow-hidden max-h-[600px]">
        
        {/* Left Side: Brand & Hero */}
        <div className="hidden md:flex flex-col justify-between w-1/2 bg-tnbBlue p-10 text-white relative overflow-hidden">
           {/* Abstract Decoration */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -mr-16 -mt-16 animate-pulse"></div>
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-tnbRed rounded-full mix-blend-multiply filter blur-3xl opacity-20 -ml-16 -mb-16"></div>

           <div className="z-10">
              {/* Remaco Logo Component */}
              <div className="mb-6">
                 <RemacoLogo className="w-12 h-12" textSize="text-3xl" />
              </div>
              <p className="text-blue-100 text-lg font-light leading-relaxed">
                Welcome to the centralized Equipment Management System. Secure, efficient, and reliable asset tracking.
              </p>
           </div>
           
           <div className="z-10 mt-10">
             <p className="text-xs text-blue-300 font-mono">System v1.2.0 | Authorized Personnel Only</p>
           </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-center bg-white">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-2xl font-bold text-gray-800">Sign In</h2>
            <p className="text-gray-500 mt-2">Select your user profile to continue.</p>
          </div>
          
          <div className="space-y-3 overflow-y-auto pr-2 max-h-[350px] scrollbar-thin scrollbar-thumb-gray-200">
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => login(u.id)}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-tnbBlue hover:bg-blue-50/50 transition-all duration-200 group bg-white shadow-sm hover:shadow-md"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${
                    u.role === UserRole.ADMIN ? 'bg-purple-600' : 
                    u.role === UserRole.BASE_MANAGER ? 'bg-teal-600' :
                    u.role === UserRole.STOREKEEPER ? 'bg-orange-500' : 'bg-tnbBlue'
                  }`}>
                    {u.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-800 group-hover:text-tnbBlue transition-colors">{u.name}</p>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{u.role} &bull; {u.base}</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-tnbBlue" />
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <p className="text-xs text-gray-400">
              By accessing this system, you agree to the TNB IT Security Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Request Details Modal ---
interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (location: string, date: string) => void;
  itemCount: number;
  mode: 'borrow' | 'return';
}

const RequestModal: React.FC<RequestModalProps> = ({ isOpen, onClose, onSubmit, itemCount, mode }) => {
  const [targetLocation, setTargetLocation] = useState('');
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTargetLocation('');
      setTargetDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetLocation && targetDate) {
      onSubmit(targetLocation, targetDate);
    }
  };

  const isBorrow = mode === 'borrow';

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
        <div className={`${isBorrow ? 'bg-tnbBlue' : 'bg-green-600'} px-6 py-4 flex justify-between items-center border-b border-white/10`}>
          <h3 className="text-lg font-bold text-white flex items-center tracking-wide">
            {isBorrow ? <Package className="w-5 h-5 mr-2 text-blue-200" /> : <ArrowRightLeft className="w-5 h-5 mr-2 text-green-200" />}
            {isBorrow ? 'Request to Borrow' : 'Request to Return'}
          </h3>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors bg-white/10 p-1 rounded hover:bg-white/20">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-sm">
               Selected Items: <strong className="text-gray-900 text-lg">{itemCount}</strong>
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              {isBorrow ? 'Target Location (Site / Cabin)' : 'Location to store it back (Store / Rack)'}
            </label>
            <div className="relative">
              <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
              <input 
                required
                type="text" 
                placeholder={isBorrow ? "e.g. Cabin 1, Project Site A" : "e.g. Rack A-1, Store Room"} 
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tnbBlue focus:border-tnbBlue focus:outline-none transition-all shadow-sm"
                value={targetLocation}
                onChange={(e) => setTargetLocation(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              {isBorrow ? 'Date Needed / Moving Out' : 'Date Returned'}
            </label>
            <div className="relative">
              <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
              <input 
                required
                type="date" 
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tnbBlue focus:border-tnbBlue focus:outline-none transition-all shadow-sm"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100 mt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button 
              type="submit" 
              className={`px-6 py-2.5 text-white rounded-lg text-sm font-bold hover:shadow-lg transition-all transform hover:-translate-y-0.5 ${isBorrow ? 'bg-tnbBlue hover:bg-blue-900' : 'bg-green-600 hover:bg-green-700'}`}
            >
              Confirm {isBorrow ? 'Request' : 'Return'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Dashboard Component ---
const Dashboard = () => {
  const { user, requests, inventory } = useApp();
  
  if (!user) return null;

  const myPendingRequests = requests.filter(r => r.staffId === user.id && (r.status === RequestStatus.PENDING || r.status === RequestStatus.PENDING_MANAGER));
  const myApprovedRequests = requests.filter(r => r.staffId === user.id && r.status === RequestStatus.APPROVED && r.type === RequestType.BORROW);
  
  const pendingForStorekeeper = requests.filter(r => r.status === RequestStatus.PENDING && r.base === user.base);
  const pendingForManager = requests.filter(r => r.status === RequestStatus.PENDING_MANAGER && r.base === user.base);
  
  const totalItemsInBase = inventory.filter(i => i.base === user.base).length;
  const itemsInStore = inventory.filter(i => i.base === user.base && i.location === 'In Store').length;

  const StatCard = ({ title, value, subtext, icon: Icon, colorClass, borderClass }: any) => (
    <div className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${borderClass} flex items-start justify-between hover:shadow-md transition-shadow`}>
      <div>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</p>
        <p className="text-4xl font-extrabold text-gray-800 mt-2 tracking-tight">{value}</p>
        {subtext && <p className="text-xs text-gray-400 mt-1 font-medium">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10`}>
        <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
        <p className="text-gray-500">Welcome back, <span className="text-tnbBlue font-semibold">{user.name}</span></p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {user.role === UserRole.STOREKEEPER && (
          <>
            <StatCard 
              title="Pending Store Approvals" 
              value={pendingForStorekeeper.length} 
              subtext="Needs Verification" 
              icon={Clock} 
              colorClass="bg-orange-500" 
              borderClass="border-orange-500" 
            />
            <StatCard 
              title="Awaiting Manager" 
              value={pendingForManager.length} 
              subtext="Passed Storekeeper" 
              icon={Briefcase} 
              colorClass="bg-teal-600" 
              borderClass="border-teal-600" 
            />
            <StatCard 
              title="Store Inventory" 
              value={`${itemsInStore} / ${totalItemsInBase}`} 
              subtext="Available Items" 
              icon={Package} 
              colorClass="bg-tnbBlue" 
              borderClass="border-tnbBlue" 
            />
          </>
        )}

        {user.role === UserRole.BASE_MANAGER && (
           <>
             <StatCard 
              title="Pending My Approval" 
              value={pendingForManager.length} 
              subtext="Requires Final Sign-off" 
              icon={Check} 
              colorClass="bg-teal-600" 
              borderClass="border-teal-600" 
            />
            <StatCard 
              title="Pending Storekeeper" 
              value={pendingForStorekeeper.length} 
              subtext="Incoming Queue" 
              icon={Clock} 
              colorClass="bg-orange-500" 
              borderClass="border-orange-500" 
            />
            <StatCard 
              title="Total Inventory" 
              value={totalItemsInBase} 
              subtext="Items in Base" 
              icon={Package} 
              colorClass="bg-tnbBlue" 
              borderClass="border-tnbBlue" 
            />
           </>
        )}

        {(user.role === UserRole.STAFF || user.role === UserRole.BASE_MANAGER) && user.role !== UserRole.STOREKEEPER && (
          <>
            <StatCard 
              title="My Pending" 
              value={myPendingRequests.length} 
              subtext="Processing" 
              icon={Clock} 
              colorClass="bg-orange-500" 
              borderClass="border-orange-500" 
            />
            <StatCard 
              title="Items Held" 
              value={myApprovedRequests.reduce((acc, r) => acc + r.items.length, 0)} 
              subtext="To be returned" 
              icon={Package} 
              colorClass="bg-tnbBlue" 
              borderClass="border-tnbBlue" 
            />
          </>
        )}
        
        {user.role === UserRole.ADMIN && (
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-xl shadow-lg col-span-3 text-white border-l-4 border-tnbRed">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/10 rounded-full animate-pulse">
                <Zap className="w-8 h-8 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold">System Status: Operational</h3>
                <p className="text-gray-300 mt-1 text-sm">{requests.length} total transactions logged. {inventory.length} items in database.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- User Management Component (Admin Only) ---
const UserManagementPage = () => {
  const { users, addUser, user } = useApp();
  const [newUser, setNewUser] = useState<Partial<User>>({
    role: UserRole.STAFF,
    base: SYSTEM_BASES[0],
    name: '',
    email: '',
    password: ''
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUser.name && newUser.email && newUser.base && newUser.password) {
      const createdUser: User = {
        id: `u-${Date.now()}`,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role as UserRole,
        base: newUser.base,
        password: newUser.password
      };
      addUser(createdUser);
      setNewUser({ role: UserRole.STAFF, base: SYSTEM_BASES[0], name: '', email: '', password: '' });
      alert('User created successfully!');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-blue-100 p-2 rounded-lg"><UserPlus className="w-6 h-6 text-tnbBlue" /></div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Add New User</h2>
            <p className="text-sm text-gray-500">Register new staff, storekeepers, or base managers.</p>
          </div>
        </div>

        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input 
              required
              type="text" 
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-tnbBlue focus:outline-none"
              placeholder="e.g. John Doe"
              value={newUser.name}
              onChange={e => setNewUser({...newUser, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input 
              required
              type="email" 
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-tnbBlue focus:outline-none"
              placeholder="john@company.com"
              value={newUser.email}
              onChange={e => setNewUser({...newUser, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select 
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-tnbBlue focus:outline-none"
              value={newUser.role}
              onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
            >
              <option value={UserRole.STAFF}>Staff</option>
              <option value={UserRole.STOREKEEPER}>Storekeeper</option>
              <option value={UserRole.BASE_MANAGER}>Base Manager</option>
              <option value={UserRole.ADMIN}>Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Base / Location</label>
            <select 
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-tnbBlue focus:outline-none"
              value={newUser.base}
              onChange={e => setNewUser({...newUser, base: e.target.value})}
            >
              {SYSTEM_BASES.map(base => (
                <option key={base} value={base}>{base}</option>
              ))}
              <option value="HQ">HQ</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Set Password</label>
            <input 
              required
              type="password" 
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-tnbBlue focus:outline-none"
              placeholder="Enter temporary password"
              value={newUser.password}
              onChange={e => setNewUser({...newUser, password: e.target.value})}
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="bg-tnbBlue hover:bg-blue-900 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-colors flex items-center">
              <Plus className="w-4 h-4 mr-2" /> Create Account
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center space-x-3">
          <Users className="w-5 h-5 text-gray-500" />
          <h3 className="font-bold text-gray-700">Existing Users</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Base</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{u.name}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    u.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-800' :
                    u.role === UserRole.BASE_MANAGER ? 'bg-teal-100 text-teal-800' :
                    u.role === UserRole.STOREKEEPER ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{u.base}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Inventory Page Component ---
const InventoryPage = ({ baseFilter }: { baseFilter?: string }) => {
  const { user, inventory, createRequest, updateItem, importInventoryFromExcel, exportInventoryToExcel } = useApp();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [staffMode, setStaffMode] = useState<'borrow' | 'return'>('borrow');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  
  if (!user) return null;

  const visibleItems = useMemo(() => {
    // If Admin and a baseFilter is set (from clicking specific sidebar link)
    if (user.role === UserRole.ADMIN) {
      if (baseFilter) {
        return inventory.filter(i => i.base === baseFilter);
      }
      return inventory; // If baseFilter is undefined (Master List), show all
    }
    // Non-admins only see their own base
    return inventory.filter(i => i.base === user.base);
  }, [user, inventory, baseFilter]);

  const handleInitiateRequest = async () => {
    if (selectedItems.length === 0) return;
    // Open modal for both borrow and return actions now
    setIsRequestModalOpen(true);
  };

  const handleSubmitRequest = async (location: string, date: string) => {
    const type = staffMode === 'borrow' ? RequestType.BORROW : RequestType.RETURN;
    await createRequest(selectedItems, type, location, date);
    setIsRequestModalOpen(false);
    setSelectedItems([]);
    alert(`${staffMode === 'borrow' ? 'Borrow' : 'Return'} request submitted successfully!`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read as ArrayBuffer for Excel parsing
    const reader = new FileReader();
    reader.onload = (evt) => {
      const buffer = evt.target?.result as ArrayBuffer;
      if (buffer) {
        importInventoryFromExcel(buffer, baseFilter);
        alert(`Inventory imported successfully${baseFilter ? ` to ${baseFilter}` : ''}!`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            {baseFilter ? `Inventory: ${baseFilter}` : 'Inventory Management'}
          </h2>
          <p className="text-sm text-gray-500">
            {baseFilter ? `Viewing items located at ${baseFilter}` : 'View and manage equipment status'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {user.role === UserRole.ADMIN && (
            <>
              <label className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition-colors text-sm font-medium shadow-sm ring-2 ring-green-100">
                <Upload className="w-4 h-4 mr-2" />
                Upload Excel
                <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
              </label>
              
              <button 
                 onClick={() => exportInventoryToExcel(visibleItems, baseFilter)}
                 className="flex items-center justify-center px-4 py-2 bg-tnbBlue text-white rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium shadow-sm ring-2 ring-blue-100"
               >
                 <Download className="w-4 h-4 mr-2" />
                 Export Excel
              </button>
            </>
          )}

          {/* Both Staff AND Base Managers can borrow/return items */}
          {(user.role === UserRole.STAFF || user.role === UserRole.BASE_MANAGER) && (
            <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
              <button 
                onClick={() => { setStaffMode('borrow'); setSelectedItems([]); }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${staffMode === 'borrow' ? 'bg-white shadow text-tnbBlue' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Borrow
              </button>
              <button 
                onClick={() => { setStaffMode('return'); setSelectedItems([]); }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${staffMode === 'return' ? 'bg-white shadow text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Return
              </button>
            </div>
          )}
        </div>
      </div>

      <InventoryTable 
        items={visibleItems} 
        userRole={user.role} 
        currentUserId={user.id}
        currentUserName={user.name}
        onSelectionChange={setSelectedItems}
        selectionMode={(user.role === UserRole.STAFF || user.role === UserRole.BASE_MANAGER) ? staffMode : 'none'}
        onUpdateItem={updateItem}
      />

      {(user.role === UserRole.STAFF || user.role === UserRole.BASE_MANAGER) && selectedItems.length > 0 && (
        <div className="fixed bottom-8 right-8 z-50 animate-bounce-slow">
          <button 
            onClick={handleInitiateRequest}
            className={`${staffMode === 'borrow' ? 'bg-tnbBlue hover:bg-blue-900' : 'bg-green-600 hover:bg-green-700'} text-white px-8 py-4 rounded-full shadow-xl flex items-center font-bold text-lg transition-transform transform hover:scale-105 ring-4 ring-white border-2 border-white`}
          >
            {staffMode === 'borrow' ? <Package className="w-6 h-6 mr-3" /> : <ArrowRightLeft className="w-6 h-6 mr-3" />}
            {staffMode === 'borrow' ? 'Request to Borrow' : 'Request to Return'}
            <span className={`ml-2 bg-white ${staffMode === 'borrow' ? 'text-tnbBlue' : 'text-green-600'} px-2 py-0.5 rounded-full text-sm`}>
              {selectedItems.length}
            </span>
          </button>
        </div>
      )}

      {/* Request Modal */}
      <RequestModal 
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSubmit={handleSubmitRequest}
        itemCount={selectedItems.length}
        mode={staffMode}
      />
    </div>
  );
};

// --- Verification Card Component ---
interface VerificationCardProps {
  req: MovementRequest;
  onVerify: (req: MovementRequest, approve: boolean) => void;
}

const VerificationCard: React.FC<VerificationCardProps> = ({ req, onVerify }) => (
  <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-orange-50/10 transition-colors">
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide ${req.type === RequestType.BORROW ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
          {req.type}
        </span>
        <span className="font-bold text-gray-900">{req.staffName}</span>
        <span className="text-gray-400 text-sm">&bull; {new Date(req.timestamp).toLocaleString()}</span>
      </div>
      <ul className="pl-4 border-l-2 border-gray-200 space-y-1">
        {req.items.map(item => (
            <li key={item.itemId} className="text-sm text-gray-700">
              {item.description} <span className="text-gray-400 text-xs">({item.serialNo})</span>
            </li>
        ))}
      </ul>
      {req.targetLocation && (
        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 bg-white p-2 rounded border border-gray-100">
            <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" /> {req.type === RequestType.BORROW ? 'Going to' : 'Restocking to'}: {req.targetLocation}</span>
            <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> Date: {req.targetDate}</span>
        </div>
      )}
    </div>
    <div className="flex gap-3">
      <button 
        onClick={() => onVerify(req, false)}
        className="flex items-center px-5 py-2.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-sm font-medium transition-colors"
      >
        <X className="w-4 h-4 mr-2" /> Reject
      </button>
      <button 
        onClick={() => onVerify(req, true)}
        className="flex items-center px-5 py-2.5 bg-tnbBlue text-white rounded-lg hover:bg-blue-900 text-sm font-medium shadow-md transition-colors"
      >
        <Check className="w-4 h-4 mr-2" /> Approve
      </button>
    </div>
  </div>
);

// --- History / Verification Page Component ---
const HistoryPage = () => {
  const { user, requests, processRequest, inventory } = useApp();
  
  if (!user) return null;

  // Storekeepers see PENDING
  const pendingRequests = requests.filter(r => r.base === user.base && r.status === RequestStatus.PENDING);
  
  // Managers see PENDING_MANAGER (Already approved by Storekeeper)
  const pendingManagerRequests = requests.filter(r => r.base === user.base && r.status === RequestStatus.PENDING_MANAGER);

  // History Filter
  let historyRequests = requests;
  if (user.role === UserRole.STOREKEEPER) {
     historyRequests = requests.filter(r => r.base === user.base && r.status !== RequestStatus.PENDING);
  } else if (user.role === UserRole.BASE_MANAGER) {
     historyRequests = requests.filter(r => r.base === user.base && r.status !== RequestStatus.PENDING_MANAGER);
  } else if (user.role === UserRole.STAFF) {
     historyRequests = requests.filter(r => r.staffId === user.id);
  }

  const handleVerify = (request: MovementRequest, approve: boolean) => {
    processRequest(request.id, approve);
    // If approved and it was the final step (either Return for Storekeeper, or Borrow for Manager)
    if (approve) {
       // Logic for generating PDF remains the same: Only if status is actually APPROVED 
       // This check happens inside AppContext update, but we can optimistically check here if it's the final step
       const isFinalApproval = (user.role === UserRole.BASE_MANAGER && request.type === RequestType.BORROW) || 
                               (user.role === UserRole.STOREKEEPER && request.type === RequestType.RETURN);
       
       if (isFinalApproval) {
          generateQF21(request, inventory, user.role === UserRole.STOREKEEPER ? user.name : 'System/Manager');
       }
    }
  };

  return (
    <div className="space-y-8">
      {/* Storekeeper Queue */}
      {user.role === UserRole.STOREKEEPER && pendingRequests.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-orange-100 overflow-hidden">
          <div className="bg-orange-500 px-6 py-4 flex items-center text-white">
            <AlertCircle className="w-5 h-5 mr-2" />
            <h3 className="font-bold">Pending Approvals Needed</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingRequests.map(req => <VerificationCard key={req.id} req={req} onVerify={handleVerify} />)}
          </div>
        </div>
      )}

      {/* Base Manager Queue */}
      {user.role === UserRole.BASE_MANAGER && pendingManagerRequests.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-teal-100 overflow-hidden">
          <div className="bg-teal-600 px-6 py-4 flex items-center text-white">
            <Briefcase className="w-5 h-5 mr-2" />
            <h3 className="font-bold">Manager Final Approvals Needed</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingManagerRequests.map(req => <VerificationCard key={req.id} req={req} onVerify={handleVerify} />)}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">Transaction Logs</h2>
          <button className="text-sm text-tnbBlue font-medium hover:underline">Export Logs</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Staff</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                {(user.role === UserRole.STOREKEEPER || user.role === UserRole.ADMIN || user.role === UserRole.BASE_MANAGER) && (
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {historyRequests.map(req => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(req.timestamp).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{req.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${req.type === RequestType.BORROW ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                      {req.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{req.staffName}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="font-medium text-gray-900">{req.items.length} item(s)</div>
                    <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{req.items.map(i => i.description).join(', ')}</div>
                    {req.targetLocation && <div className="text-xs text-blue-600 mt-1">{req.type === RequestType.BORROW ? 'To' : 'Store at'}: {req.targetLocation}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {req.status === RequestStatus.APPROVED && <span className="inline-flex items-center text-green-600 font-semibold text-xs"><Check className="w-3 h-3 mr-1"/> Approved</span>}
                    {req.status === RequestStatus.REJECTED && <span className="inline-flex items-center text-red-600 font-semibold text-xs"><X className="w-3 h-3 mr-1"/> Rejected</span>}
                    {req.status === RequestStatus.PENDING && <span className="inline-flex items-center text-orange-600 font-semibold text-xs"><Clock className="w-3 h-3 mr-1"/> Pending Store</span>}
                    {req.status === RequestStatus.PENDING_MANAGER && <span className="inline-flex items-center text-teal-600 font-semibold text-xs"><Briefcase className="w-3 h-3 mr-1"/> Pending Manager</span>}
                  </td>
                  {(user.role === UserRole.STOREKEEPER || user.role === UserRole.ADMIN || user.role === UserRole.BASE_MANAGER) && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {req.status === RequestStatus.APPROVED && req.type === RequestType.BORROW && (
                        <button 
                          onClick={() => generateQF21(req, inventory, user.role === UserRole.STOREKEEPER ? user.name : 'System')}
                          className="text-tnbBlue hover:text-blue-900 flex items-center justify-end w-full"
                        >
                          <FileText className="w-4 h-4 mr-1" /> QF.100
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {historyRequests.length === 0 && (
             <div className="p-10 text-center text-gray-400">
               <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
               <p>No transaction history available.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AppContent = () => {
  const { user } = useApp();
  const [activePage, setActivePage] = useState('dashboard');

  // Ensure dashboard is active on login
  useEffect(() => {
    if (user) {
      setActivePage('dashboard');
    }
  }, [user]);

  if (!user) {
    return <LoginScreen />;
  }

  // Handle Inventory Page Parsing
  // Check if active page is 'inventory' or 'inventory:BaseName'
  const isInventoryPage = activePage.startsWith('inventory');
  const inventoryBaseFilter = isInventoryPage && activePage.includes(':') 
    ? activePage.split(':')[1] 
    : undefined;

  return (
    <Layout activePage={activePage} setActivePage={setActivePage}>
      {activePage === 'dashboard' && <Dashboard />}
      {isInventoryPage && <InventoryPage baseFilter={inventoryBaseFilter} />}
      {activePage === 'history' && <HistoryPage />}
      {activePage === 'users' && <UserManagementPage />}
    </Layout>
  );
};

const App = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;