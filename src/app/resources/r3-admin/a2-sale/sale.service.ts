// ================================================================>> Core Library (Angular)
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

// ================================================================>> Third-Party Library (RxJS)
import { catchError, Observable, tap, throwError } from 'rxjs';

// ================================================================>> Custom Library
import { env } from 'envs/env';
import { LoadingSpinnerService } from 'helper/shared/loading/service';

import { List } from './sale.interface';

@Injectable({
    providedIn: 'root',
})
export class SaleService {
    constructor(private httpClient: HttpClient) {}

    // Method to fetch a list of sales from the POS system
    setup(): Observable<{ data: { id: number; name: string }[] }> {
        return this.httpClient.get<{ data: { id: number; name: string }[] }>(
            `${env.API_BASE_URL}/cashier/sales/setup`
        );
    }

    // Method to fetch a list of sales from the POS system
    private loadingSpinner = inject(LoadingSpinnerService);
    getData(params?: {
        page: number;
        page_size: number;
        key?: string;
        timeType?: string;
        cashier?: number;
        startDate?: string;
        endDate?: string;
    }): Observable<List> {
        if (!env.API_BASE_URL) {
            throw new Error('API_BASE_URL is not configured');
        }

        // Filter out null or undefined parameters
        const filteredParams: { [key: string]: any } = {};
        Object.keys(params || {}).forEach((key) => {
            if (params![key] !== null && params![key] !== undefined) {
                filteredParams[key] = params![key];
            }
        });

        this.loadingSpinner.open();
        return this.httpClient
            .get<List>(`${env.API_BASE_URL}/cashier/sales`, {
                params: filteredParams,
            })
            .pipe(
                tap(() => this.loadingSpinner.close()),
                catchError((error) => {
                    this.loadingSpinner.close();
                    console.error('Get sales data failed:', error);
                    return throwError(() => error);
                })
            );
    }

    // Method to deleted a sale
    delete(
        id: number = 0
    ): Observable<{ status_code: number; message: string }> {
        return this.httpClient.delete<{ status_code: number; message: string }>(
            `${env.API_BASE_URL}/cashier/sales/${id}`
        );
    }

    // Method to download an invoice PDF by order ID
    downloadInvoice(id: number): Observable<{ status: string; data: string; contentType: string }> {
        if (!env.API_BASE_URL) {
            throw new Error('API_BASE_URL is not configured');
        }
        if (id <= 0) {
            return throwError(() => new Error('Invalid order ID'));
        }
        this.loadingSpinner.open();
        return this.httpClient
            .get<{ status: string; data: string; contentType: string }>(
                `${env.API_BASE_URL}/share/report/invoice/view/${id}`
            )
            .pipe(
                tap(() => this.loadingSpinner.close()),
                catchError((error) => {
                    this.loadingSpinner.close();
                    console.error('Download invoice failed:', error);
                    return throwError(() => error);
                })
            );
    }
}
