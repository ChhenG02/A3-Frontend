import { Data as DataSale } from '../c2-sale/sale.interface';

export interface List {
    data: DataOrder[];
}

export interface DataOrder {
    id: number;
    name: string;
    products: Product[];
}

export interface Product {
    id: number;
    name: string;
    image: string;
    unit_price: number;
    code: string;
    product_type: ProductType;
    promotion_id?: number;
    discount?: number;
}

interface ProductType {
    name: string;
}

export interface ResponseOrder {
    data: DataSale;
    message: string;
}