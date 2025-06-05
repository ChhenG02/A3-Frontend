// ================================================================================>> Core Library
import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, EventEmitter, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

// ================================================================================>> Third Party Library
// Material
import { HttpErrorResponse } from '@angular/common/http';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
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
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { Subject } from 'rxjs';
import { StockStatusData } from '../interface';
import { StockStatusService } from '../service';

@Component({
    selector: 'stock-status-dialog',
    templateUrl: './template.html',
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
        MatButtonModule,
        MatMenuModule,
        MatDividerModule,
        MatRadioModule,
        MatDialogModule,
    ]
})
export class StockStatusDialogComponent implements OnInit, OnDestroy {
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    // EventEmitter to emit response data after create or update operations
    ResponseData = new EventEmitter<StockStatusData>();

    // Form related properties
    stockStatusForm: UntypedFormGroup;
    saving: boolean = false;

    // Color options for the status
    colorOptions = [
        { value: 'red', label: 'Red' },
        { value: 'green', label: 'Green' },
        { value: 'blue', label: 'Blue' },
        { value: 'yellow', label: 'Yellow' },
        { value: 'orange', label: 'Orange' },
        { value: 'purple', label: 'Purple' },
    ];

    // Range validator for min and max items
    private rangeValidator() {
        return (group: UntypedFormGroup): { [key: string]: any } | null => {
            const min = group.get('min_items')?.value;
            const max = group.get('max_items')?.value;

            if (min !== null && max !== null && min >= max) {
                return { rangeInvalid: true };
            }

            return null;
        };
    }

    // Constructor with dependency injection
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { title: string, stockStatus: StockStatusData },
        private dialogRef: MatDialogRef<StockStatusDialogComponent>,
        private formBuilder: UntypedFormBuilder,
        private snackBarService: SnackbarService,
        private _service: StockStatusService,
    ) { }

    // Lifecycle hook: ngOnInit
    ngOnInit(): void {
        // Initialize the form on component initialization
        this.ngBuilderForm();
    }

    // Method to build the form using the form builder
    ngBuilderForm(): void {
        this.stockStatusForm = this.formBuilder.group({
            name: [
                this.data?.stockStatus?.name || '',
                [Validators.required, Validators.maxLength(50)]
            ],
            color: [
                this.data?.stockStatus?.color || '',
                [Validators.required]
            ],
            min_items: [
                this.data?.stockStatus?.min_items || null,
                [
                    Validators.required,
                    Validators.min(0),
                    Validators.pattern(/^[0-9]*$/)
                ]
            ],
            max_items: [
                this.data?.stockStatus?.max_items || null,
                [
                    Validators.required,
                    Validators.min(0),
                    Validators.pattern(/^[0-9]*$/)
                ]
            ],
        }, {
            validators: this.rangeValidator()
        });
    }

    // Method to handle form submission
    submit() {
        // Check whether to perform create or update based on data.stockStatus
        this.data.stockStatus == null ? this.create() : this.update();
    }

    // Method to handle create operation
    create(): void {
        if (this.stockStatusForm.valid && !this.saving) {
            // Disable dialog close while the operation is in progress
            this.dialogRef.disableClose = true;

            // Set the saving flag to true to indicate that the operation is in progress
            this.saving = true;

            // Call the service to create a new stock status
            this._service.create(this.stockStatusForm.value).subscribe({
                next: response => {
                    // Emit the response data using the EventEmitter
                    this.ResponseData.emit(response.data);

                    // Close the dialog
                    this.dialogRef.close();

                    // Reset the saving flag
                    this.saving = false;

                    // Display a success snackbar
                    this.snackBarService.openSnackBar(response.message, GlobalConstants.success);
                },

                error: (err: HttpErrorResponse) => {
                    // Re-enable dialog close
                    this.dialogRef.disableClose = false;

                    // Reset the saving flag
                    this.saving = false;

                    // Handle and display errors
                    this.handleErrors(err);
                }
            });
        }
    }

    // Method to handle update operation
    update(): void {
        if (this.stockStatusForm.valid && !this.saving) {
            // Disable dialog close while the operation is in progress
            this.dialogRef.disableClose = true;

            // Set the saving flag to true to indicate that the operation is in progress
            this.saving = true;

            // Call the service to update an existing stock status
            this._service.update(this.data.stockStatus.id, this.stockStatusForm.value).subscribe({
                next: response => {
                    // Emit the response data using the EventEmitter
                    this.ResponseData.emit(response.data);

                    // Close the dialog
                    this.dialogRef.close();

                    // Reset the saving flag
                    this.saving = false;

                    // Display a success snackbar
                    this.snackBarService.openSnackBar(response.message, GlobalConstants.success);
                },

                error: (err: HttpErrorResponse) => {
                    // Re-enable dialog close
                    this.dialogRef.disableClose = false;

                    // Reset the saving flag
                    this.saving = false;

                    // Handle and display errors
                    this.handleErrors(err);
                }
            });
        }
    }

    // Helper method to handle and display errors
    private handleErrors(err: HttpErrorResponse): void {
        const errors: { type: string, message: string }[] | undefined = err.error?.errors;
        let message: string = err.error?.message ?? GlobalConstants.genericError;

        if (errors && errors.length > 0) {
            message = errors.map((obj) => obj.message).join(', ');
        }

        // Display error snackbar
        this.snackBarService.openSnackBar(message, GlobalConstants.error);
    }

    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    closeDialog() {
        this.dialogRef.close();
    }
}