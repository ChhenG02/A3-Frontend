// interface.ts
export interface List {
  data: Data[];
  pagination: {
    currentPage: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface Data {
  id: number;
  code: string;
  name: string;
  image: string;
  qty: number;
  unit_price: number;
  purchase_price: number;
  created_at: Date;
  product_type: { id: number; name: string };
  creator: { id: number; name: string; avatar: string | null };
  stock_status: { id: number; name: string; color: string; avatar: string | null; min_items: number; max_items: number };
}