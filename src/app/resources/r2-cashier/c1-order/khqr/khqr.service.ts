// khqr.service.ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { env } from 'envs/env';
import {
    KHQRRequest,
    KHQRResponse,
    CheckPaymentRequest,
    CheckPaymentResponse,
} from './khqr.interface';

@Injectable({
    providedIn: 'root',
})
export class KhqrService {
    public lastMd5: string = '';
    constructor(private httpClient: HttpClient) { }

    // Method to generate KHQR code
    generateQRCode(requestData: KHQRRequest): Observable<KHQRResponse> {
        return this.httpClient
            .post<KHQRResponse>(`${env.API_BASE_URL}/khqr`, requestData, {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json',
                }),
            })
            .pipe(
                catchError((error) => {
                    // Handle error by returning a new observable that throws the error
                    return throwError(() => error);
                })
            );
    }

    // Method to check if payment has been made
    checkPaymentStatus(
        requestData: CheckPaymentRequest
    ): Observable<CheckPaymentResponse> {
        return this.httpClient
            .post<CheckPaymentResponse>(
                `${env.API_BASE_URL}/check-payment`,
                requestData,
                {
                    headers: new HttpHeaders({
                        'Content-Type': 'application/json',
                    }),
                }
            )
            .pipe(
                catchError((error) => {
                    return throwError(() => error);
                })
            );
    }
}
