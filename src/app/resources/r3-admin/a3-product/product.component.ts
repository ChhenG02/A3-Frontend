// ================================================================>> Core Library (Angular)
import {
    CommonModule,
    DatePipe,
    DecimalPipe,
    NgClass,
    NgIf,
} from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

// ================================================================>> Angular Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

// ================================================================>> Custom Library (Application-specific)
import { env } from 'envs/env';
import FileSaver from 'file-saver';
import {
    HelperConfirmationConfig,
    HelperConfirmationService,
} from 'helper/services/confirmation';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';

import { DialogConfigService } from 'app/shared/dialog-config.service';
import { ErrorHandleService } from 'app/shared/error-handle.service';
import { MatBadgeModule } from '@angular/material/badge';
import { ProductService } from './product.service';
import { Data, List } from './product.interface';
import { FilterDialogComponent } from './filter-dialog/component';
import { ViewDialogComponent } from './view-dialog/component';
import { ProductsDialogComponent } from './create-dialog/component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { PromotionService } from '../a6-setup/s2-promotion/service';
import { PromotionData } from '../a6-setup/s2-promotion/interface';

@Component({
    selector: 'app-product',
    standalone: true,
    templateUrl: './product.template.html',
    styleUrl: './style.scss',
    imports: [
        CommonModule,
        MatTableModule,
        NgClass,
        NgIf,
        DatePipe,
        DecimalPipe,
        FormsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatIconModule,
        MatButtonModule,
        MatPaginatorModule,
        MatMenuModule,
        MatBadgeModule,
        MatCheckboxModule,
    ],
})
export class ProductComponent implements OnInit {
    // Injecting necessary services
    private _service = inject(ProductService);

    private snackBarService = inject(SnackbarService);
    // Creating a product using a dialog
    private matDialog = inject(MatDialog);
    public data: Data[] = [];
    public setupData: any = {};

    public promotions: PromotionData[] = [];
    // Component properties
    getDisplayedColumns(): string[] {
        const columns = [
            'no',
            'product',
            'price',
            'total_sale',
            'total_sale_price',
            'created',
            'seller',
            'action',
        ];

        if (this.showCheckboxes) {
            columns.unshift('select');
        }

        return columns;
    }

    dataSource: MatTableDataSource<Data> = new MatTableDataSource<Data>([]);

    fileUrl: string = env.FILE_BASE_URL;

    public showCheckboxes: boolean = false;
    public total: number = 0;
    public limit: number = 20;
    public page: number = 1;
    public isLoading: boolean = false;
    public selectedPromotionId: number = 0;

    // Search,sort and filter
    public key: string = '';
    public type_id: number = 0;
    public name: string = '';
    public users: number = 0;
    public productTypes: number = 0;
    public creator: number = 0;

    // Selection related properties
    public selectedItems: Data[] = [];
    public isAllSelected: boolean = false;
    public showSelectionBar: boolean = false;

    public shortedItems: any[] = [
        { name: 'ឈ្មោះផលិតផល', value: 'name' },
        { name: 'តម្លៃ(រៀល)', value: 'unit_price' },
        { name: 'តម្លៃលក់(រៀល)', value: 'total_sale' },
    ];

    public selectedShortedItem: any = this.shortedItems[0];
    public shortedOrder: string = 'desc';

    badgeValue: any;
    // ===>> Download Report Type
    public report_type: string = '';

    // Constructor
    constructor(
        private cdr: ChangeDetectorRef,
        private _matDialog: MatDialog,
        private _errorHandleService: ErrorHandleService,
        private _dialogConfigService: DialogConfigService,
        private promotionService: PromotionService
    ) {}

    // Initialization logic

    ngOnInit(): void {
        this.getSetupData();
        this.getData();
        this.getPromotions();
    }

    onPromotionChange(value: number | null): void {
        console.log('Selected promotion ID:', value);
        this.selectedPromotionId = value;
    }

    getPromotionDiscount(promotionId: number): number {
        const promotion = this.promotions.find((p) => p.id === promotionId);
        return promotion ? promotion.discount_value : 0;
    }

    getPromotions(): void {
        this.promotionService.getData().subscribe({
            next: (res) => {
                console.log('Promotions data:', res);
                this.promotions = res.data.Promotion || [];
                // Set default promotion if available
                if (this.promotions.length > 0) {
                    this.selectedPromotionId = this.promotions[0].id;
                }
            },
            error: (err) => {
                console.error('Error fetching promotions:', err);
                this.promotions = [];
                this.snackBarService.openSnackBar(
                    'Failed to load promotions',
                    GlobalConstants.error
                );
            },
        });
    }

    

    // Toggle checkbox visibility and selection bar
    toggleCheckboxes(): void {
        this.showCheckboxes = !this.showCheckboxes;
        if (!this.showCheckboxes) {
            this.clearSelection();
        }
        // Force change detection to update the table columns
        this.cdr.detectChanges();
    }

    // Add this method to your ProductComponent class
    parseDiscount(discount: string | number | undefined): number {
        if (!discount) return 0;
        if (typeof discount === 'number') return discount;
        return parseFloat(discount);
    }

    calculateDiscountPrice(product: Data): number {
        const discount = this.parseDiscount(product.discount);
        if (discount <= 0) {
            return product.unit_price;
        }
        return product.unit_price * (1 - discount / 100);
    }

    // Toggle selection for individual item
    toggleSelection(item: Data): void {
        const index = this.selectedItems.findIndex(
            (selected) => selected.id === item.id
        );

        if (index > -1) {
            // Item is selected, remove it
            this.selectedItems.splice(index, 1);
        } else {
            // Item is not selected, add it
            this.selectedItems.push(item);
        }

        // Update selection state
        this.updateSelectionState();
    }

    // Check if item is selected
    isSelected(item: Data): boolean {
        return this.selectedItems.some((selected) => selected.id === item.id);
    }

    // Toggle select all
    toggleSelectAll(): void {
        if (this.isAllSelected) {
            // Deselect all
            this.selectedItems = [];
            this.isAllSelected = false;
        } else {
            // Select all current page items
            this.selectedItems = [...this.dataSource.data];
            this.isAllSelected = true;
        }

        this.updateSelectionState();
    }

    // Update selection state
    private updateSelectionState(): void {
        const currentPageItems = this.dataSource.data;
        const selectedFromCurrentPage = this.selectedItems.filter((selected) =>
            currentPageItems.some((item) => item.id === selected.id)
        );

        this.isAllSelected =
            currentPageItems.length > 0 &&
            selectedFromCurrentPage.length === currentPageItems.length;

        this.showSelectionBar = this.selectedItems.length > 0;
    }

    // Clear all selections
    clearSelection(): void {
        this.selectedItems = [];
        this.isAllSelected = false;
        this.showSelectionBar = false;
        this.selectedPromotionId =
            this.promotions.length > 0 ? this.promotions[0].id : 0;
    }

    isPromotionChanged(): boolean {
        if (this.selectedItems.length === 0) {
            return false;
        }

        // If selectedPromotionId is null, we're removing promotion
        if (this.selectedPromotionId === null) {
            return this.selectedItems.some(
                (item) => item.promotion_id !== null
            );
        }

        // Otherwise check if any selected item has a different promotion
        return this.selectedItems.some(
            (item) => item.promotion_id !== this.selectedPromotionId
        );
    }

    removePromotion(): void {
        if (this.selectedItems.length === 0) {
            this.snackBarService.openSnackBar(
                'No items selected',
                GlobalConstants.error
            );
            return;
        }

        const productIds = this.selectedItems.map((item) => item.id);

        this._service
            .applyPromotion({
                promotionId: null,
                productIds: productIds,
            })
            .subscribe({
                next: (response) => {
                    if (response.status === 'success') {
                        this.dataSource.data = this.dataSource.data.map(
                            (item) => {
                                if (productIds.includes(item.id)) {
                                    return {
                                        ...item,
                                        promotion_id: null,
                                        discount: 0,
                                    };
                                }
                                return item;
                            }
                        );

                        this.snackBarService.openSnackBar(
                            `Promotion removed from ${productIds.length} products`,
                            GlobalConstants.success
                        );
                        this.clearSelection();
                        this.cdr.detectChanges();
                        this.getData();
                    } else {
                        console.error('Unexpected response:', response);
                        this.snackBarService.openSnackBar(
                            response.message || 'Failed to remove promotion',
                            GlobalConstants.error
                        );
                    }
                },
                error: (err: HttpErrorResponse) => {
                    console.error('Remove promotion error:', err);
                    this.snackBarService.openSnackBar(
                        err.error?.message || 'Failed to remove promotion',
                        GlobalConstants.error
                    );
                },
            });
    }

    // Apply promotion to selected items
    applyPromotion(): void {
        if (this.selectedItems.length === 0) {
            this.snackBarService.openSnackBar(
                'No items selected',
                GlobalConstants.error
            );
            return;
        }

        const productIds = this.selectedItems.map((item) => item.id);

        this._service
            .applyPromotion({
                promotionId: this.selectedPromotionId,
                productIds: productIds,
            })
            .subscribe({
                next: (response) => {
                    if (response.status === 'success') {
                        this.dataSource.data = this.dataSource.data.map(
                            (item) => {
                                if (productIds.includes(item.id)) {
                                    return {
                                        ...item,
                                        promotion_id: this.selectedPromotionId,
                                        discount: this.selectedPromotionId
                                            ? this.getPromotionDiscount(
                                                  this.selectedPromotionId
                                              )
                                            : 0,
                                    };
                                }
                                return item;
                            }
                        );

                        const message = this.selectedPromotionId
                            ? `Promotion applied to ${productIds.length} products`
                            : `Promotion removed from ${productIds.length} products`;

                        this.snackBarService.openSnackBar(
                            message,
                            GlobalConstants.success
                        );
                        this.clearSelection();
                        this.cdr.detectChanges();
                        this.getData();
                    } else {
                        this.snackBarService.openSnackBar(
                            response.message,
                            GlobalConstants.error
                        );
                    }
                },
                error: (err) => {
                    console.error('Apply promotion error:', err);
                    this.snackBarService.openSnackBar(
                        err.error?.message || 'Failed to apply promotion',
                        GlobalConstants.error
                    );
                },
            });
    }

    // Remove selected items
    removeSelectedItems(): void {
        if (this.selectedItems.length === 0) {
            this.snackBarService.openSnackBar(
                'No items selected',
                GlobalConstants.error
            );
            return;
        }

        const configAction: HelperConfirmationConfig = {
            title: `Remove ${this.selectedItems.length} Selected Items`,
            message:
                'Are you sure you want to remove these items permanently? <span class="font-medium">This action cannot be undone!</span>',
            icon: {
                show: true,
                name: 'heroicons_outline:exclamation-triangle',
                color: 'warn',
            },
            actions: {
                confirm: {
                    show: true,
                    label: 'Remove',
                    color: 'warn',
                },
                cancel: {
                    show: true,
                    label: 'Cancel',
                },
            },
            dismissible: true,
        };

        const dialogRef = this.helpersConfirmationService.open(configAction);

        dialogRef.afterClosed().subscribe((result: string) => {
            if (result === 'confirmed') {
                // Create array of delete requests
                const deleteRequests = this.selectedItems.map((item) =>
                    this._service.delete(item.id)
                );

                // Execute all delete requests
                // Note: You might want to implement a batch delete API instead
                Promise.all(deleteRequests.map((req) => req.toPromise()))
                    .then(() => {
                        this.getData(); // Refresh data
                        this.snackBarService.openSnackBar(
                            `${this.selectedItems.length} items removed successfully`,
                            GlobalConstants.success
                        );
                        this.clearSelection();
                    })
                    .catch((err) => {
                        this.snackBarService.openSnackBar(
                            'Error removing some items',
                            GlobalConstants.error
                        );
                    });
            }
        });
    }

    // ===>> Get Setup Data for Filtering
    getSetupData(): void {
        // ===>> Call API
        this._service.getSetupData().subscribe({
            next: (res: any) => {
                this.setupData = res;
                console.log(this.setupData);
            },
            error: (err) => {
                this._errorHandleService.handleHttpError(err);
            },
        });
    }

    // ===>> Get Data for Listing
    getData() {
        // ===>> Set Loading UI
        this.isLoading = true;

        // ===>> Get Filter
        const params = this.prepareSearchSortFilterParam();

        this._service.getData(params).subscribe({
            next: (res: List) => {
                this.dataSource.data = res.data;
                this.total = res.pagination.total;
                this.limit = res.pagination.limit;
                this.page = res.pagination.totalPage;
                this.isLoading = false;

                // Update selection state after data refresh
                this.updateSelectionState();
            },
            error: (err: HttpErrorResponse) => {
                this.isLoading = false;
                this.snackBarService.openSnackBar(
                    err?.error?.message || GlobalConstants.genericError,
                    GlobalConstants.error
                );
            },
        });
    }

    prepareSearchSortFilterParam(): any {
        const params: any = {
            limit: this.limit,
            page: this.page > 0 ? this.page : 1, // Ensure page starts from 1
            sort_by: this.selectedShortedItem.value,
            order: this.shortedOrder,
        };

        if (this.key != '') {
            params.key = this.key; // Search keyword
        }

        if (this.productTypes) {
            params.type = this.productTypes; // Product type filter
        }

        if (this.users) {
            params.creator = this.users; // Use only creator
        }

        if (this.report_type != '') {
            params.report_type = this.report_type;
        }

        // Sort options
        params.sort_by = this.selectedShortedItem.value;
        params.order = this.shortedOrder;

        return params;
    }

    // ===>> Select Short Item
    selectShortedItem(item = {}) {
        this.selectedShortedItem = item;
        this.getData();
    }

    // ===>> Select Short Order
    selectShortOrder() {
        // Mapping the data
        this.shortedOrder = this.shortedOrder == 'desc' ? 'asc' : 'desc';

        // refresh data
        this.getData();
    }

    // ===>> Clear Short Filter
    clearFilter(): void {
        this.key = '';
        this.productTypes = 0;
        this.users = 0;
        this.badgeValue = 0;
        this.getData();
    }

    // ===>> Open Filter Dialog

    openFilterDialog(): void {
        const dialogConfig = this._dialogConfigService.getDialogConfig({
            setup: this.setupData,
            filter: {
                productTypes: this.productTypes,
                users: this.users,
            },
        });

        const dialogRef = this._matDialog.open(
            FilterDialogComponent,
            dialogConfig
        );

        dialogRef.componentInstance.filterSubmitted.subscribe((res: any) => {
            // Count filter selected from the Filter Dialog
            const nullOrEmptyCount = Object.values(res).filter(
                (value) => value === null || value === 0
            ).length;
            this.badgeValue = Object.keys(res).length - nullOrEmptyCount;

            // Map Filter
            this.productTypes = res.productTypes;
            this.users = res.users;

            // ===>> Refresh Data
            this.getData();
        });
    }

    // ===>> Pagination chagne for Next or Prevous
    onPageChanged(event: PageEvent): void {
        this.limit = event.pageSize;
        this.page = event.pageIndex + 1;

        this.getData();
    }

    // ===>> Method create new product
    create(): void {
        const dialogConfig = new MatDialogConfig();

        dialogConfig.data = {
            title: 'បង្កើតផលិតផល',
            product: null,
            setup: this.setupData.productTypes,
        };

        dialogConfig.autoFocus = false;
        dialogConfig.position = { right: '0px' };
        dialogConfig.height = '100dvh';
        dialogConfig.width = '100dvw';
        dialogConfig.maxWidth = '550px';
        dialogConfig.panelClass = 'custom-mat-dialog-as-mat-drawer';
        dialogConfig.enterAnimationDuration = '0s';

        const dialogRef = this.matDialog.open(
            ProductsDialogComponent,
            dialogConfig
        );
        dialogRef.componentInstance.ResponseData.subscribe((product: Data) => {
            const data = this.dataSource.data;
            data.unshift(product);
            this.getData();
            this.dataSource.data = data;
        });
    }

    // Viewing a product using a dialog
    view(element: Data) {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.autoFocus = false;
        dialogConfig.position = { right: '0px' };
        dialogConfig.height = '100dvh';
        dialogConfig.width = '100dvw';
        dialogConfig.maxWidth = '750px';
        dialogConfig.panelClass = 'custom-mat-dialog-as-mat-drawer';
        dialogConfig.enterAnimationDuration = '0s';
        dialogConfig.data = element;
        const dialogRef = this.matDialog.open(
            ViewDialogComponent,
            dialogConfig
        );
    }

    // Updating a product using a dialog
    update(row: Data): void {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.data = {
            title: 'Edit Product',
            product: row,
            setup: this.setupData.productTypes,
        };

        dialogConfig.autoFocus = false;
        dialogConfig.position = { right: '0px' };
        dialogConfig.height = '100dvh';
        dialogConfig.width = '100dvw';
        dialogConfig.maxWidth = '550px';
        dialogConfig.panelClass = 'custom-mat-dialog-as-mat-drawer';
        dialogConfig.enterAnimationDuration = '0s';
        const dialogRef = this.matDialog.open(
            ProductsDialogComponent,
            dialogConfig
        );

        dialogRef.componentInstance.ResponseData.subscribe((product: Data) => {
            const index = this.dataSource.data.indexOf(row);
            const data = this.dataSource.data;
            data[index] = product;
            this.getData();
            this.dataSource.data = data;
        });
    }

    // // Downloading a product report
    // isaving: boolean = false;
    // // Download product report
    // getReport(type: string = 'PDF') {
    //     this.report_type = type;

    //     const params = this.prepareSearchSortFilterParam();
    //     this.isaving = true;

    //     this._service.getDataProductReport(params).subscribe({
    //         next: (response) => {
    //             this.isaving = false;

    //             let fileName: string;
    //             let blob: Blob | null;

    //             if (type === 'PDF') {
    //                 blob = this.b64toBlob(response.data, 'application/pdf');
    //                 fileName = 'របាយការណ៍លក់តាមការផលិតផល.pdf';
    //             } else if (type === 'EXCEL') {
    //                 blob = this.b64toBlob(response.data, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    //                 fileName = 'របាយការណ៍លក់តាមផលិតផល.xlsx';
    //             } else {
    //                 console.error('Invalid report type:', type);
    //                 return;
    //             }

    //             if (blob) {
    //                 FileSaver.saveAs(blob, fileName);
    //                 this.snackBarService.openSnackBar('របាយការណ៍ទាញយកបានជោគជ័យ', GlobalConstants.success);
    //             } else {
    //                 this.snackBarService.openSnackBar('Failed to process the report file', GlobalConstants.error);
    //             }

    //             // Reset filter
    //             this.report_type = '';
    //         },
    //         error: (err: HttpErrorResponse) => {
    //             this.isaving = false;

    //             const errors: { type: string; message: string }[] | undefined = err.error?.errors;
    //             let message: string = err.error?.message ?? GlobalConstants.genericError;

    //             if (errors && errors.length > 0) {
    //                 message = errors.map((obj) => obj.message).join(', ');
    //             }

    //             this.snackBarService.openSnackBar(message, GlobalConstants.error);
    //         },
    //     });
    // }
    isaving: boolean = false;
    getReport(type: string = 'PDF') {
        this.isaving = true;
        this.report_type = type;
        console.log(this.report_type);
        const params = this.prepareSearchSortFilterParam();
        this._service.getDataProductReport(params).subscribe({
            next: (response) => {
                this.isaving = false;
                let blob;
                let fileName;
                const dateTime = new Date().toISOString().replace(/[:.]/g, '-');
                if (type === 'PDF') {
                    blob = this.b64toBlob(response.data, 'application/pdf');
                    fileName = `របាយការណ៍លក់តាមផលិតផល-${dateTime}.pdf`;
                } else if (type === 'EXCEL') {
                    blob = this.b64toBlob(
                        response.data,
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    );
                    fileName = `របាយការណ៍លក់តាមផលិតផល-${dateTime}.xlsx`;
                }
                FileSaver.saveAs(blob, fileName);
                // Show a success message using the snackBarService
                this.snackBarService.openSnackBar(
                    'របាយការណ៍ទាញយកបានជោគជ័យ',
                    GlobalConstants.success
                );
            },
            error: (err: HttpErrorResponse) => {
                // Set isaving to false to indicate the operation is completed (even if it failed)
                this.isaving = false;
                // Extract error information from the response
                const errors: { type: string; message: string }[] | undefined =
                    err.error?.errors;
                let message: string =
                    err.error?.message ?? GlobalConstants.genericError;

                // If there are field-specific errors, join them into a single message
                if (errors && errors.length > 0) {
                    message = errors.map((obj) => obj.message).join(', ');
                }
                // Show an error message using the snackBarService
                this.snackBarService.openSnackBar(
                    message,
                    GlobalConstants.error
                );
            },
        });
    }

    // // ====================================================================>> Download Report
    // downloadReport(type:string = 'PDF'): void {

    //     this.report_type = type;

    //     // ===>> Get Filter
    //     const params = this.prepareSearchSortFilterParam();

    //     // ===>> Set Loading
    //     this.isDownloadingReport = true;

    //     // ===>> Call API
    //     this._service.downloadReport(params).subscribe({
    //         next: (res:any) => {

    //             if(res.base64) {

    //                 // Save the file to local Machine
    //                 saveFile('student-report-', res.base64, type);

    //                 // Display Message
    //                 this._snackbarService.openSnackBar('របាយការណ័ត្រូវបានទាញយកដោយជោគជ័យ', '');
    //             } else {
    //                 this._snackbarService.openSnackBar(res.message, 'error');
    //             }

    //             // Stop the spinner
    //             this.isDownloadingReport =   false;

    //             // Reset Filter
    //             this.report_type = '';
    //         },
    //         error: (err) => {

    //             this.isDownloadingReport = false;
    //             this._errorHandleService.handleHttpError(err);
    //         },
    //     });
    // }

    // Convert base64 to blob
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

    // Deleting a product with confirmation
    private helpersConfirmationService = inject(HelperConfirmationService);

    onDelete(product: Data): void {
        // Build the config form
        const configAction: HelperConfirmationConfig = {
            title: `Remove <strong> ${product.name} </strong>`,
            message:
                'Are you sure you want to remove this receipt number permanently? <span class="font-medium">This action cannot be undone!</span>',
            icon: {
                show: true,
                name: 'heroicons_outline:exclamation-triangle',
                color: 'warn',
            },

            actions: {
                confirm: {
                    show: true,
                    label: 'Remove',
                    color: 'warn',
                },

                cancel: {
                    show: true,
                    label: 'Cancel',
                },
            },

            dismissible: true,
        };

        // Open the dialog and save the reference of it
        const dialogRef = this.helpersConfirmationService.open(configAction);

        // Subscribe to afterClosed from the dialog reference
        dialogRef.afterClosed().subscribe((result: string) => {
            if (
                result &&
                typeof result === 'string' &&
                result === 'confirmed'
            ) {
                // If the result is 'confirmed', proceed with the product deletion
                this._service.delete(product.id).subscribe({
                    // Handle the successful response from the delete operation
                    next: (response: {
                        status_code: number;
                        message: string;
                    }) => {
                        // Update the data source by filtering out the deleted product
                        this.dataSource.data = this.dataSource.data.filter(
                            (v: Data) => v.id != product.id
                        );
                        this.getData();
                        // Show a success message using the SnackbarService
                        this.snackBarService.openSnackBar(
                            response.message,
                            GlobalConstants.success
                        );
                    },

                    // Handle errors that occur during the delete operation
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
}
