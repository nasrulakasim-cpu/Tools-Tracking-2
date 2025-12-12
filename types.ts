export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  STOREKEEPER = 'STOREKEEPER',
  BASE_MANAGER = 'BASE_MANAGER',
}

export enum ItemStatus {
  WORKING = 'Working',
  FAULTY = 'Faulty',
  SCRAP = 'Scrap',
}

export enum RequestStatus {
  PENDING = 'PENDING', // Waiting for Storekeeper
  PENDING_MANAGER = 'PENDING_MANAGER', // Storekeeper Approved, Waiting for Manager
  APPROVED = 'APPROVED', // Fully Approved (Item released)
  REJECTED = 'REJECTED',
}

export enum RequestType {
  BORROW = 'BORROW', // Taking out
  RETURN = 'RETURN', // Bringing back
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  base: string; // e.g., "Lemal", "Base 2"
  email: string;
  password?: string; // New field for account creation
}

export interface InventoryItem {
  id: string; // Internal ID
  no: string; // "No." - Static item number from Excel
  description: string; // "Description"
  maker: string; // "Maker / Brand"
  range: string; // "Range / Capacity"
  typeModel: string; // "Type / Model"
  serialNo: string; // "Serial No."
  unitPrice: string; // "Unit Price"
  date: string; // "Date" (Purchase Date)
  poNo: string; // "P.O. No."
  quantity: number; // "Qty"
  assetNo: string; // "Asset No."
  location: string; // "Location" (Permanent Storage Location)
  equipmentStatus: string; // "Equipment Status"
  status: string; // "Status" (Condition)
  semsCategory: string; // "SEMS Category"
  physicalStatus: string; // "Physical Status"
  remarks?: string; // "Remark"
  
  // New / Tracking Fields
  currentLocation: string; // Where is it RIGHT NOW? (e.g. "In Store" or "Cabin A")
  personInCharge: string | null; // Who has it?
  lastMovementDate: string | null; // Date it was taken out
  
  base: string;
}

export interface RequestItem {
  itemId: string;
  description: string;
  serialNo: string;
}

export interface MovementRequest {
  id: string;
  type: RequestType;
  staffId: string;
  staffName: string;
  storekeeperId?: string;
  managerId?: string; // Track who gave final approval
  base: string;
  items: RequestItem[];
  status: RequestStatus;
  timestamp: string;
  rejectionReason?: string;
  
  // New fields for the request form
  targetLocation?: string; // Where is it going?
  targetDate?: string; // When is it needed?
}