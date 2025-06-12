export interface List {
  data: Data[];
  pagination: {
    page: number;
    limit: number;
    totalPage: number;
    total: number;
  };
}

export interface Data {
  type: any;
  id: number;
  type_id?: number;
  code: string;
  name: string;
  image: string;
  qty: number;
  unit_price: number;
  purchase_price: number;
  total_sale: number;
  created_at: Date;
  product_type: { id: number; name: string };
  creator: { id: number; name: string; avatar: string | null };
  stock_status: { id: number; name: string; color: string; avatar: string | null; min_items: number; max_items: number };
}

export interface ProductType {
  id: number;
  name: string;
}

export interface User {
  id: number;
  name: string;
}

export interface StockStatus {
  id: number;
  name: string;
}

export interface SetupResponse {
  productTypes: ProductType[];
  users: User[];
  stockStatuses: StockStatus[];
}