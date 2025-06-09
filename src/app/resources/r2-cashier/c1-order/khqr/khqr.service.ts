// khqr.service.ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { env } from 'envs/env';
import { KHQRRequest, KHQRResponse } from './khqr.interface';

@Injectable({
    providedIn: 'root',
})
export class KhqrService {
    constructor(private httpClient: HttpClient) {}

    
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
}