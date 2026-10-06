// ============================================================
// PERN Full-Stack Technical Case Study Types
// Workflow: Enquiry -> Quotation -> Sales Order -> Inventory -> Dispatch
// ============================================================

export type UserRole = 'ADMIN' | 'SALES_USER' | 'Super Admin' | 'Admin' | 'Operator' | 'Customer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company: string;
  address?: string;
  created_at?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  unit_price: number;
  physical_quantity: number;
  reserved_quantity: number;
  available_quantity: number; // Available = Physical - Reserved
  created_at?: string;
}

export type EnquiryStatus = 'NEW' | 'QUOTED' | 'CLOSED';

export interface EnquiryItem {
  id: string;
  enquiry_id: string;
  product_id: string;
  sku?: string;
  product_name?: string;
  list_price?: number;
  quantity: number;
  target_price?: number;
  notes?: string;
  physical_quantity?: number;
  reserved_quantity?: number;
  available_quantity?: number;
}

export interface Enquiry {
  id: string;
  enquiry_number: string;
  customer_id: string;
  customer_name?: string;
  customer_company?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  status: EnquiryStatus;
  notes?: string;
  created_by_name?: string;
  item_count?: number;
  total_units?: number;
  created_at: string;
  items?: EnquiryItem[];
  quotations?: Array<{ id: string; quotation_number: string; status: string; total_amount: number }>;
}

export type QuotationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'ORDERED';

export interface QuotationItem {
  id: string;
  quotation_id: string;
  product_id: string;
  sku?: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  physical_quantity?: number;
  reserved_quantity?: number;
  available_quantity?: number;
}

export interface Quotation {
  id: string;
  quotation_number: string;
  enquiry_id: string;
  enquiry_number?: string;
  enquiry_notes?: string;
  customer_id: string;
  customer_name?: string;
  customer_company?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  status: QuotationStatus;
  subtotal: number;
  discount_pct: number;
  discount_amount: number;
  gst_rate_pct: number;
  gst_amount: number;
  total_amount: number;
  valid_until?: string;
  created_by_name?: string;
  sent_at?: string;
  decision_at?: string;
  created_at: string;
  sales_order_id?: string;
  sales_order_number?: string;
  sales_order_status?: string;
  items?: QuotationItem[];
}

export type SalesOrderStatus = 'PENDING' | 'CONFIRMED' | 'DISPATCHED' | 'CANCELLED';

export interface SalesOrderItem {
  id: string;
  sales_order_id: string;
  product_id: string;
  sku: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  physical_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  has_sufficient_stock: number | boolean;
}

export interface SalesOrder {
  id: string;
  order_number: string;
  quotation_id: string;
  quotation_number?: string;
  enquiry_id: string;
  enquiry_number?: string;
  enquiry_notes?: string;
  customer_id: string;
  customer_name: string;
  customer_company: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  status: SalesOrderStatus;
  total_amount: number;
  confirmed_by_name?: string;
  confirmed_at?: string;
  dispatched_by_name?: string;
  dispatched_at?: string;
  dispatch_tracking_number?: string;
  dispatch_notes?: string;
  created_at: string;
  item_count?: number;
  total_units?: number;
  items?: SalesOrderItem[];
  auditLogs?: InventoryTransaction[];
}

export interface InventoryTransaction {
  id: string;
  product_id: string;
  product_name?: string;
  sku?: string;
  sales_order_id?: string;
  transaction_type: 'RESERVED' | 'DISPATCHED' | 'RESTOCKED' | 'RELEASED';
  quantity: number;
  previous_physical: number;
  new_physical: number;
  previous_reserved: number;
  new_reserved: number;
  user_name?: string;
  created_at: string;
}
