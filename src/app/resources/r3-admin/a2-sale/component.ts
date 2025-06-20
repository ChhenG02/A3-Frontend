// ================================================================================>> Core Library
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// ================================================================================>> Third Party Library
// ===>> Material
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

// ================================================================================>> Custom Library
// ===>> Env
import { env } from 'envs/env';

// ===>> Helper Library
import { helperAnimations } from 'helper/animations';
import { HelperConfirmationService } from 'helper/services/confirmation';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';

// ===>> Shared
import { DialogConfigService } from 'app/shared/dialog-config.service';
import { ErrorHandleService } from 'app/shared/error-handle.service';

// ===>> Local
import { Data } from './interface';
import { FilterDialogComponent } from './filter-dialog/component';
import { SaleService } from './service';
import FileSaver from 'file-saver';
import GlobalConstants from 'helper/shared/constants';
import { HttpErrorResponse } from '@angular/common/http';
import { ViewDialogComponent } from './view-dialog/component';

@Component({
    selector: 'student-listing',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    animations: helperAnimations,
    imports: [
        CommonModule,
        FormsModule,

        MatPaginatorModule,
        MatTableModule,
        MatProgressSpinnerModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatBadgeModule,
    ],
})
export class SaleComponent implements OnInit {
    // ===>> Data
    public data: Data[] = [];
    public setupData: any = {};
    public downloading: boolean = false;
    public isLoading: boolean = false;
    public dataSource: MatTableDataSource<Data> = new MatTableDataSource<Data>(
        []
    );
    public displayedColumns: string[] = [
        'no',
        'receipt',
        'price',
        'ordered_at',
        'ordered_at_time',
        'seller',
        'action',
    ];

    // ===>> Search, Sort & Filter
    public key: string = '';

    public cashier: number = 0;
    public platform: number = 0;
    public from: string = '';
    public to: string = '';
    public name: string = '';

    public badgeValue: any;
    // ===>> Report Type for Download
    public report_type: string = '';

    public shortedItems: any[] = [
        {
            value: 'total_price',
            name: 'តម្លៃលក់',
        },
        {
            value: 'ordered_at',
            name: 'Checkout',
        },
    ];

    viewDetail(element: Data): void {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.autoFocus = false;
        dialogConfig.position = { right: '0px' };
        dialogConfig.height = '100dvh';
        dialogConfig.width = '100dvw';
        dialogConfig.maxWidth = '750px';
        dialogConfig.panelClass = 'custom-mat-dialog-as-mat-drawer';
        dialogConfig.enterAnimationDuration = '0s';
        dialogConfig.data = element;

        this._matDialog.open(ViewDialogComponent, dialogConfig);
    }

    public selectedShortedItem: any = this.shortedItems[0];
    public shortedOrder: string = 'desc';

    // ===>> Download
    public isDownloadingReport: boolean = false;
    public isDownloadingCV: boolean = false;
    public selectedCVDownloadIndex: number = -1;

    // ===>> File Url
    public FILE_URL: string = env.FILE_BASE_URL;

    // ===>> Pagination
    public page: number = 1;
    public limit: number = 20;
    public total: number = 0;
    snackBarService: any;

    constructor(
        private _service: SaleService,
        private _snackbarService: SnackbarService,
        private _router: Router,
        private _matDialog: MatDialog,
        private _errorHandleService: ErrorHandleService,
        private _dialogConfigService: DialogConfigService,
        private _helpersConfirmationService: HelperConfirmationService
    ) {}

    ngOnInit(): void {
        this.getSetupData();
        this.getData();
    }

    // ====================================================================>> Get Setup Data for Filtering
    getSetupData(): void {
        // ===>> Call API
        this._service.getSetupData().subscribe({
            next: (res: any) => {
                this.setupData = res;
                this.shortedItems = res.shortItems;
                // this.platform = res.platform;
                //this.openFilterDialog();
            },
            error: (err) => {
                this._errorHandleService.handleHttpError(err);
            },
        });
    }

    // ====================================================================>> Get Data for Listing
    getData() {
        // ===>> Set Loading UI
        this.isLoading = true;

        // ===>> Get Filter
        const params = this.prepareSearchSortFilterParam();
        this._service.getData(params).subscribe({
            next: (res) => {
                // ===>> Maping data & DataSource
                this.data = res.data;
                this.dataSource.data = this.data;

                // ===>> Update Pagination Variable
                this.total = res.pagination.total;
                this.page = res.pagination.page;
                this.limit = res.pagination.limit;

                // ===>> Stop Loading UI
                this.isLoading = false;
            },
            error: (err) => {
                // ===>> Stop Loading UI
                this.isLoading = false;

                // ===>> Display Error
                this._errorHandleService.handleHttpError(err);
            },
        });
    }

    // ====================================================================>> Generate Search, Sort & Filter
    prepareSearchSortFilterParam() {
        // ===>> Prepare Query Parameter
        const params: any = {
            limit: this.limit,
            page: this.page > 0 ? this.page : 1, // Ensure page starts from 1
            sort: this.selectedShortedItem.value,
            order: this.shortedOrder,
        };

        // ===>> Search
        if (this.key != '') {
            params.key = this.key;
        }

        // ===>> Filter
        if (this.cashier != 0 && this.cashier != null) {
            params.cashier = this.cashier;
        }

        if (this.platform != 0 && this.platform != null) {
            params.platform = this.platform;
        }

        if (this.from != '') {
            params.from = this.from;
        }

        if (this.to != '') {
            params.to = this.to;
        }

        if (this.report_type != '') {
            params.report_type = this.report_type;
        }

        // console.log(params);

        return params;
    }

    // ====================================================================>> Pagination change for Next or Previous
    onPageChanged(event: PageEvent): void {
        this.limit = event.pageSize;
        this.page = event.pageIndex + 1;
        this.getData();
    }

    // ====================================================================>> Open Filter Dialog
    openFilterDialog(): void {
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            setup: this.setupData,
            filter: {
                cashier: this.cashier,
                from: this.from,
                to: this.to,
                platform: this.platform,
            },
        });

        const dialogRef = this._matDialog.open(
            FilterDialogComponent,
            dialogConfig
        );

        dialogRef.componentInstance.filterSubmitted.subscribe((res: any) => {
            // Count filter selected from the Filter Dialog
            const nullOrEmptyCount = Object.values(res).filter(
                (value) => value === null || value === 0 || value === ''
            ).length;
            this.badgeValue = Object.keys(res).length - nullOrEmptyCount;

            // Map Filter
            this.cashier = res.cashier;
            this.from = res.from;
            this.to = res.to;
            this.platform = res.platform;

            // ===>> Refresh Data
            this.getData();
        });
    }

    // ====================================================================>> Select Short Item
    selectShortedItem(item = {}) {
        this.selectedShortedItem = item;
        this.getData();
    }

    // ====================================================================>> Select Short Order
    selectShortOrder() {
        // Mapping the data
        this.shortedOrder = this.shortedOrder == 'desc' ? 'asc' : 'desc';

        // refresh data
        this.getData();
    }

    // ====================================================================>> Clear Short Filter
    clearFilter(): void {
        // Set all filters to 0
        // this.cashier      = 0;
        // this.fromDate     = '';
        // this.toDate       = '';
        this.platform = 0;
        this.badgeValue = 0;

        // Refresh Data
        this.getData();
    }

    // ====================================================================>> Get Data for Listing
    view(id: number): void {
        this._router.navigateByUrl(`/admin/student/view/${id}`);
    }

    // ====================================================================>> Delete
    delete(data: Data): void {
        // ===>> Open Confirmation Dialog
        //const dialogRef = this._helpersConfirmationService.open('delete');
        // dialogRef.afterClosed().subscribe((result: string | undefined) => {
        //     if (result === 'confirmed') {
        //         this.isLoading = true;
        //         this._service.delete('students', data.id).subscribe({
        //             next: (res) => {
        //                 this.getData();
        //                 this._snackbarService.openSnackBar(res.message, '');
        //                 this.isLoading = false;
        //             },
        //             error: (err) => {
        //                 this._errorHandleService.handleHttpError(err);
        //                 this.isLoading = false;
        //             },
        //         });
        //     }
        // });
    }

    // ====================================================================>> Upgrade to Member

    // ====================================================================>> Download CV
    downloadInvoice(element: Data): void {
    this.downloading = true;
    this._service.downloadInvoice(element.id).subscribe({
        next: (res) => {
            this.downloading = false;
            if (res.status === 'success' && res.data) {
                try {
                    const blob = this.b64toBlob(res.data, 'application/pdf');
                    FileSaver.saveAs(blob, `Invoice-${element.receipt_number}.pdf`);
                    this._snackbarService.openSnackBar('PDF downloaded successfully', GlobalConstants.success);
                } catch (e) {
                    console.error('Blob creation failed:', e);
                    this._snackbarService.openSnackBar('Failed to create PDF file', GlobalConstants.error);
                }
            } else {
                console.error('Unexpected response format:', res);
                this._snackbarService.openSnackBar('Failed to download PDF: invalid response', GlobalConstants.error);
            }
        },
        error: (err: HttpErrorResponse) => {
            this.downloading = false;
            console.error('Download error:', err);
            this._snackbarService.openSnackBar(
                err.error?.message || 'Failed to download invoice',
                GlobalConstants.error
            );
        },
    });
}


    // Convert base64 to blob
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
}
