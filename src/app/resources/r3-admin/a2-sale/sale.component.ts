// sale.component.ts
import { DatePipe, DecimalPipe, NgClass, NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import FileSaver from 'file-saver';
import { SharedDetailsComponent } from 'app/shared/dialog/component';
import { DetailsService } from 'app/shared/dialog/service';
import { ViewDetailSaleComponent } from 'app/shared/view/view.component';
import { env } from 'envs/env';
import {
    HelperConfirmationConfig,
    HelperConfirmationService,
} from 'helper/services/confirmation';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';

import { SaleService } from './sale.service';
import { Data, List, SetupResponse } from './sale.interface'; // Import SetupResponse
import { FilterSaleComponent } from './filter-dialog/filter.component';

@Component({
    selector: 'app-sale',
    standalone: true,
    templateUrl: './sale.template.html',
    styleUrl: './style.scss',
    imports: [
        MatTableModule,
        NgClass,
        NgIf,
        DatePipe,
        DecimalPipe,
        FormsModule,
        MatFormFieldModule,
        MatDatepickerModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        MatPaginatorModule,
        MatMenuModule,
        RouterLink,
    ],
})
export class SaleComponent implements OnInit {
    constructor(
        private saleService: SaleService,
        private snackBarService: SnackbarService,
        private detailsService: DetailsService,
        private cdr: ChangeDetectorRef,
        private dialog: MatDialog
    ) {}

    displayedColumns: string[] = [
        'no',
        'receipt',
        'price',
        'ordered_at',
        'ordered_at_time',
        'seller',
        'action',
    ];
    dataSource: MatTableDataSource<Data> = new MatTableDataSource<Data>([]);
    fileUrl: string = env.FILE_BASE_URL;
    total: number = 10;
    limit: number = 10;
    page: number = 1;
    receipt_number: string = '';
    isLoading: boolean = false;
    key: string = '';
    setup: SetupResponse = { cashiers: [] }; // Type as SetupResponse

    ngOnInit(): void {
        this.getData(this.page, this.limit);
    }

    clearFilter(): void {
        this.filter_data = {};
        this.badgeValue = 0;
        this.getData();
    }

    getData(
    _page: number = 1,
    _page_size: number = 10,
    filter_data: any = {}
): void {
    const params: any = {
        page: _page,
        page_size: _page_size,
    };
    if (this.key) params.key = this.key;
    if (filter_data.cashier?.id) params.cashier = filter_data.cashier.id;
    if (filter_data.startDate) params.startDate = filter_data.startDate;
    if (filter_data.endDate) params.endDate = filter_data.endDate;
    this.isLoading = true;
    this.saleService.getData(params).subscribe({
        next: (res: List) => {
            this.dataSource.data = res.data ?? [];
            this.total = res.pagination.totalItems; // Map totalItems
            this.limit = res.pagination.perPage; // Map perPage
            this.page = res.pagination.currentPage; // Map currentPage
            this.isLoading = false;
            this.cdr.detectChanges();
        },
        error: (err) => {
            this.isLoading = false;
            this.snackBarService.openSnackBar(
                err.error?.message ?? GlobalConstants.genericError,
                GlobalConstants.error
            );
        },
    });
}

    onPageChanged(event: PageEvent): void {
        if (event && event.pageSize) {
            this.limit = event.pageSize;
            this.page = event.pageIndex + 1;
            this.getData(this.page, this.limit);
        }
    }

    private matDialog = inject(MatDialog);

    view(row: Data): void {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.data = row;
        dialogConfig.width = '650px';
        dialogConfig.minHeight = '200px';
        dialogConfig.autoFocus = false;
        this.matDialog.open(SharedDetailsComponent, dialogConfig);
    }

    viewDetail(row: Data): void {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.autoFocus = false;
        dialogConfig.position = { right: '0px' };
        dialogConfig.height = '100dvh';
        dialogConfig.width = '100dvw';
        dialogConfig.maxWidth = '550px';
        dialogConfig.panelClass = 'custom-mat-dialog-as-mat-drawer';
        dialogConfig.enterAnimationDuration = '0s';
        dialogConfig.data = row;
        this.matDialog.open(ViewDetailSaleComponent, dialogConfig);
    }

    public badgeValue: number = 0;
    public filter_data: {
        timeType?: string;
        cashier?: { id: number; name: string };
        startDate?: string;
        endDate?: string;
    } = {};

    openFilterDialog(): void {
        this.saleService.setup().subscribe({
            next: (response) => {
                this.setup = { cashiers: response.data };
                const dialogConfig = new MatDialogConfig();
                dialogConfig.autoFocus = false;
                dialogConfig.data = {
                    setup: this.setup,
                    filter: {
                        ...this.filter_data,
                        cashier: this.filter_data.cashier || null,
                    },
                };
                dialogConfig.restoreFocus = false;
                dialogConfig.position = { right: '0px' };
                dialogConfig.height = '100dvh';
                dialogConfig.width = '100dvw';
                dialogConfig.maxWidth = '550px';
                dialogConfig.panelClass = 'custom-mat-dialog-as-mat-drawer';
                dialogConfig.enterAnimationDuration = '0s';

                const dialogRef = this.dialog.open(
                    FilterSaleComponent,
                    dialogConfig
                );
                dialogRef.afterClosed().subscribe((result) => {
                    if (result) {
                        const activeFilters = Object.values(result).filter(
                            (value) =>
                                value !== null &&
                                value !== undefined &&
                                value !== ''
                        ).length;
                        this.badgeValue = activeFilters;
                        this.filter_data = result;
                        this.getData(1, 10, this.filter_data);
                    }
                });
            },
            error: (err) => {
                console.error('Error loading cashiers:', err);
                this.snackBarService.openSnackBar(
                    'Failed to load cashiers',
                    'error'
                );
            },
        });
    }

    private helpersConfirmationService = inject(HelperConfirmationService);
    onDelete(sale: Data): void {
        const configAction: HelperConfirmationConfig = {
            title: `Remove <strong> ${sale.receipt_number} </strong>`,
            message:
                'Are you sure you want to remove this receipt number permanently? <span class="font-medium">This action cannot be undone!</span>',
            icon: {
                show: true,
                name: 'heroicons_outline:exclamation-triangle',
                color: 'warn',
            },
            actions: {
                confirm: { show: true, label: 'Remove', color: 'warn' },
                cancel: { show: true, label: 'Cancel' },
            },
            dismissible: true,
        };

        const dialogRef = this.helpersConfirmationService.open(configAction);
        dialogRef.afterClosed().subscribe((result: string) => {
            if (result && result === 'confirmed') {
                this.saleService.delete(sale.id).subscribe({
                    next: (response) => {
                        this.dataSource.data = this.dataSource.data.filter(
                            (v: Data) => v.id != sale.id
                        );
                        this.snackBarService.openSnackBar(
                            response.message,
                            GlobalConstants.success
                        );
                        this.getData();
                    },
                    error: (err: HttpErrorResponse) => {
                        this.snackBarService.openSnackBar(
                            err?.error?.message || GlobalConstants.genericError,
                            GlobalConstants.error
                        );
                    },
                });
            }
        });
    }

    downloading: boolean = false;
    print(row: Data): void {
    this.downloading = true;
    this.saleService.downloadInvoice(row.id).subscribe({
        next: (res) => {
            this.downloading = false;
            if (res.status === 'success' && res.data) {
                try {
                    const blob = this.b64toBlob(res.data, 'application/pdf');
                    FileSaver.saveAs(blob, `Invoice-${row.receipt_number}.pdf`);
                    this.snackBarService.openSnackBar('PDF downloaded successfully', 'success');
                } catch (e) {
                    console.error('Blob creation failed:', e);
                    this.snackBarService.openSnackBar('Failed to create PDF file', 'error');
                }
            } else {
                console.error('Unexpected response format:', res);
                this.snackBarService.openSnackBar('Failed to download PDF: invalid response', 'error');
            }
        },
        error: (err: HttpErrorResponse) => {
            this.downloading = false;
            console.error('Download error:', err);
            this.snackBarService.openSnackBar(
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
}
