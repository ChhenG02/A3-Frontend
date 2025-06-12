import { AsyncPipe, CommonModule, DatePipe } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Data } from '../stock.interface';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';
import { env } from 'envs/env';

@Component({
  selector: 'car-stock-adjust-dialog',
  templateUrl: './adjust.template.html',
  styleUrls: ['./style.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    FormsModule,
    RouterModule,
    AsyncPipe,
    DatePipe,
  ],
})
export class StockAdjustDialogComponent implements OnInit, OnDestroy {
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  adjustForm: UntypedFormGroup;
  saving: boolean = false;
  fileUrl = env.FILE_BASE_URL;
  afterQty: number;
  deductionError: string | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { title: string; product: Data },
    private dialogRef: MatDialogRef<StockAdjustDialogComponent>,
    private fb: UntypedFormBuilder
  ) {}

  ngOnInit(): void {
    // Initialize the adjustment form
    this.adjustForm = this.fb.group({
      action: ['ADD', Validators.required],
      qty: [0, [
        Validators.required,
        Validators.min(1),
        this.deductionValidator.bind(this), // Custom validator for deduction action
      ]],
    });
    this.afterQty = this.data.product.qty;

    // Subscribe to form value changes to update afterQty and error messages
    this.adjustForm.valueChanges.subscribe(val => {
      this.afterQty = val.action === 'ADD'
        ? this.data.product.qty + (Number(val.qty) || 0)
        : this.data.product.qty - (Number(val.qty) || 0);

      // Set error message if deduction is invalid
      if (val.action === 'DEDUCT' && (Number(val.qty) || 0) > this.data.product.qty) {
        this.deductionError = `Cannot deduct ${val.qty} units. Only ${this.data.product.qty} units available.`;
      } else {
        this.deductionError = null;
      }

      // Update qty field validity without emitting another event
      this.adjustForm.get('qty')?.updateValueAndValidity({ emitEvent: false });
    });
  }

  // Validator to ensure deduction does not exceed available stock
  deductionValidator(control: any): { [key: string]: any } | null {
    const action = this.adjustForm?.get('action')?.value;
    const currentQty = this.data?.product?.qty || 0;
    const qty = Number(control.value) || 0;

    if (action === 'DEDUCT' && qty > currentQty) {
      return { invalidDeduction: true };
    }
    return null;
  }

  // Handle form submission
  submit(): void {
    if (this.adjustForm.valid) {
      this.saving = true;
      this.dialogRef.disableClose = true;
      console.log('Submitting adjust form:', this.adjustForm.value); 
      setTimeout(() => {
        try {
          this.dialogRef.close(this.adjustForm.value);
          this.saving = false;
        } catch (error) {
          console.error('Error closing dialog:', error);
          this.saving = false;
        }
      }, 500);
    } else {
      console.warn('Form is invalid:', this.adjustForm.errors); 
    }
  }

  // Close the dialog
  closeDialog(): void {
    console.log('Close dialog triggered'); 
    try {
      this.dialogRef.close();
    } catch (error) {
      console.error('Error closing dialog:', error);
    }
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }
}