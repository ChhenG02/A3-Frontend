import { CommonModule, DatePipe, DecimalPipe, NgClass, NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatBadgeModule } from '@angular/material/badge';
import { env } from 'envs/env';
import FileSaver from 'file-saver';
import { HelperConfirmationConfig, HelperConfirmationService } from 'helper/services/confirmation';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { DialogConfigService } from 'app/shared/dialog-config.service';
import { ErrorHandleService } from 'app/shared/error-handle.service';
import { StockService } from './stock.service';
import { Data, List } from './stock.interface';
import { FilterDialogComponent } from './filter-dialog/component';

import { StockDialogComponent } from './create-dialog/create.component';
import { ViewDialogComponent } from './view-dialog/view.component';
import { StockAdjustDialogComponent } from './ajust-dialog/adjust.component';

@Component({
  selector: 'app-stock',
  standalone: true,
  templateUrl: './stock.template.html',
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
    ViewDialogComponent,
    StockAdjustDialogComponent
  ],
})
export class StockComponent implements OnInit {
  // ========== Service Injections ==========
  private _service = inject(StockService);
  private snackBarService = inject(SnackbarService);
  private matDialog = inject(MatDialog);
  private helpersConfirmationService = inject(HelperConfirmationService);
  public selectedSortOrder: 'asc' | 'desc' = 'asc';

  // ========== Data Properties ==========
  data: Data[] = [];
  setupData: any = null; // Setup data for dropdowns and filters
  displayedColumns: string[] = [
    'no',
    'product',
    'unit_price',
    'purchase_price',
    'qty',
    'stock_status',
    'created',
    'creator',
    'action',
  ];
  dataSource: MatTableDataSource<Data> = new MatTableDataSource<Data>([]);
  fileUrl: string = env.FILE_BASE_URL;
  total: number = 0;
  limit: number = 20;
  page: number = 1;
  isLoading: boolean = false;

  // ========== Filter & Sort Properties ==========
  key: string = '';
  type_id: number = 0;
  creator: number = 0;
  stock_status_id: number = 0;
  shortedItems: any[] = [
    { name: 'ឈ្មោះផលិតផល', value: 'name' },
    { name: 'ចំនួន', value: 'qty' },
    { name: 'តម្លៃទិញ (រៀល)', value: 'purchase_price' },
    { name: 'តម្លៃលក់ (រៀល)', value: 'unit_price' },
  ];
  selectedShortedItem: any = this.shortedItems[0];
  shortedOrder: string = 'desc';
  badgeValue: number = 0;
  report_type: string = '';

  // ========== Constructor ==========
  constructor(
    private cdr: ChangeDetectorRef,
    private _dialogConfigService: DialogConfigService,
    private _errorHandleService: ErrorHandleService
  ) {}

  // ========== Lifecycle ==========
  ngOnInit(): void {
    this.getSetupData();
    this.getData();
  }


  selectSortOrder(): void {
    this.selectedSortOrder = this.selectedSortOrder === 'asc' ? 'desc' : 'asc';
    this.getData(); // or whatever method reloads your data
}
  // ========== Dialogs Section ==========

  /**
   * Open dialog to adjust stock quantity
   */
  openAdjustDialog(row: Data): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.data = {
      title: 'Adjust Stock',
      product: row // Pass the row object
    };
    dialogConfig.autoFocus = false;
    dialogConfig.position = { right: '0px' };
    dialogConfig.height = '100dvh';
    dialogConfig.width = '100dvw';
    dialogConfig.maxWidth = '550px';
    dialogConfig.panelClass = 'custom-mat-dialog-as-mat-drawer';
    dialogConfig.enterAnimationDuration = '0s';

    const dialogRef = this.matDialog.open(StockAdjustDialogComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this._service.updateQty(row.id, result).subscribe({
          next: (res: { data: Data; message: string }) => {
            this.getData();
            this.snackBarService.openSnackBar(res.message, GlobalConstants.success);
          },
          error: (err: HttpErrorResponse) => {
            this.snackBarService.openSnackBar(
              err?.error?.message || GlobalConstants.genericError,
              GlobalConstants.error
            );
          }
        });
      }
    });
  }

  /**
   * Open filter dialog for advanced filtering
   */
  openFilterDialog(): void {
    if (!this.setupData) {
      this.snackBarService.openSnackBar('Setup data is not loaded yet. Please try again.', GlobalConstants.error);
      return;
    }
    const dialogConfig = this._dialogConfigService.getDialogConfig({
      setup: this.setupData,
      filter: {
        productTypes: this.type_id,
        users: this.creator,
        stockStatuses: this.stock_status_id,
      },
    });

    const dialogRef = this.matDialog.open(FilterDialogComponent, dialogConfig);
    dialogRef.componentInstance.filterSubmitted.subscribe((res: any) => {
      this.type_id = res.productTypes;
      this.creator = res.users;
      this.stock_status_id = res.stockStatuses;
      this.badgeValue = [this.type_id, this.creator].filter(v => v !== 0).length;
      this.getData();
    });
  }

  /**
   * Open dialog to create a new product
   */
  create(): void {
    if (!this.setupData) {
      this.snackBarService.openSnackBar('Setup data is not loaded yet. Please try again.', GlobalConstants.error);
      return;
    }
    const dialogConfig = new MatDialogConfig();
    dialogConfig.data = {
      title: 'Create product',
      product: null,
      setup: this.setupData,
    };
    dialogConfig.autoFocus = false;
    dialogConfig.position = { right: '0px' };
    dialogConfig.height = '100dvh';
    dialogConfig.width = '100dvw';
    dialogConfig.maxWidth = '550px';
    dialogConfig.panelClass = 'custom-mat-dialog-as-mat-drawer';
    dialogConfig.enterAnimationDuration = '0s';

    const dialogRef = this.matDialog.open(StockDialogComponent, dialogConfig);
    dialogRef.componentInstance.ResponseData.subscribe((product: Data) => {
      this.dataSource.data.unshift(product);
      this.getData();
      this.cdr.detectChanges();
    });
  }

  /**
   * Open dialog to view product details
   */
  view(element: Data): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = false;
    dialogConfig.position = { right: '0px' };
    dialogConfig.height = '100dvh';
    dialogConfig.width = '100dvw';
    dialogConfig.maxWidth = '750px';
    dialogConfig.panelClass = 'custom-mat-dialog-as-mat-drawer';
    dialogConfig.enterAnimationDuration = '0s';
    dialogConfig.data = element;
    const dialogRef = this.matDialog.open(ViewDialogComponent, dialogConfig);

    dialogRef.componentInstance.edit.subscribe((stock: Data) => {
      dialogRef.close();
      this.update(stock);
    });
  }

  /**
   * Open dialog to update product info
   */
  update(row: Data): void {
    if (!this.setupData) {
      this.snackBarService.openSnackBar('Setup data is not loaded yet. Please try again.', GlobalConstants.error);
      return;
    }
    const dialogConfig = new MatDialogConfig();
    dialogConfig.data = {
      title: 'Edit Info',
      product: row,
      setup: this.setupData,
    };
    dialogConfig.autoFocus = false;
    dialogConfig.position = { right: '0px' };
    dialogConfig.height = '100dvh';
    dialogConfig.width = '100dvw';
    dialogConfig.maxWidth = '550px';
    dialogConfig.panelClass = 'custom-mat-dialog-as-mat-drawer';
    dialogConfig.enterAnimationDuration = '0s';
    const dialogRef = this.matDialog.open(StockDialogComponent, dialogConfig);
    dialogRef.componentInstance.ResponseData.subscribe((product: Data) => {
      const index = this.dataSource.data.findIndex((v) => v.id === row.id);
      this.dataSource.data[index] = product;
      this.getData();
      this.cdr.detectChanges();
    });
  }

  // ========== Data Fetching Section ==========

  /**
   * Fetch setup data for dropdowns and filters
   */
  getSetupData(): void {
    this.isLoading = true;
    this._service.getSetupData().subscribe({
      next: (res: any) => {
        this.setupData = res || { productTypes: [], users: [], stockStatuses: [] }; // fallback to empty arrays
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.setupData = { productTypes: [], users: [], stockStatuses: [] }; // fallback on error
        this.snackBarService.openSnackBar(
          err?.error?.message || GlobalConstants.genericError,
          GlobalConstants.error
        );
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Fetch main stock data with current filters and sorting
   */
  getData(): void {
    this.isLoading = true;
    const params = this.prepareSearchSortFilterParam();
    this._service.getData(params).subscribe({
      next: (res: List) => {
        this.dataSource.data = res.data;
        this.total = res.pagination.total;
        this.limit = res.pagination.limit;
        this.page = res.pagination.page;
        this.isLoading = false;
        this.cdr.detectChanges();
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

  // ========== Utility & Helper Methods ==========

  /**
   * Prepare parameters for search, sort, and filter
   */
  prepareSearchSortFilterParam(): any {
    const params: any = {
      limit: this.limit,
      page: this.page > 0 ? this.page : 1,
      sort_by: this.selectedShortedItem.value,
      order: this.shortedOrder,
    };

    if (this.key) params.key = this.key;
    if (this.type_id) params.type = this.type_id;
    if (this.creator) params.creator = this.creator;
    if (this.stock_status_id) params.stock_status = this.stock_status_id;
    if (this.report_type) params.report_type = this.report_type;

    return params;
  }

  /**
   * Select sorting item
   */
 selectSortOption(option: any): void {
  this.selectedSortOption = option;
  this.selectedShortedItem = { value: option.value }; // Keep for backward compatibility
  this.shortedOrder = option.order;
  this.getData();
}

  /**
   * Toggle sorting order
   */
  selectShortOrder(): void {
    this.shortedOrder = this.shortedOrder === 'desc' ? 'asc' : 'desc';
    this.getData();
  }

  // sort option
  sortOptions: any[] = [
  { name: 'Qty: High to Low', value: 'qty', order: 'desc' },
  { name: 'Qty: Low to High', value: 'qty', order: 'asc' },
  { name: 'Stock Status', value: 'stock_status_id', order: 'asc' }
];
selectedSortOption: any = this.sortOptions[0];

  /**
   * Clear all filters
   */
  clearFilter(): void {
    this.key = '';
    this.type_id = 0;
    this.creator = 0;
    this.badgeValue = 0;
    this.getData();
  }

  /**
   * Get background color for stock status
   */
  getBackgroundColor(color: string | undefined): string {
    if (!color) return '#0000004D'; // fallback

    const rgbaMap: { [key: string]: string } = {
      red: 'rgba(255, 0, 0, 0.3)',
      green: 'rgba(76, 175, 80, 0.3)',
      blue: 'rgba(33, 150, 243, 0.3)',
      yellow: 'rgba(255, 235, 59, 0.3)',
      orange: 'rgba(255, 152, 0, 0.3)',
      purple: 'rgba(156, 39, 176, 0.3)'
    };

    return rgbaMap[color.toLowerCase()] || '#0000004D';
  }

  /**
   * Update stock quantity directly
   */
  updateQty(row: Data, qty: number, action: 'ADD' | 'DEDUCT'): void {
    this._service.updateQty(row.id, { qty, action }).subscribe({
      next: (res: { data: Data; message: string }) => {
        const index = this.dataSource.data.findIndex((v) => v.id === row.id);
        this.dataSource.data[index] = res.data;
        this.getData();
        this.snackBarService.openSnackBar(res.message, GlobalConstants.success);
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.snackBarService.openSnackBar(
          err?.error?.message || GlobalConstants.genericError,
          GlobalConstants.error
        );
      },
    });
  }

  /**
   * Delete a product from stock
   */
  onDelete(product: Data): void {
    const configAction: HelperConfirmationConfig = {
      title: `Remove <strong>${product.name}</strong>`,
      message: 'Are you sure you want to remove this stock permanently? <span class="font-medium">This action cannot be undone!</span>',
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
        this._service.delete(product.id).subscribe({
          next: (response: { message: string }) => {
            this.dataSource.data = this.dataSource.data.filter((v: Data) => v.id !== product.id);
            this.getData();
            this.snackBarService.openSnackBar(response.message, GlobalConstants.success);
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
}