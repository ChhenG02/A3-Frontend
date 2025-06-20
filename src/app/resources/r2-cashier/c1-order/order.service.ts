// ================================================================>> Core Library
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

// ================================================================>> Third party Library
import { Observable, catchError, tap, throwError } from 'rxjs';

// ================================================================>> Custom Library
import { env } from 'envs/env';
import { List, ResponseOrder } from './order.interface';
@Injectable({
    providedIn: 'root',
})
export class OrderService {
    constructor(private httpClient: HttpClient) {}

    // Method to fetch a list of products from the POS system
    getData(): Observable<List> {
        return this.httpClient
            .get<List>(`${env.API_BASE_URL}/cashier/ordering/products`, {
                headers: new HttpHeaders().set(
                    'Content-Type',
                    'application/json'
                ),
            })
            .pipe(
                catchError((error) => {
                    // Handle error by returning a new observable that throws the error
                    return throwError(() => error);
                }),
                tap((response: List) => {})
            );
    }

    // Method to create an order
    create(body: {
        cart: string;
        platform?: string;
        payment_method: string;
    }): Observable<ResponseOrder> {
        const { cart, platform = 'Web', payment_method } = body;
        const requestBody = {
            cart,
            platform,
            payment_method,
        };
        return this.httpClient.post<ResponseOrder>(
            `${env.API_BASE_URL}/cashier/ordering/order`,
            requestBody,
            {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json',
                }),
            }
        );
    }
}
