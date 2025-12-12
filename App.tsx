import React, { useState, useMemo, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { InventoryTable } from './components/InventoryTable';
import { UserRole, RequestStatus, RequestType, MovementRequest, InventoryItem, ItemStatus, User } from './types';
import { generateQF21 } from './services/pdfService';
import { Check, X, FileText, Package, Clock, ArrowRightLeft, AlertCircle, Download, Zap, ChevronRight, LogIn, Upload, Plus, UserPlus, Users, Filter, Calendar, MapPin } from 'lucide-react';
import { SYSTEM_BASES } from './constants';

// --- Login Screen ---
const LoginScreen = () => {
  const { login, users } = useApp();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
             <Package className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">InventoryQ</h1>
          <p className="text-gray-500 text-sm">Sign in to manage assets</p>
        </div>
        
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Select User</p>
          {users.map(u => (
            <button
              key={u.id}
              onClick={() => login(u.id)}
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                  u.role === UserRole.ADMIN ? 'bg-purple-600' : 
                  u.role === UserRole.STOREKEEPER ? 'bg-orange-500' : 'bg-blue-500'
                }`}>
                  {u.name.charAt(0)}
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900 group-hover:text-blue-700">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.role} - {u.base}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500" />
            </button>
          ))}
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
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
        <div className={`${isBorrow ? 'bg-blue-600' : 'bg-green-600'} px-6 py-4 flex justify-between items-center`}>
          <h3 className="text-lg font-bold text-white flex items-center">
            {isBorrow ? <Package className="w-5 h-5 mr-2" /> : <ArrowRightLeft className="w-5 h-5 mr-2" />}
            {isBorrow ? 'Request to Borrow' : 'Request to Return'}
          </h3>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-gray-600 text-sm">
            You are requesting to {isBorrow ? 'borrow' : 'return'} <strong className="text-gray-900">{itemCount} items</strong>. 
            Please provide details for the storekeeper record.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isBorrow ? 'Target Location (Site / Cabin)' : 'Location to store it back (Store / Rack)'}
            </label>
            <div className="relative">
              <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
              <input 
                required
                type="text" 
                placeholder={isBorrow ? "e.g. Cabin 1, Project Site A" : "e.g. Rack A-1, Store Room"} 
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={targetLocation}
                onChange={(e) => setTargetLocation(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isBorrow ? 'Date Needed / Moving Out' : 'Date Returned'}
            </label>
            <div className="relative">
              <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
              <input 
                required
                type="date" 
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
            <button 
              type="submit" 
              className={`px-6 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 shadow-lg ${isBorrow ? 'bg-blue-600' : 'bg-green-600'}`}
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

  const myPendingRequests = requests.filter(r => r.staffId === user.id && r.status === RequestStatus.PENDING);
  const myApprovedRequests = requests.filter(r => r.staffId === user.id && r.status === RequestStatus.APPROVED && r.type === RequestType.BORROW);
  const pendingForStorekeeper = requests.filter(r => r.status === RequestStatus.PENDING && r.base === user.base);
  const totalItemsInBase = inventory.filter(i => i.base === user.base).length;
  const itemsInStore = inventory.filter(i => i.base === user.base && i.location === 'In Store').length;

  const StatCard = ({ title, value, subtext, icon: Icon, colorClass, borderClass }: any) => (
    <div className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${borderClass} flex items-start justify-between`}>
      <div>
        <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">{title}</p>
        <p className="text-4xl font-bold text-gray-800 mt-2">{value}</p>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
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
        <p className="text-gray-500">Welcome back, {user.name}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {user.role === UserRole.STOREKEEPER && (
          <>
            <StatCard 
              title="Pending Requests" 
              value={pendingForStorekeeper.length} 
              subtext="Awaiting Verification" 
              icon={Clock} 
              colorClass="bg-orange-500" 
              borderClass="border-orange-500" 
            />
            <StatCard 
              title="Store Inventory" 
              value={`${itemsInStore} / ${totalItemsInBase}`} 
              subtext="Available Items" 
              icon={Package} 
              colorClass="bg-blue-600" 
              borderClass="border-blue-600" 
            />
          </>
        )}

        {user.role === UserRole.STAFF && (
          <>
            <StatCard 
              title="My Pending" 
              value={myPendingRequests.length} 
              subtext="Requests Processing" 
              icon={Clock} 
              colorClass="bg-orange-500" 
              borderClass="border-orange-500" 
            />
            <StatCard 
              title="Items Held" 
              value={myApprovedRequests.reduce((acc, r) => acc + r.items.length, 0)} 
              subtext="To be returned" 
              icon={Package} 
              colorClass="bg-blue-600" 
              borderClass="border-blue-600" 
            />
          </>
        )}
        
        {user.role === UserRole.ADMIN && (
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg col-span-3 text-white">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/10 rounded-full">
                <Zap className="w-8 h-8 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold">System Status: Operational</h3>
                <p className="text-gray-300 mt-1">{requests.length} total transactions logged. {inventory.length} items in database.</p>
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
          <div className="bg-blue-100 p-2 rounded-lg"><UserPlus className="w-6 h-6 text-blue-600" /></div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Add New User</h2>
            <p className="text-sm text-gray-500">Register new staff or storekeepers to the system.</p>
          </div>
        </div>

        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input 
              required
              type="text" 
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="john@company.com"
              value={newUser.email}
              onChange={e => setNewUser({...newUser, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select 
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={newUser.role}
              onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
            >
              <option value={UserRole.STAFF}>Staff</option>
              <option value={UserRole.STOREKEEPER}>Storekeeper</option>
              <option value={UserRole.ADMIN}>Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Base / Location</label>
            <select 
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter temporary password"
              value={newUser.password}
              onChange={e => setNewUser({...newUser, password: e.target.value})}
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-colors flex items-center">
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
                 className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm ring-2 ring-blue-100"
               >
                 <Download className="w-4 h-4 mr-2" />
                 Export Excel
              </button>
            </>
          )}

          {user.role === UserRole.STAFF && (
            <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
              <button 
                onClick={() => { setStaffMode('borrow'); setSelectedItems([]); }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${staffMode === 'borrow' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
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
        selectionMode={user.role === UserRole.STAFF ? staffMode : 'none'}
        onUpdateItem={updateItem}
      />

      {user.role === UserRole.STAFF && selectedItems.length > 0 && (
        <div className="fixed bottom-8 right-8 z-50 animate-bounce-slow">
          <button 
            onClick={handleInitiateRequest}
            className={`${staffMode === 'borrow' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} text-white px-8 py-4 rounded-full shadow-xl flex items-center font-bold text-lg transition-transform transform hover:scale-105 ring-4 ring-white`}
          >
            {staffMode === 'borrow' ? <Package className="w-6 h-6 mr-3" /> : <ArrowRightLeft className="w-6 h-6 mr-3" />}
            {staffMode === 'borrow' ? 'Request to Borrow' : 'Request to Return'}
            <span className={`ml-2 bg-white ${staffMode === 'borrow' ? 'text-blue-600' : 'text-green-600'} px-2 py-0.5 rounded-full text-sm`}>
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

// --- History / Verification Page Component ---
const HistoryPage = () => {
  const { user, requests, processRequest, inventory } = useApp();
  
  if (!user) return null;

  const pendingRequests = requests.filter(r => r.base === user.base && r.status === RequestStatus.PENDING);
  const historyRequests = user.role === UserRole.ADMIN 
    ? requests 
    : user.role === UserRole.STOREKEEPER
      ? requests.filter(r => r.base === user.base && r.status !== RequestStatus.PENDING)
      : requests.filter(r => r.staffId === user.id);

  const handleVerify = (request: MovementRequest, approve: boolean) => {
    processRequest(request.id, approve);
    if (approve && request.type === RequestType.BORROW) {
       generateQF21(request, inventory, user.role === UserRole.STOREKEEPER ? user.name : 'System');
    }
  };

  return (
    <div className="space-y-8">
      {user.role === UserRole.STOREKEEPER && pendingRequests.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-orange-100 overflow-hidden">
          <div className="bg-orange-500 px-6 py-4 flex items-center text-white">
            <AlertCircle className="w-5 h-5 mr-2" />
            <h3 className="font-bold">Pending Approvals Needed</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingRequests.map(req => (
              <div key={req.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-orange-50/10 transition-colors">
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
                    onClick={() => handleVerify(req, false)}
                    className="flex items-center px-5 py-2.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-sm font-medium transition-colors"
                  >
                    <X className="w-4 h-4 mr-2" /> Reject
                  </button>
                  <button 
                    onClick={() => handleVerify(req, true)}
                    className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-md transition-colors"
                  >
                    <Check className="w-4 h-4 mr-2" /> Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">Transaction Logs</h2>
          <button className="text-sm text-blue-600 font-medium hover:underline">Export Logs</button>
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
                {(user.role === UserRole.STOREKEEPER || user.role === UserRole.ADMIN) && (
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
                    {req.status === RequestStatus.PENDING && <span className="inline-flex items-center text-orange-600 font-semibold text-xs"><Clock className="w-3 h-3 mr-1"/> Pending</span>}
                  </td>
                  {(user.role === UserRole.STOREKEEPER || user.role === UserRole.ADMIN) && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {req.status === RequestStatus.APPROVED && req.type === RequestType.BORROW && (
                        <button 
                          onClick={() => generateQF21(req, inventory, user.role === UserRole.STOREKEEPER ? user.name : 'System')}
                          className="text-blue-600 hover:text-blue-900 flex items-center justify-end w-full"
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