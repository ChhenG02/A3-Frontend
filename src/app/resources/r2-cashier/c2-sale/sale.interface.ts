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
    receipt_number: number;
    total_price: number;
    ordered_at?: Date;
    cashier: { id: number; name: string };
    details: Detail[];
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