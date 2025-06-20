import { AsyncPipe, CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Material
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
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
import { PortraitComponent } from 'helper/components/portrait/component';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import { Subject } from 'rxjs';

@Component({
    selector: 'app-filter-user',
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
        PortraitComponent,
        MatButtonToggleModule
    ]
})
export class FilterUserComponent implements OnInit, OnDestroy {
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    saving: boolean = false;
    filterForm: FormGroup;

     public roles = [
        { id: 1, name: 'Admin' },
        { id: 2, name: 'Cashier' }
     ];

    constructor(
        @Inject(MAT_DIALOG_DATA) public setup: any,
        private dialogRef: MatDialogRef<FilterUserComponent>,
        private formBuilder: FormBuilder,
        private snackBarService: SnackbarService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.buildForm();
    }

   buildForm(): void {
    this.filterForm = this.formBuilder.group({
        role_id: [null] // This will store the role ID (1 for admin, 2 for cashier)
    });
   }


    submit(): void {
        if (this.filterForm.valid) {
        this.saving = true;
        const filterValue = {
            role_id: this.filterForm.value.role_id
        };
        this.dialogRef.close(filterValue);
        } else {
        this.snackBarService.openSnackBar('Please select a role to filter', 'error');
        }
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    closeDialog(): void {
        this.dialogRef.close();
    }
}