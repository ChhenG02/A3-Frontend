import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { env } from 'envs/env';
import { StockStatusData, StockStatusList } from './interface';

@Injectable({
    providedIn: 'root',
})
export class StockStatusService {
    private baseUrl = `${env.API_BASE_URL}/admin/settings/stock_status`;

    constructor(private httpClient: HttpClient) {}

    getData(): Observable<StockStatusList> {
        return this.httpClient
            .get<StockStatusList>(this.baseUrl, {
                headers: new HttpHeaders().set('Content-Type', 'application/json'),
            })
            .pipe(
                catchError((error) => {
                    return of({
                        data: { StockStatus: [] },
                        message: 'Failed to load stock statuses',
                        statusCode: 0,
                        success: false,
                        meta: {
                            timestamp: '',
                            page: 1,
                            limit: 10,
                            totalCount: 0,
                            totalPages: 0,
                            hasNext: false,
                            hasPrevious: false
                        }
                    });
                })
            );
    }

    create(body: {
        name: string;
        color: string;
        min_items: number;
        max_items: number;
    }): Observable<{ data: StockStatusData; message: string }> {
        return this.httpClient.post<{ data: StockStatusData; message: string }>(
            this.baseUrl,
            body,
            { headers: new HttpHeaders().set('Content-Type', 'application/json') }
        );
    }

    update(
        id: number,
        body: {
            name: string;
            color: string;
            min_items: number;
            max_items: number;
        }
    ): Observable<{ data: StockStatusData; message: string }> {
        return this.httpClient.patch<{ data: StockStatusData; message: string }>(
            `${this.baseUrl}/${id}`,
            body,
            { headers: new HttpHeaders().set('Content-Type', 'application/json') }
        );
    }

    delete(id: number): Observable<{ status_code: number; message: string }> {
        return this.httpClient.delete<{ status_code: number; message: string }>(
            `${this.baseUrl}/${id}`,
            { headers: new HttpHeaders().set('Content-Type', 'application/json') }
        );
    }
}