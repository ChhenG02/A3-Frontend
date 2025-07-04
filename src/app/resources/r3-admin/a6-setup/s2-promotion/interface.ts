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
  start_date: string; 
  end_date: string;  
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
