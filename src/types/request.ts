export type RequestPriority = 'low' | 'medium' | 'high';

export type RequestStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'completed';

export type RequestItem = {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
};

export type Request = {
  id: string;
  title: string;
  created_by: string;
  created_at: string;
  needed_by?: string;
  priority: RequestPriority;
  notes?: string;
  status: RequestStatus;
  items: RequestItem[];
  total_amount: number;
};