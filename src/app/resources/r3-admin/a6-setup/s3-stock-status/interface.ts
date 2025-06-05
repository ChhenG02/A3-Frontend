export interface StockStatusList {
  data: {
    StockStatus: StockStatusData[];
  };
  statusCode: number;
  success: boolean;
  message: string;
  meta: PaginationMeta;
}

export interface StockStatusData {
  id: number;
  name: string;
  color: string;
  min_items: number;
  max_items: number;
  created_at: string;
}

export interface PaginationMeta {
  timestamp: string;
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}