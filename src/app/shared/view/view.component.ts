import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
    ChangeDetectorRef,
    Component,
    Inject,
    OnDestroy,
    OnInit,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
    MAT_DIALOG_DATA,
    MatDialog,
    MatDialogRef,
} from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { SaleService } from 'app/resources/r2-cashier/c2-sale/sale.service';
import { env } from 'envs/env';
import FileSaver from 'file-saver';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { Subject } from 'rxjs';
import { DetailsService } from '../dialog/service';

@Component({
    selector: 'dashboard-gm-fast-view-customer',
    templateUrl: './view.template.html',
    styleUrls: ['./style.scss'],
    standalone: true,
    imports: [
        CommonModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatDividerModule,
        MatTabsModule,
        MatMenuModule,
        MatCheckboxModule,
    ],
})
export class ViewDetailSaleComponent implements OnInit, OnDestroy {
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    displayedColumns: string[] = [
        'number',
        'name',
        'unit_price',
        'qty',
        'total',
    ];
    dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
    fileUrl = env.FILE_BASE_URL;
    public isLoading: boolean;

    constructor(
        @Inject(MAT_DIALOG_DATA) public row: any,
        private _dialogRef: MatDialogRef<ViewDetailSaleComponent>,
        private _matDialog: MatDialog,
        private cdr: ChangeDetectorRef,
        private _snackbar: SnackbarService,
        private saleService: SaleService,
        private detailsService: DetailsService
    ) {}

    ngOnInit(): void {
        if (this.row && this.row.details) {
            // Map data to ensure discount defaults to 0 if null
            this.dataSource.data = this.row.details.map((item) => ({
                ...item,
                product: {
                    ...item.product,
                    discount: item.product.discount || 0, // Default to 0 if null
                },
            }));
            this.isLoading = false;
            this.cdr.detectChanges();
        }
    }

    // Calculate discounted price for each product
    getDiscountedPrice(element: any): number {
        const discount = element.product.discount || 0;
        return element.unit_price * (1 - discount / 100);
    }

    // Calculate total for each product
    getTotalForProduct(element: any): number {
        return this.getDiscountedPrice(element) * element.qty;
    }

    // Calculate total discount for the order
    getOrderDiscount(): number {
        return (this.row?.sub_total_price || 0) - (this.row?.total_price || 0);
    }

    downloading: boolean = false;

    print(row: any) {
        this.downloading = true;
        this.saleService.downloadInvoice(row.id).subscribe({
            next: (res) => {
                this.downloading = false;
                if (res.status === 'success' && res.data) {
                    try {
                        const blob = this.b64toBlob(
                            res.data,
                            'application/pdf'
                        );
                        FileSaver.saveAs(
                            blob,
                            `Invoice-${row.receipt_number}.pdf`
                        );
                        this._snackbar.openSnackBar(
                            'PDF downloaded successfully',
                            'success'
                        );
                    } catch (e) {
                        console.error('Blob creation failed:', e);
                        this._snackbar.openSnackBar(
                            'Failed to create PDF file',
                            'error'
                        );
                    }
                } else {
                    console.error('Unexpected response format:', res);
                    this._snackbar.openSnackBar(
                        'Failed to download PDF: invalid response',
                        'error'
                    );
                }
            },
            error: (err: HttpErrorResponse) => {
                this.downloading = false;
                console.error('Download error:', err);
                this._snackbar.openSnackBar(
                    err.error?.message || 'Failed to download invoice',
                    GlobalConstants.error
                );
            },
        });
    }

    b64toBlob(b64Data: string, contentType: string, sliceSize?: number) {
        contentType = contentType || '';
        sliceSize = sliceSize || 512;
        var byteCharacters = atob(b64Data);
        var byteArrays = [];
        for (
            var offset = 0;
            offset < byteCharacters.length;
            offset += sliceSize
        ) {
            var slice = byteCharacters.slice(offset, offset + sliceSize);
            var byteNumbers = new Array(slice.length);
            for (var i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            var byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
        var blob = new Blob(byteArrays, { type: contentType });
        return blob;
    }

    closeDialog() {
        this._dialogRef.close();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
