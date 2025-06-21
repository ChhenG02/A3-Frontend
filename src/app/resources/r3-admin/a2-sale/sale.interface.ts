// sale.interface.ts
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
    receipt_number: string; 
    sub_total_price: number; 
    discount_price?: number; // Optional, calculated as sub_total_price - total_price
    total_price: number;
    platform: string; 
    ordered_at?: Date;
    cashier: Cashier;
    details: Detail[];
    payment?: { payment_method: string }; 
}

export interface Detail {
    id: number;
    unit_price: number;
    qty: number;
    product: Product;
}

export interface Product {
    id: number;
    name: string;
    code: string;
    image: string;
    type: ProductType;
    promotion_id?: number;
    discount?: number; // Can be null, default to 0
}

export interface ProductType {
    name: string;
}

export interface Cashier {
    id: number;
    name: string;
}

export interface SetupResponse {
    cashiers: Cashier[];
}