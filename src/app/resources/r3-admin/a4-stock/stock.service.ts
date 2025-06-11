// ================================================================>> Core Library (Angular)
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

// ================================================================>> Custom Library (Application-specific)
import { env } from 'envs/env';
import { Data, List, SetupResponse } from './stock.interface';
import { DataSaleResponse } from '../a1-dashboard/interface';

@Injectable({
  providedIn: 'root',
})
export class StockService {
  private _httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      withCredentials: 'true',
    }),
  };

  constructor(private httpClient: HttpClient) {}

  // Fetch setup data (product types, users, stock statuses)
  getSetupData(): Observable<SetupResponse> {
    return this.httpClient.get<SetupResponse>(
      `${env.API_BASE_URL}/admin/stocks/setup-data`,
      this._httpOptions
    ).pipe(
      catchError((err: HttpErrorResponse) => {
        return throwError(() => err);
      })
    );
  }

  // Fetch all stocks
  getData(params: any = {}): Observable<List> {
    return this.httpClient.get<List>(`${env.API_BASE_URL}/admin/stocks`, {
      headers: this._httpOptions.headers,
      params: new HttpParams({ fromObject: params }),
    }).pipe(
      catchError((err: HttpErrorResponse) => {
        return throwError(() => err);
      })
    );
  }

  // Fetch a single stock by ID
  view(id: number): Observable<{ data: Data; message: string }> {
    return this.httpClient.get<{ data: Data; message: string }>(
      `${env.API_BASE_URL}/admin/stocks/${id}`,
      this._httpOptions
    ).pipe(
      catchError((err: HttpErrorResponse) => {
        return throwError(() => err);
      })
    );
  }

  // Create a new stock
  create(body: {
    code: string;
    name: string;
    type_id: number;
    qty: number;
    unit_price: number;
    purchase_price: number;
    image: string;
  }): Observable<{ data: Data; message: string }> {
    return this.httpClient.post<{ data: Data; message: string }>(
      `${env.API_BASE_URL}/admin/stocks`,
      body,
      this._httpOptions
    ).pipe(
      catchError((err: HttpErrorResponse) => {
        return throwError(() => err);
      })
    );
  }

  // Update stock info
  update(
    id: number,
    body: { code?: string; name?: string; type_id?: number; qty?: number; unit_price?: number; purchase_price?: number; image?: string }
  ): Observable<{ data: Data; message: string }> {
    return this.httpClient.put<{ data: Data; message: string }>(
      `${env.API_BASE_URL}/admin/stocks/${id}`,
      body,
      this._httpOptions
    ).pipe(
      catchError((err: HttpErrorResponse) => {
        return throwError(() => err);
      })
    );
  }

  // Update stock quantity
  updateQty(
    id: number,
    body: { qty: number; action: 'ADD' | 'DEDUCT' }
  ): Observable<{ data: Data; message: string }> {
    return this.httpClient.put<{ data: Data; message: string }>(
      `${env.API_BASE_URL}/admin/stocks/${id}/qty`,
      body,
      this._httpOptions
    ).pipe(
      catchError((err: HttpErrorResponse) => {
        return throwError(() => err);
      })
    );
  }

  // Delete a stock by ID
  delete(id: number): Observable<{ message: string }> {
    return this.httpClient.delete<{ message: string }>(
      `${env.API_BASE_URL}/admin/stocks/${id}`,
      this._httpOptions
    ).pipe(
      catchError((err: HttpErrorResponse) => {
        return throwError(() => err);
      })
    );
  }

  // Fetch product report
  getDataProductReport(params: any = {}): Observable<DataSaleResponse> {
    return this.httpClient.get<DataSaleResponse>(
      `${env.API_BASE_URL}/share/report/generate-product-report`,
      { params: new HttpParams({ fromObject: params }) }
    ).pipe(
      catchError((err: HttpErrorResponse) => {
        return throwError(() => err);
      })
    );
  }
}