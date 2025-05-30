
// ================================================================================>> Core Library
import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, EventEmitter, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

// ================================================================================>> Thrid Party Library
// Material
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
import { ProductTypeService } from '../service';
import { Data } from '../interface';
@Component({
    selector: 'product-type',
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
        MatDatepickerModule,
        MatButtonModule,
        MatMenuModule,
        MatDividerModule,
        MatRadioModule,
        MatDialogModule,
        PortraitComponent
    ]
})
export class ProductTypeDialogComponent implements OnInit, OnDestroy {
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    // EventEmitter to emit response data after create or update operations
    ResponseData = new EventEmitter<Data>();

    // Form related properties
    typeForm: UntypedFormGroup;
    saving: boolean = false;
    src: string = 'icons/image.jpg';
    // Constructor with dependency injection
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { title: string, type: Data },

        private dialogRef: MatDialogRef<ProductTypeDialogComponent>,
        private formBuilder: UntypedFormBuilder,
        private snackBarService: SnackbarService,
        private _service: ProductTypeService,
    ) { }

    // Lifecycle hook: ngOnInit
    ngOnInit(): void {
        this.data.type != null ? this.src = `${env.FILE_BASE_URL}${this.data.type.image}` : '';
        // Initialize the form on component initialization
        this.ngBuilderForm();
    }

    // Method to build the form using the form builder
    ngBuilderForm(): void {

        // Create the form group with initial values
        this.typeForm = this.formBuilder.group({
            name: [this.data?.type?.name || null, [Validators.required]],
            image: [null, this.data?.type?.image == null ? Validators.required : []],
        });
    }

    // Method to handle form submission
    submit() {

        // Check whether to perform create or update based on data.type
        this.data.type == null ? this.create() : this.update();
    }

    // srcChange method
    srcChange(base64: string): void {
        // Set the 'image' form control value with the provided base64 image data
        this.typeForm.get('image').setValue(base64);
    }

    onFileChange(event: any): void {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.src = e.target.result; // Preview image
                this.typeForm.get('image')?.setValue(e.target.result);
            };
            reader.readAsDataURL(file);
        } else {
            this.snackBarService.openSnackBar('Please select an image file.', GlobalConstants.error);
        }
    }

    // Method to handle create operation
    create(): void {
        if (this.typeForm.valid && !this.saving) {

        }
        // Disable dialog close while the operation is in progress
        this.dialogRef.disableClose = true;

        // Set the saving flag to true to indicate that the operation is in progress
        this.saving = true;

        // Call the typeService to create a new type
        this._service.create(this.typeForm.value).subscribe({

            next: response => {

                // Update the number of products (assuming it's a property of the returned data)
                response.data.n_of_products = 0;

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

    // Method to handle update operation
    update(): void {

        // Disable dialog close while the operation is in progress
        this.dialogRef.disableClose = true;

        // Set the saving flag to true to indicate that the operation is in progress
        this.saving = true;

        // Call the typeService to update an existing type
        this._service.update(this.data.type.id, this.typeForm.value).subscribe({

            next: response => {
                // Emit the response data using the EventEmitter
                this.ResponseData.emit(response.data);

                // Close the dialog
                this.dialogRef.close();

                // Reset the saving flag
                this.saving = false;

                // Display a success snackbar
                this.snackBarService.openSnackBar('Product types have been updated', GlobalConstants.success);
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
