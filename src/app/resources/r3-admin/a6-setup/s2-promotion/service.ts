// ================================================================>> Core Library (Angular)
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

// ================================================================>> Third-Party Library (RxJS)
import { Observable, catchError, of, switchMap, tap } from 'rxjs';

// ================================================================>> Custom Library
import { env } from 'envs/env';
import { PromotionData } from './interface';

@Injectable({
    providedIn: 'root',
})
export class PromotionService {
    private baseUrl = `${env.API_BASE_URL}/admin/settings/promotion`;

    constructor(private httpClient: HttpClient) {}

    getData(): Observable<{
        data: { Promotion: PromotionData[] };
        message: string;
    }> {
        return this.httpClient
            .get<{ data: { Promotion: PromotionData[] }; message: string }>(
                this.baseUrl,
                {
                    headers: new HttpHeaders().set(
                        'Content-Type',
                        'application/json'
                    ),
                }
            )
            .pipe(
                catchError((error) => {
                    // You can re-throw the error or return a fallback structure
                    return of({
                        data: { Promotion: [] },
                        message: 'Failed to load promotions',
                    });
                })
            );
    }

    create(body: {
        discount_value: number;
        start_date: string;
        end_date: string;
    }): Observable<{ data: PromotionData; message: string }> {
        return this.httpClient.post<{ data: PromotionData; message: string }>(
            this.baseUrl,
            body,
            {
                headers: new HttpHeaders().set(
                    'Content-Type',
                    'application/json'
                ),
            }
        );
    }

    update(
        id: number,
        body: { discount_value: number; start_date: string; end_date: string }
    ): Observable<{ data: PromotionData; message: string }> {
        return this.httpClient.patch<{ data: PromotionData; message: string }>(
            `${this.baseUrl}/${id}`,
            body,
            {
                headers: new HttpHeaders().set(
                    'Content-Type',
                    'application/json'
                ),
            }
        );
    }

    delete(id: number): Observable<{ status_code: number; message: string }> {
        return this.httpClient.delete<{ status_code: number; message: string }>(
            `${this.baseUrl}/${id}`,
            {
                headers: new HttpHeaders().set(
                    'Content-Type',
                    'application/json'
                ),
            }
        );
    }
}
