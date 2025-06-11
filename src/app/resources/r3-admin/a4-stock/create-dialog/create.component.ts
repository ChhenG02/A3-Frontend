import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, EventEmitter, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { env } from 'envs/env';
import { PortraitComponent } from 'helper/components/portrait/component';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { Subject } from 'rxjs';
import { Data, SetupResponse } from '../stock.interface';
import { StockService } from '../stock.service';

@Component({
  selector: 'car-stock-dialog-create-and-update',
  templateUrl: './create.template.html',
  styleUrls: ['./style.scss'],
  standalone: true,
  imports: [
    RouterModule,
    FormsModule,
    MatIconModule,
    CommonModule,
    MatTooltipModule,
    AsyncPipe,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    MatRadioModule,
    MatDialogModule,
    PortraitComponent,
  ],
})
export class StockDialogComponent implements OnInit, OnDestroy {
  // Subject to handle unsubscription for observables
  private _unsubscribeAll: Subject<any> = new Subject<any>();

  // Emits response data after create/update
  ResponseData = new EventEmitter<Data>();

  // Main form for stock data
  stockForm: UntypedFormGroup;

  // Form for updating quantity
  qtyForm: UntypedFormGroup;

  // Indicates if saving is in progress
  saving: boolean = false;

  // Image source for preview
  src: string = 'icons/image.jpg';

  // Flag to check if it's update mode
  isUpdate: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { title: string; product: Data | null; setup: SetupResponse },
    private dialogRef: MatDialogRef<StockDialogComponent>,
    private formBuilder: UntypedFormBuilder,
    private snackBarService: SnackbarService,
    private stockService: StockService
  ) {}

  // -------------------- Lifecycle Hooks --------------------

  ngOnInit(): void {
    this.isUpdate = this.data.product != null;
    // Set type_id if not present
    if (this.data.product && !('type_id' in this.data.product)) {
      this.data.product.type_id = this.data.product.product_type?.id ?? null;
    }
    // Set image source if updating
    if (this.isUpdate) {
      this.src = `${env.FILE_BASE_URL}${this.data.product?.image}`;
    }
    this.ngBuilderForm();
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  // -------------------- Form Builder Section --------------------

  ngBuilderForm(): void {
    this.stockForm = this.formBuilder.group({
      code: [this.data?.product?.code || null, [Validators.required]],
      name: [this.data?.product?.name || null, [Validators.required]],
      type_id: [
        this.data?.product?.type_id !== undefined && this.data?.product?.type_id !== null
          ? +this.data.product.type_id
          : null,
        [Validators.required],
      ],
      image: [null, this.data.product == null ? [Validators.required] : []],
      qty: [this.data?.product?.qty || 0, [Validators.required, Validators.min(0)]],
      unit_price: [this.data?.product?.unit_price || null, [Validators.required, Validators.min(0)]],
      purchase_price: [this.data?.product?.purchase_price || null, [Validators.required, Validators.min(0)]],
    });

    this.qtyForm = this.formBuilder.group({
      action: ['ADD', [Validators.required]],
      qty: [0, [Validators.required, Validators.min(1)]],
    });
  }

  // -------------------- Image Handling Section --------------------

  // Handle image source change from base64
  srcChange(base64: string): void {
    this.stockForm.get('image')?.setValue(base64);
  }

  // Handle file input change for image upload
  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.src = e.target.result;
        this.stockForm.get('image')?.setValue(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      this.snackBarService.openSnackBar('Please select an image file.', GlobalConstants.error);
    }
  }

  // -------------------- Submit Section --------------------

  // Handle form submission for create/update/qty
  submit(): void {
    if (this.isUpdate && this.qtyForm.valid && this.qtyForm.dirty) {
      this.updateQty();
    } else if (this.stockForm.valid) {
      this.data.product == null ? this.create() : this.update();
    }
  }

  // -------------------- CRUD Section --------------------

  // Create new stock item
  create(): void {
    this.dialogRef.disableClose = true;
    this.saving = true;
    this.stockService.create(this.stockForm.value).subscribe({
      next: (response) => {
        const product: Data = this.transformResponse(response.data);
        this.ResponseData.emit(product);
        this.dialogRef.close();
        this.saving = false;
        this.snackBarService.openSnackBar(response.message, GlobalConstants.success);
      },
      error: (err: HttpErrorResponse) => {
        this.handleError(err);
      },
    });
  }

  // Update existing stock item
  update(): void {
    console.log('Form Initial Value', this.stockForm.value);
    this.dialogRef.disableClose = true;
    this.saving = true;
    this.stockService.update(this.data.product!.id, this.stockForm.value).subscribe({
      next: (response) => {
        const product: Data = this.transformResponse(response.data);
        this.ResponseData.emit(product);
        this.dialogRef.close();
        this.saving = false;
        this.snackBarService.openSnackBar(response.message, GlobalConstants.success);
      },
      error: (err: HttpErrorResponse) => {
        this.handleError(err);
      },
    });
  }

  // Update quantity for stock item
  updateQty(): void {
    this.dialogRef.disableClose = true;
    this.saving = true;
    const { action, qty } = this.qtyForm.value;
    this.stockService.updateQty(this.data.product!.id, { action, qty }).subscribe({
      next: (response) => {
        const product: Data = this.transformResponse(response.data);
        this.ResponseData.emit(product);
        this.dialogRef.close();
        this.saving = false;
        this.snackBarService.openSnackBar(response.message, GlobalConstants.success);
      },
      error: (err: HttpErrorResponse) => {
        this.handleError(err);
      },
    });
  }

  // -------------------- Utility Section --------------------

  // Transform API response to Data interface
  private transformResponse(data: any): Data {
    return {
      id: data.id,
      code: data.code,
      name: data.name,
      image: data.image,
      qty: data.qty,
      unit_price: data.unit_price,
      purchase_price: data.purchase_price,
      total_sale: data.total_sale,
      created_at: data.created_at,
      type_id: data.type_id,
      type: {
        id: data.type_id,
        name: this.data.setup.productTypes.find((v) => v.id === data.type_id)?.name || '',
      },
      product_type: {
        id: data.type_id,
        name: this.data.setup.productTypes.find((v) => v.id === data.type_id)?.name || '',
      },
      creator: {
        id: data.creator.id,
        name: data.creator.name,
        avatar: data.creator.avatar || '',
      },
      stock_status: {
        id: data.stock_status?.id || 0,
        name: data.stock_status?.name || '',
        color: data.stock_status?.color || '',
        avatar: data.stock_status?.avatar || '',
        min_items: data.stock_status?.min_items || 0,
        max_items: data.stock_status?.max_items || 0,
      },
    };
  }

  // Handle HTTP errors and show messages
  private handleError(err: HttpErrorResponse): void {
    this.dialogRef.disableClose = false;
    this.saving = false;
    const errors: { type: string; message: string }[] | undefined = err.error?.errors;
    let message: string = err.error?.message ?? GlobalConstants.genericError;
    if (errors && errors.length > 0) {
      message = errors.map((obj) => obj.message).join(', ');
    }
    this.snackBarService.openSnackBar(message, GlobalConstants.error);
  }

  // -------------------- Dialog Section --------------------

  // Close the dialog
  closeDialog(): void {
    this.dialogRef.close();
  }
}