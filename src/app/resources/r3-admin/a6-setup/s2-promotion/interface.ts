export interface PromotionList {
  data: {
    Promotion: PromotionData[];
  };
  statusCode: number;
  success: boolean;
  message: string;
  meta: PaginationMeta;
}

export interface PromotionData {
  id: number;
  discount_value: number;
  start_date: string; // or Date if you parse it later
  end_date: string;   // or Date
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
