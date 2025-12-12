import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { InventoryItem, MovementRequest, User, RequestStatus, RequestType, UserRole } from '../types';
import { INITIAL_INVENTORY, MOCK_USERS } from '../constants';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabaseClient';

interface AppContextType {
  user: User | null;
  users: User[];
  login: (userId: string) => void;
  logout: () => void;
  addUser: (newUser: User) => Promise<void>;
  inventory: InventoryItem[];
  importInventoryFromExcel: (fileBuffer: ArrayBuffer, targetBase?: string) => void;
  exportInventoryToExcel: (items: InventoryItem[], baseName?: string) => void;
  requests: MovementRequest[];
  createRequest: (itemIds: string[], type: RequestType, location?: string, date?: string) => Promise<void>;
  processRequest: (requestId: string, approved: boolean) => Promise<void>;
  updateItem: (item: InventoryItem) => Promise<void>;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [requests, setRequests] = useState<MovementRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Initial Data Fetching ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // 1. Fetch Users
      let loadedUsers: User[] = [];
      try {
        const { data, error } = await supabase.from('users').select('*');
        if (error) throw error;
        
        loadedUsers = data as User[] || [];
        
        // Seeding Users if empty table exists (Optional client-side seeding)
        if (loadedUsers.length === 0) {
           // Fallback to Mocks if DB is empty
           loadedUsers = MOCK_USERS;
        }
      } catch (error: any) {
        console.warn("Supabase Error (Users):", error.message || JSON.stringify(error));
        // FALLBACK: Use Mock Data so app doesn't crash
        loadedUsers = MOCK_USERS; 
      }
      setUsers(loadedUsers);

      // 2. Fetch Inventory
      let loadedInventory: InventoryItem[] = [];
      try {
        const { data, error } = await supabase.from('inventory').select('*');
        if (error) throw error;

        loadedInventory = data as InventoryItem[] || [];

        if (loadedInventory.length === 0) {
           loadedInventory = INITIAL_INVENTORY;
        }
      } catch (error: any) {
         console.warn("Supabase Error (Inventory):", error.message || JSON.stringify(error));
         loadedInventory = INITIAL_INVENTORY;
      }
      setInventory(loadedInventory);

      // 3. Fetch Requests
      try {
        const { data, error } = await supabase.from('requests').select('*').order('timestamp', { ascending: false });
        if (error) throw error;
        setRequests(data as MovementRequest[] || []);
      } catch (error: any) {
        console.warn("Supabase Error (Requests):", error.message || JSON.stringify(error));
        // Fallback to empty requests if DB fails
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const login = (userId: string) => {
    const foundUser = users.find(u => u.id === userId);
    if (foundUser) setUser(foundUser);
  };

  const logout = () => setUser(null);

  const addUser = async (newUser: User) => {
    try {
      // Optimistic Update
      setUsers(prev => [...prev, newUser]);

      const { error } = await supabase.from('users').insert(newUser);
      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error("Error adding user:", error.message || error);
      alert("Failed to sync user to database, but added locally.");
    }
  };

  const importInventoryFromExcel = async (fileBuffer: ArrayBuffer, targetBase?: string) => {
    try {
      // 1. Read the Excel File
      const workbook = XLSX.read(fileBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' });

      // 2. Header Detection
      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(jsonData.length, 25); i++) {
        const row = jsonData[i].map((cell: any) => String(cell).toLowerCase());
        if (row.some(c => c.includes('description')) && row.some(c => c.includes('serial'))) {
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex === -1) {
        alert('Could not find the table header (looking for "Description" and "Serial No.") in the first 25 rows.');
        return;
      }

      // 3. Map Columns
      const headers = jsonData[headerRowIndex].map((h: any) => String(h).trim().toLowerCase());
      const findColIndex = (keywords: string[]) => 
        headers.findIndex((h: string) => keywords.some(k => h.includes(k)));

      const map = {
        no: findColIndex(['no.', 'no', 'bil', 'number']),
        desc: findColIndex(['description']),
        maker: findColIndex(['maker', 'brand']),
        range: findColIndex(['range', 'capacity']),
        model: findColIndex(['type', 'model']),
        serial: findColIndex(['serial', 's/n']),
        unitPrice: findColIndex(['unit price', 'price']),
        date: findColIndex(['date']),
        poNo: findColIndex(['p.o.', 'po no', 'purchase order']),
        qty: findColIndex(['qty', 'quantity']),
        assetNo: findColIndex(['asset no', 'asset']),
        location: findColIndex(['location']),
        status: findColIndex(['status']),
        sems: findColIndex(['sems', 'category']),
        physical: findColIndex(['physical']),
        remarks: findColIndex(['remark', 'note'])
      };

      const newItems: InventoryItem[] = [];

      for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0 || (map.desc > -1 && !row[map.desc])) continue;

        const getVal = (index: number) => (index > -1 && row[index] !== undefined ? String(row[index]).trim() : '-');
        const rawStatus = getVal(map.status);
        const status = rawStatus !== '-' ? rawStatus : 'Working';
        const storageLocation = getVal(map.location) !== '-' ? getVal(map.location) : 'In Store';

        const newItem: InventoryItem = {
          id: `IMP-${Date.now()}-${i}`,
          no: getVal(map.no) !== '-' ? getVal(map.no) : String(i - headerRowIndex),
          description: getVal(map.desc),
          maker: getVal(map.maker),
          range: getVal(map.range),
          typeModel: getVal(map.model),
          serialNo: getVal(map.serial) !== '-' ? getVal(map.serial) : `NO-SN-${Date.now()}-${i}`,
          unitPrice: getVal(map.unitPrice),
          date: getVal(map.date),
          poNo: getVal(map.poNo),
          quantity: parseInt(getVal(map.qty)) || 1,
          assetNo: getVal(map.assetNo) !== '-' ? getVal(map.assetNo) : `AST-${Date.now()}-${i}`,
          location: storageLocation,
          equipmentStatus: 'In Store',
          status: status,
          semsCategory: getVal(map.sems),
          physicalStatus: getVal(map.physical),
          remarks: getVal(map.remarks) !== '-' ? getVal(map.remarks) : '',
          currentLocation: storageLocation,
          personInCharge: null,
          lastMovementDate: null,
          base: targetBase || user?.base || 'HQ' 
        };
        newItems.push(newItem);
      }

      // Optimistic Update
      setInventory(prev => [...prev, ...newItems]);

      // Batch Insert to Supabase
      const { error } = await supabase.from('inventory').insert(newItems);
      if (error) {
        throw error;
      }

    } catch (error: any) {
      console.error("Error reading excel file or uploading:", error.message || error);
      alert("Failed to process Excel file completely. Check console.");
    }
  };

  const exportInventoryToExcel = (items: InventoryItem[], baseName?: string) => {
    // Export logic remains client-side, no DB interaction needed
    const dataToExport = items.map((item, idx) => ({
      'No.': idx + 1,
      'Description': item.description,
      'Maker / Brand': item.maker,
      'Range / Capacity': item.range,
      'Type / Model': item.typeModel,
      'Serial No.': item.serialNo,
      'Unit Price': item.unitPrice,
      'Purchase Date': item.date,
      'P.O. No.': item.poNo,
      'Quantity': item.quantity,
      'Asset No.': item.assetNo,
      'Location (Store)': item.location,
      'Equipment Status': item.equipmentStatus,
      'Status': item.status,
      'SEMS Category': item.semsCategory,
      'Physical Status': item.physicalStatus,
      'Remarks': item.remarks,
      'Current Live Location': item.currentLocation,
      'Person In Charge': item.personInCharge,
      'Last Movement Date': item.lastMovementDate,
      'Base': item.base
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const wscols = Object.keys(dataToExport[0] || {}).map(() => ({ wch: 20 }));
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
    
    const safeBaseName = baseName ? baseName.replace(/[^a-z0-9]/gi, '_') : 'MasterList';
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `Inventory_${safeBaseName}_${dateStr}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);
  };

  const createRequest = async (itemIds: string[], type: RequestType, location?: string, date?: string) => {
    if (!user) return;
    
    const requestItems = itemIds.map(id => {
      const item = inventory.find(i => i.id === id);
      return {
        itemId: id,
        description: item?.description || 'Unknown',
        serialNo: item?.serialNo || 'Unknown'
      };
    });

    const newRequest: MovementRequest = {
      id: `REQ-${Date.now()}`,
      type,
      staffId: user.id,
      staffName: user.name,
      base: user.base,
      items: requestItems,
      status: RequestStatus.PENDING,
      timestamp: new Date().toISOString(),
      // Ensure we send null if undefined, to be explicit with DB
      targetLocation: location ?? undefined,
      targetDate: date ?? undefined
    };

    // Optimistic Update
    setRequests(prev => [newRequest, ...prev]);

    try {
      const { error } = await supabase.from('requests').insert(newRequest);
      if (error) {
         throw error;
      }
    } catch (error: any) {
      console.error("Error creating request:", error.message || error);
      alert("Failed to submit request to DB. It is visible locally only.");
    }
  };

  const processRequest = async (requestId: string, approved: boolean) => {
    if (!user) return;

    // Determine New Status based on Role and Request Type
    const targetRequest = requests.find(r => r.id === requestId);
    if (!targetRequest) return;

    let newStatus = RequestStatus.REJECTED;

    if (approved) {
      if (user.role === UserRole.STOREKEEPER) {
        // Storekeeper Logic
        if (targetRequest.type === RequestType.BORROW) {
          // Borrow requests go to Manager next
          newStatus = RequestStatus.PENDING_MANAGER;
        } else {
          // Return requests are final
          newStatus = RequestStatus.APPROVED;
        }
      } else if (user.role === UserRole.BASE_MANAGER) {
        // Manager Logic
        // Manager approval is final for Borrows
        newStatus = RequestStatus.APPROVED;
      } else {
        // Fallback for Admin
        newStatus = RequestStatus.APPROVED;
      }
    } else {
      newStatus = RequestStatus.REJECTED;
    }

    const updates: any = {
      status: newStatus,
    };
    
    if (user.role === UserRole.STOREKEEPER) updates.storekeeperId = user.id;
    if (user.role === UserRole.BASE_MANAGER) updates.managerId = user.id;

    // Optimistic Update for Request Status
    setRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        return { ...req, ...updates };
      }
      return req;
    }));

    try {
      // 1. Update Request Status in DB
      const { error: reqError } = await supabase
        .from('requests')
        .update(updates)
        .eq('id', requestId);

      if (reqError) throw reqError;

      // 2. ONLY if Status is fully APPROVED, Update Inventory Items in DB
      if (newStatus === RequestStatus.APPROVED) {
          const itemIdsToUpdate = targetRequest.items.map(i => i.itemId);

          // Update Local Inventory State
          setInventory(prev => prev.map(item => {
             if (itemIdsToUpdate.includes(item.id)) {
                let itemUpdates = {};
                if (targetRequest.type === RequestType.BORROW) {
                   itemUpdates = {
                      equipmentStatus: `Borrowed by ${targetRequest.staffName}`,
                      personInCharge: targetRequest.staffName,
                      currentLocation: targetRequest.targetLocation || 'Unknown Site',
                      lastMovementDate: targetRequest.targetDate || new Date().toLocaleDateString()
                   };
                } else {
                   itemUpdates = {
                      equipmentStatus: 'In Store',
                      personInCharge: null,
                      currentLocation: item.location, // Back to storage location
                      lastMovementDate: new Date().toLocaleDateString()
                   };
                }
                return { ...item, ...itemUpdates };
             }
             return item;
          }));

          // DB Updates
          const dbUpdates = itemIdsToUpdate.map(async (itemId) => {
             const item = inventory.find(i => i.id === itemId);
             if (!item) return;

             let updatePayload: Partial<InventoryItem> = {};

             if (targetRequest.type === RequestType.BORROW) {
                updatePayload = {
                  equipmentStatus: `Borrowed by ${targetRequest.staffName}`,
                  personInCharge: targetRequest.staffName,
                  currentLocation: targetRequest.targetLocation || 'Unknown Site',
                  lastMovementDate: targetRequest.targetDate || new Date().toLocaleDateString()
                };
             } else if (targetRequest.type === RequestType.RETURN) {
                updatePayload = {
                  equipmentStatus: 'In Store',
                  personInCharge: null,
                  currentLocation: item.location,
                  lastMovementDate: new Date().toLocaleDateString()
                };
             }

             if (Object.keys(updatePayload).length > 0) {
               await supabase.from('inventory').update(updatePayload).eq('id', itemId);
             }
          });
          await Promise.all(dbUpdates);
      }

    } catch (error: any) {
      console.error("Error processing request:", error.message || error);
      alert("Database sync failed. Changes applied locally.");
    }
  };

  const updateItem = async (updatedItem: InventoryItem) => {
    // Optimistic Update
    setInventory(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));

    try {
      const { error } = await supabase
        .from('inventory')
        .update(updatedItem)
        .eq('id', updatedItem.id);

      if (error) throw error;
    } catch (error: any) {
       console.error("Error updating item:", error.message || error);
       alert("Failed to update item in database.");
    }
  };

  return (
    <AppContext.Provider value={{ user, users, login, logout, addUser, inventory, importInventoryFromExcel, exportInventoryToExcel, requests, createRequest, processRequest, updateItem, loading }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};