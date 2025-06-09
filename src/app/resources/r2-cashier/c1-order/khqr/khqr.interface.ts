// khqr.interface.ts
export interface KHQRRequest {
    bank_account: string;
    merchant_name: string;
    merchant_city: string;
    amount: number;
    currency: string;
    store_label: string;
    phone_number: string;
    bill_number: string;
    terminal_label: string;
    static: boolean;
}

export interface KHQRResponse {
    qr: string;
}
