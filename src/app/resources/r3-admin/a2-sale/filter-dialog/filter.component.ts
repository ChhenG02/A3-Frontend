// filter.component.ts
import { AsyncPipe, CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
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
import { PortraitComponent } from 'helper/components/portrait/component';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import { Subject, takeUntil } from 'rxjs';
import { Data, SetupResponse } from '../sale.interface';

@Component({
    selector: 'app-filter-sale-cashier',
    templateUrl: './filter.template.html',
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
        MatButtonToggleModule,
    ],
})
export class FilterSaleComponent implements OnInit, OnDestroy {
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    saving: boolean = false;
    public data: { filter: Data; setup: SetupResponse } | null = null;
    filterForm: FormGroup;
    public setup: SetupResponse = { cashiers: [] }; // Fallback to empty cashiers

    public dateType = [
        { id: 'today', name: 'Today' },
        { id: 'thisMonth', name: 'This Month' },
        { id: 'lastMonth', name: 'Last Month' },
        { id: '3MonthAgo', name: '3 Months ago' },
        { id: '6MonthAgo', name: '6 Months ago' },
        { id: 'startandend', name: 'Choose Duration' },
    ];

    constructor(
        @Inject(MAT_DIALOG_DATA) public injectedData: { filter: Data; setup: SetupResponse },
        private dialogRef: MatDialogRef<FilterSaleComponent>,
        private formBuilder: FormBuilder,
        private snackBarService: SnackbarService,
        private cdr: ChangeDetectorRef
    ) {
        this.data = injectedData;
        this.setup = injectedData.setup || { cashiers: [] };
    }

    ngOnInit(): void {
        this.buildForm();
        this.handleTimeTypeChanges();
        this.setDefaultToday();
    }

    buildForm(): void {
        this.filterForm = this.formBuilder.group({
            timeType: ['today', Validators.required],
            startDate: [{ value: null, disabled: true }],
            endDate: [{ value: null, disabled: true }],
            cashier: [this.data?.filter?.cashier?.id ?? ''], // Optional
        });
    }

    
    setDefaultToday(): void {
        const { startDate, endDate } = this.calculateDateRange('today');
        this.filterForm.patchValue({ startDate, endDate });
    }

    handleTimeTypeChanges(): void {
        this.filterForm
            .get('timeType')!
            .valueChanges.pipe(takeUntil(this._unsubscribeAll))
            .subscribe((value) => {
                if (value === 'startandend') {
                    this.filterForm.get('startDate')!.enable();
                    this.filterForm.get('endDate')!.enable();
                } else {
                    const { startDate, endDate } = this.calculateDateRange(value);
                    this.filterForm.patchValue({ startDate, endDate });
                    this.filterForm.get('startDate')!.disable();
                    this.filterForm.get('endDate')!.disable();
                }
                this.cdr.markForCheck();
            });
    }

    clearFilter(): void {

  if (this.filterForm) {
    this.filterForm.reset();
  }
  
}

    ngAfterViewInit(): void {
        this.setDefaultToday();
        this.cdr.detectChanges();
    }

    calculateDateRange(type: string): { startDate: Date; endDate: Date } {
        const now = new Date();
        let startDate = new Date();
        let endDate = new Date();
        switch (type) {
            case 'thisMonth':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'lastMonth':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case '3MonthAgo':
                startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                endDate = new Date(now.getFullYear(), now.getMonth() - 2, 0);
                break;
            case '6MonthAgo':
                startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
                endDate = new Date(now.getFullYear(), now.getMonth() - 5, 0);
                break;
            default:
                startDate = endDate = now;
        }
        return { startDate, endDate };
    }

    submit(): void {
        if (this.filterForm.valid) {
            const formValue = { ...this.filterForm.value };
            if (formValue.timeType !== 'startandend') {
                const { startDate, endDate } = this.calculateDateRange(formValue.timeType);
                formValue.startDate = this.formatDateToISOString(startDate);
                formValue.endDate = this.formatDateToISOString(endDate);
            } else {
                formValue.startDate = this.formatDateToISOString(formValue.startDate);
                formValue.endDate = this.formatDateToISOString(formValue.endDate);
            }
            const selectedCashier = this.setup.cashiers.find(c => c.id === formValue.cashier);
            formValue.cashier = selectedCashier ? { id: selectedCashier.id, name: selectedCashier.name } : null;
            this.dialogRef.close(formValue);
        } else {
            this.snackBarService.openSnackBar('Please fill all required fields', 'error');
        }
    }

    formatDateToISOString(date: Date | string): string {
        const d = new Date(date);
        const offset = 7 * 60 * 60 * 1000;
        const cambodiaTime = new Date(d.getTime() + offset);
        const year = cambodiaTime.getUTCFullYear();
        const month = String(cambodiaTime.getUTCMonth() + 1).padStart(2, '0');
        const day = String(cambodiaTime.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    closeDialog(): void {
        this.filterForm.reset();
        this.dialogRef.close();
    }
}