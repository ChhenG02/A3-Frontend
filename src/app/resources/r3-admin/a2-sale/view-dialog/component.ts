import { CommonModule, DatePipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Inject,
    OnDestroy,
    OnInit,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { env } from 'envs/env';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import { Subject } from 'rxjs';
import { Data } from './interface';
import { SaleService } from '../service';
import { HttpErrorResponse } from '@angular/common/http';
import FileSaver from 'file-saver';
import GlobalConstants from 'helper/shared/constants';

@Component({
    selector: 'sales',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatDividerModule,
        MatTabsModule,
        MatMenuModule,
        MatCheckboxModule,
        DatePipe,
    ],
})
export class ViewDialogComponent implements OnInit, OnDestroy {
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    displayedColumns: string[] = [
        'no',
        'receipt',
        'price',
        'ordered_at',
        'ordered_at_time',
        'seller',
    ];
    dataSource: MatTableDataSource<Data> = new MatTableDataSource<Data>([]);
    fileUrl = env.FILE_BASE_URL;
    public isLoading: boolean = false;
    public downloading: boolean = false;

    constructor(
        @Inject(MAT_DIALOG_DATA) public element: any,
        private _dialogRef: MatDialogRef<ViewDialogComponent>,
        private cdr: ChangeDetectorRef,
        private _snackbar: SnackbarService,
        private saleService: SaleService
    ) {}

    ngOnInit(): void {
        this.viewData();
    }

    viewData() {
        this.isLoading = true;
        this.saleService.view(this.element.id).subscribe(
            (res) => {
                setTimeout(() => {
                    this.dataSource.data = res.data;
                    this.isLoading = false;
                    this.cdr.detectChanges();
                });
            },
            (err) => {
                setTimeout(() => {
                    this.isLoading = false;
                    this.cdr.detectChanges();
                    this._snackbar.openSnackBar(err.error.message, 'Dismiss');
                });
            }
        );
    }

    downloadInvoice(): void {
        this.downloading = true;
        this.saleService.downloadInvoice(this.element.id).subscribe({
            next: (res) => {
                this.downloading = false;
                if (res.status === 'success' && res.data) {
                    try {
                        const blob = this.b64toBlob(res.data, 'application/pdf');
                        FileSaver.saveAs(blob, `Invoice-${this.element.receipt_number}.pdf`);
                        this._snackbar.openSnackBar('PDF downloaded successfully', GlobalConstants.success);
                    } catch (e) {
                        console.error('Blob creation failed:', e);
                        this._snackbar.openSnackBar('Failed to create PDF file', GlobalConstants.error);
                    }
                } else {
                    console.error('Unexpected response format:', res);
                    this._snackbar.openSnackBar('Failed to download PDF: invalid response', GlobalConstants.error);
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

    b64toBlob(b64Data: string, contentType: string, sliceSize: number = 512): Blob {
        const byteCharacters = atob(b64Data);
        const byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
        return new Blob(byteArrays, { type: contentType });
    }

    // ===>> File Url
    public FILE_URL: string = env.FILE_BASE_URL;

    closeDialog() {
        this._dialogRef.close();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}