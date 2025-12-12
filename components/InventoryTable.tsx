import React, { useState, useMemo, useEffect, useRef } from 'react';
import { InventoryItem, UserRole } from '../types';
import { Edit2, X, Filter, Search, Check, ChevronDown, Trash2 } from 'lucide-react';

interface InventoryTableProps {
  items: InventoryItem[];
  userRole: UserRole;
  currentUserId?: string;
  currentUserName?: string;
  onSelectionChange?: (selectedIds: string[]) => void;
  selectionMode?: 'borrow' | 'return' | 'none';
  onUpdateItem?: (item: InventoryItem) => void;
}

// Helper to safely get string values from item
const getValue = (item: InventoryItem, key: keyof InventoryItem): string => {
  const val = item[key];
  return val !== undefined && val !== null ? String(val) : '';
};

// Column Configuration
const COLUMNS = [
  { key: 'no', label: 'No.', width: 'w-16' },
  { key: 'description', label: 'Description', width: 'min-w-[200px]' },
  
  // NEW COLUMNS REQUESTED
  { key: 'currentLocation', label: 'Item Location', width: 'min-w-[150px]' },
  { key: 'personInCharge', label: 'Person In Charge', width: 'min-w-[150px]' },
  { key: 'lastMovementDate', label: 'Date Out/Moved', width: 'min-w-[120px]' },
  
  { key: 'maker', label: 'Maker / Brand', width: 'w-32' },
  { key: 'range', label: 'Range / Capacity', width: 'w-32' },
  { key: 'typeModel', label: 'Type / Model', width: 'min-w-[120px]' },
  { key: 'serialNo', label: 'Serial No.', width: 'min-w-[120px]' },
  { key: 'unitPrice', label: 'Unit Price', width: 'min-w-[100px]' },
  { key: 'date', label: 'Purchase Date', width: 'min-w-[100px]' },
  { key: 'poNo', label: 'P.O. No.', width: 'min-w-[120px]' },
  { key: 'quantity', label: 'Qty', width: 'w-20', align: 'center' },
  { key: 'assetNo', label: 'Asset No.', width: 'min-w-[120px]' },
  { key: 'location', label: 'Store Location', width: 'min-w-[150px]' },
  { key: 'equipmentStatus', label: 'Equipment Status', width: 'min-w-[150px]' },
  { key: 'status', label: 'Status', width: 'min-w-[100px]' },
  { key: 'semsCategory', label: 'SEMS Category', width: 'min-w-[120px]' },
  { key: 'physicalStatus', label: 'Physical Status', width: 'min-w-[120px]' },
  { key: 'remarks', label: 'Remark', width: 'min-w-[150px]' },
];

interface FilterHeaderProps {
  colKey: string;
  label: string;
  width: string;
  align?: string;
  items: InventoryItem[];
  activeFilter: string[] | undefined;
  onApply: (selected: string[]) => void;
  isOpen: boolean;
  setOpenCol: (col: string | null) => void;
}

const FilterHeader: React.FC<FilterHeaderProps> = ({ 
  colKey, label, width, align, items, activeFilter, onApply, isOpen, setOpenCol 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tempSelected, setTempSelected] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Calculate unique options from the full item list
  const uniqueOptions = useMemo(() => {
    const opts = new Set(items.map(i => getValue(i, colKey as keyof InventoryItem)));
    return Array.from(opts).sort();
  }, [items, colKey]);

  // Filter options based on search term in dropdown
  const visibleOptions = useMemo(() => {
    return uniqueOptions.filter(opt => 
      opt.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [uniqueOptions, searchTerm]);

  // Initialize temp selection when opening
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      // If no active filter, select ALL options. If active filter, select those.
      if (!activeFilter || activeFilter.length === 0) {
        setTempSelected(new Set(uniqueOptions));
      } else {
        setTempSelected(new Set(activeFilter));
      }
    }
  }, [isOpen, uniqueOptions, activeFilter]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenCol(null);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, setOpenCol]);

  const toggleOption = (opt: string) => {
    const newSet = new Set(tempSelected);
    if (newSet.has(opt)) newSet.delete(opt);
    else newSet.add(opt);
    setTempSelected(newSet);
  };

  const handleSelectAll = (checked: boolean) => {
    const newSet = new Set(tempSelected);
    if (checked) {
      visibleOptions.forEach(opt => newSet.add(opt));
    } else {
      visibleOptions.forEach(opt => newSet.delete(opt));
    }
    setTempSelected(newSet);
  };

  const handleApply = () => {
    // If all options are selected, treat as "No Filter" (pass empty array)
    if (tempSelected.size === uniqueOptions.length && uniqueOptions.length > 0) {
      onApply([]); // Clear filter
    } else {
      onApply(Array.from(tempSelected));
    }
    setOpenCol(null);
  };

  const handleClear = () => {
    onApply([]);
    setOpenCol(null);
  };

  // New: Handle Enter key in search box to instantly filter ONLY the visible results
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Select ONLY visible options (deselect everything else)
      // This matches user expectation: "I searched for X, I want to filter to X"
      onApply(visibleOptions);
      setOpenCol(null);
    }
  };

  const isFiltered = activeFilter !== undefined && activeFilter.length > 0;
  
  // Checkbox indeterminate state logic
  const areAllVisibleSelected = visibleOptions.length > 0 && visibleOptions.every(opt => tempSelected.has(opt));
  const isIndeterminate = !areAllVisibleSelected && visibleOptions.some(opt => tempSelected.has(opt));

  return (
    <th className={`px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-300 ${width} relative group select-none`}>
      <div className={`flex items-center justify-between cursor-pointer hover:text-white ${isFiltered ? 'text-blue-400' : ''}`}
           onClick={() => setOpenCol(isOpen ? null : colKey)}>
        <span className={align === 'center' ? 'mx-auto' : ''}>{label}</span>
        <div className={`p-1 rounded hover:bg-gray-700 ml-2 transition-colors ${isFiltered ? 'bg-gray-700 text-blue-400' : 'text-gray-500'}`}>
          {isFiltered ? <Filter className="w-3 h-3 fill-current" /> : <ChevronDown className="w-3 h-3" />}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div ref={dropdownRef} className="absolute top-full right-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 text-gray-800 font-normal normal-case animate-in fade-in zoom-in-95 duration-100 origin-top-right">
          <div className="p-3 border-b border-gray-100 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-2 top-2.5" />
              <input 
                type="text" 
                placeholder="Search (Enter to select)" 
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                autoFocus
              />
            </div>
            <div className="flex justify-between items-center px-1">
               <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 p-1 rounded flex-1">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={areAllVisibleSelected}
                  ref={input => {
                    if (input) input.indeterminate = isIndeterminate;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
                <span className="font-semibold">(Select All)</span>
              </label>
              <button 
                onClick={() => setTempSelected(new Set())}
                className="text-xs text-gray-400 hover:text-red-600 hover:underline px-2"
                title="Uncheck all items"
              >
                Clear All
              </button>
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-200">
            {visibleOptions.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-2">No matches found</p>
            ) : (
              visibleOptions.map(opt => (
                <label key={opt} className="flex items-center space-x-2 px-2 py-1.5 hover:bg-blue-50 rounded cursor-pointer text-sm">
                  <input 
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={tempSelected.has(opt)}
                    onChange={() => toggleOption(opt)}
                  />
                  <span className="truncate">{opt || '(Blanks)'}</span>
                </label>
              ))
            )}
          </div>

          <div className="p-3 border-t border-gray-100 flex justify-between bg-gray-50 rounded-b-lg">
             <button 
               onClick={handleClear}
               className="text-xs text-gray-500 hover:text-gray-800 font-medium px-3 py-1.5 rounded hover:bg-gray-200 transition-colors"
             >
               Reset
             </button>
             <button 
               onClick={handleApply}
               className="text-xs bg-blue-600 text-white font-medium px-4 py-1.5 rounded shadow-sm hover:bg-blue-700 transition-colors"
             >
               Apply
             </button>
          </div>
        </div>
      )}
    </th>
  );
};

export const InventoryTable: React.FC<InventoryTableProps> = ({ 
  items, 
  userRole, 
  currentUserName,
  onSelectionChange,
  selectionMode = 'none',
  onUpdateItem
}) => {
  // Filter State: Key = Column Key, Value = Array of selected strings. 
  // If undefined/empty, no filter is active.
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [openFilterCol, setOpenFilterCol] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Clear selection when mode changes
  useEffect(() => {
    setSelectedIds(new Set());
    onSelectionChange?.([]);
  }, [selectionMode]);

  // --- Filtering Logic ---
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Iterate over all active filters
      return Object.entries(activeFilters).every(([key, selectedValues]) => {
        const values = selectedValues as string[];
        if (!values || values.length === 0) return true;
        const itemVal = getValue(item, key as keyof InventoryItem);
        return values.includes(itemVal);
      });
    });
  }, [items, activeFilters]);

  // --- Selection Logic ---
  const isSelectable = (item: InventoryItem) => {
    if (userRole !== UserRole.STAFF) return false;
    
    // Borrow Mode: Can only borrow items that are 'In Store' and not scrapped
    if (selectionMode === 'borrow') {
      return item.equipmentStatus === 'In Store' && !item.status.toLowerCase().includes('scrap');
    }
    
    // Return Mode: Can only return items that are currently held by this user
    if (selectionMode === 'return') {
      if (!currentUserName) return false;
      
      const pic = item.personInCharge;
      if (!pic) return false; // If nobody is in charge, I can't return it
      
      // Normalize strings for comparison
      const userNameLower = currentUserName.toLowerCase().trim();
      const picLower = pic.toLowerCase().trim();
      
      // Bi-directional check (e.g., "Bob" matches "Bob Staff")
      const nameMatch = userNameLower.includes(picLower) || picLower.includes(userNameLower);
      
      return nameMatch;
    }
    return false;
  };

  const handleCheckboxChange = (id: string) => {
    if (selectionMode === 'none') return;
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
    onSelectionChange?.(Array.from(newSelected));
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectionMode === 'none') return;
    if (e.target.checked) {
      const allSelectableIds = filteredItems.filter(isSelectable).map(item => item.id);
      const newSet = new Set(allSelectableIds);
      setSelectedIds(newSet);
      onSelectionChange?.(Array.from(newSet));
    } else {
      setSelectedIds(new Set());
      onSelectionChange?.([]);
    }
  };

  const handleEditClick = (item: InventoryItem) => {
    setEditingItem({ ...item });
  };

  const handleSaveEdit = () => {
    if (editingItem && onUpdateItem) {
      onUpdateItem(editingItem);
      setEditingItem(null);
    }
  };

  const getStatusBadge = (statusStr: string) => {
    const s = statusStr.toLowerCase();
    if (s.includes('working') || s.includes('good') || s.includes('baik')) return 'bg-green-100 text-green-800 border-green-200';
    if (s.includes('fault') || s.includes('rosak') || s.includes('bad') || s.includes('repair')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (s.includes('scrap') || s.includes('lupus') || s.includes('lost')) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const selectableItems = filteredItems.filter(isSelectable);
  const isAllSelected = selectableItems.length > 0 && selectableItems.every(item => selectedIds.has(item.id));
  const isIndeterminate = selectableItems.some(item => selectedIds.has(item.id)) && !isAllSelected;

  const handleUpdateFilter = (key: string, selected: string[]) => {
    const newFilters = { ...activeFilters };
    if (!selected || selected.length === 0) {
      delete newFilters[key];
    } else {
      newFilters[key] = selected;
    }
    setActiveFilters(newFilters);
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
         <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Detailed Inventory</h3>
         <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-gray-300 shadow-sm">
           <Filter className="w-3.5 h-3.5 text-gray-500" />
           <span className="text-xs font-medium text-gray-600">Showing {filteredItems.length} records</span>
        </div>
      </div>

      <div className="overflow-x-auto flex-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pb-32">
        <table className="min-w-full divide-y divide-gray-200 relative">
          <thead className="bg-gray-800 text-white sticky top-0 z-30 shadow-md">
            <tr>
              {selectionMode !== 'none' && (
                <th className="px-3 py-3 text-left w-10 sticky left-0 bg-gray-800 z-40 border-r border-gray-700">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={input => { if (input) input.indeterminate = isIndeterminate; }}
                    onChange={handleSelectAll}
                    disabled={selectableItems.length === 0}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-white/30 rounded cursor-pointer disabled:opacity-50"
                  />
                </th>
              )}
              
              {COLUMNS.map(col => (
                <FilterHeader 
                  key={col.key} 
                  colKey={col.key} 
                  label={col.label} 
                  width={col.width} 
                  // @ts-ignore
                  align={col.align}
                  items={items}
                  activeFilter={activeFilters[col.key]}
                  onApply={(selected) => handleUpdateFilter(col.key, selected)}
                  isOpen={openFilterCol === col.key}
                  setOpenCol={setOpenFilterCol}
                />
              ))}
              
              {userRole === UserRole.STOREKEEPER && (
                <th className="px-4 py-3 text-right sticky right-0 bg-gray-800 z-30 w-16">Edit</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredItems.map((item, idx) => {
              const selectable = isSelectable(item);
              const isSelected = selectedIds.has(item.id);
              
              return (
                <tr 
                  key={item.id} 
                  className={`
                    group transition-colors duration-150
                    ${isSelected ? 'bg-blue-50' : (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}
                    ${(selectable || isSelected) ? 'hover:bg-blue-50/80' : 'opacity-80'}
                  `}
                >
                  {selectionMode !== 'none' && (
                    <td className={`px-3 py-3 whitespace-nowrap sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${isSelected ? 'bg-blue-50' : (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}`}>
                       <input
                         type="checkbox"
                         disabled={!selectable}
                         checked={isSelected}
                         onChange={() => handleCheckboxChange(item.id)}
                         className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${!selectable ? 'cursor-not-allowed bg-gray-100 text-gray-300' : 'cursor-pointer'}`}
                       />
                    </td>
                  )}
                  {/* No. */}
                  <td className="px-4 py-3 text-sm text-gray-500 font-mono">{item.no}</td>
                  
                  {/* Description */}
                  <td className="px-4 py-3 text-sm font-semibold text-gray-800">{item.description}</td>
                  
                  {/* NEW COLUMNS */}
                  <td className="px-4 py-3 text-sm text-blue-600 font-medium">
                    {item.currentLocation}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {item.personInCharge || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                    {item.lastMovementDate || '-'}
                  </td>
                  
                  <td className="px-4 py-3 text-sm text-gray-600">{item.maker}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.range}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.typeModel || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-mono">{item.serialNo}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.unitPrice}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.date}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.poNo}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">{item.quantity}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.assetNo}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{item.location}</td>
                  
                  {/* Equipment Status Badge */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {item.equipmentStatus === 'In Store' ? (
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                         In Store
                       </span>
                    ) : (
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100">
                         {item.equipmentStatus}
                       </span>
                    )}
                  </td>
                  
                  {/* Status Badge */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  
                  <td className="px-4 py-3 text-sm text-gray-600">{item.semsCategory}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.physicalStatus}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate italic">{item.remarks || '-'}</td>
                  
                  {userRole === UserRole.STOREKEEPER && (
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium sticky right-0 z-20 bg-white group-hover:bg-blue-50 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      <button onClick={() => handleEditClick(item)} className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit Modal - Dynamic Fields based on COLUMNS */}
      {editingItem && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-0 overflow-hidden">
            <div className="bg-gray-800 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center">
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Item: {editingItem.serialNo}
              </h3>
              <button onClick={() => setEditingItem(null)} className="text-white/70 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {COLUMNS.map(col => (
                  <div key={col.key} className={col.key === 'description' || col.key === 'remarks' ? 'md:col-span-3' : ''}>
                     <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{col.label}</label>
                     {col.key === 'remarks' ? (
                       <textarea
                         value={getValue(editingItem, col.key as keyof InventoryItem)}
                         onChange={(e) => setEditingItem({ ...editingItem, [col.key]: e.target.value })}
                         className="block w-full border border-gray-300 rounded-lg shadow-sm p-2.5 text-sm"
                         rows={3}
                       />
                     ) : (
                       <input
                         type={col.key === 'quantity' ? 'number' : 'text'}
                         value={getValue(editingItem, col.key as keyof InventoryItem)}
                         onChange={(e) => setEditingItem({ ...editingItem, [col.key]: e.target.value })}
                         className="block w-full border border-gray-300 rounded-lg shadow-sm p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                       />
                     )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t">
              <button onClick={() => setEditingItem(null)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100">Cancel</button>
              <button onClick={handleSaveEdit} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 shadow-sm">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};