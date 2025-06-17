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
    receipt_number: string; // Changed to string to match backend
    sub_total_price: number; // Added
    discount_price: number; // Added
    total_price: number;
    platform: string; // Added to match backend
    ordered_at?: Date;
    cashier: Cashier;
    details: Detail[];
    payment?: { payment_method: string }; // Added
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