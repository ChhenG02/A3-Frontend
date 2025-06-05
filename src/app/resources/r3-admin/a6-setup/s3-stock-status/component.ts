import {
    CommonModule,
    DatePipe,
    DecimalPipe,
    NgClass,
    NgIf,
} from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { StockStatusDialogComponent } from './view-dialog/component';
import {
    HelperConfirmationConfig,
    HelperConfirmationService,
} from 'helper/services/confirmation';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';

import { StockStatusService } from './service';
import { StockStatusData, StockStatusList } from './interface';

@Component({
    selector: 'stock-status',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        MatTableModule,
        NgClass,
        NgIf,
        DecimalPipe,
        MatIconModule,
        MatButtonModule,
        MatMenuModule,
        DatePipe,
        CommonModule,
    ],
})
export class StockStatusComponent implements OnInit {
    private _service = inject(StockStatusService);
    private _snackBarService = inject(SnackbarService);
    private _confirmationService = inject(HelperConfirmationService);
    private _matDialog = inject(MatDialog);

    public displayedColumns: string[] = [
        'no',
        'name',
        'threshold',
        'created_at',
        'action',
    ];
    public dataSource: MatTableDataSource<StockStatusData> =
        new MatTableDataSource<StockStatusData>([]);
    public isLoading: boolean = true;

    constructor(private cdr: ChangeDetectorRef) {}

    ngOnInit(): void {
        this.getData();
    }

    getThresholdDisplay(min: number, max: number): string {
        min = Math.max(0, min);
        max = Math.max(0, max);
         return `${min} - ${max} items`;
    }

    getData(): void {
        this.isLoading = true;
        this._service.getData().subscribe({
            next: (response: StockStatusList) => {
                // Ensure min and max are not negative
                response.data.StockStatus.forEach((item) => {
                    item.min_items = Math.max(0, item.min_items);
                    item.max_items = Math.max(0, item.max_items);
                });
                this.dataSource.data = response.data.StockStatus;
                this.isLoading = false;
            },
            error: (err: HttpErrorResponse) => {
                this._snackBarService.openSnackBar(
                    err?.error?.message ?? GlobalConstants.genericError,
                    GlobalConstants.error
                );
                this.isLoading = false;
            },
        });
    }

    create(): void {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.data = { title: 'Create Stock Status', stockStatus: null };
        dialogConfig.autoFocus = false;
        dialogConfig.position = { right: '0px' };
        dialogConfig.height = '100dvh';
        dialogConfig.width = '100dvw';
        dialogConfig.maxWidth = '550px';
        dialogConfig.panelClass = 'custom-mat-dialog-as-mat-drawer';
        dialogConfig.enterAnimationDuration = '0s';

        const dialogRef = this._matDialog.open(
            StockStatusDialogComponent,
            dialogConfig
        );

        dialogRef.componentInstance.ResponseData.subscribe(
            (status: StockStatusData) => {
                this.cdr.detectChanges();
                const data = this.dataSource.data;
                data.push(status);
                data.sort((a, b) => a.id - b.id);
                this.getData();
                this.dataSource.data = data;
            }
        );
    }

    update(row: StockStatusData): void {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.data = { title: 'Edit Stock Status', stockStatus: row };
        dialogConfig.autoFocus = false;
        dialogConfig.position = { right: '0px' };
        dialogConfig.height = '100dvh';
        dialogConfig.width = '100dvw';
        dialogConfig.maxWidth = '550px';
        dialogConfig.panelClass = 'custom-mat-dialog-as-mat-drawer';
        dialogConfig.enterAnimationDuration = '0s';

        const dialogRef = this._matDialog.open(
            StockStatusDialogComponent,
            dialogConfig
        );

        dialogRef.componentInstance.ResponseData.subscribe(
            (status: StockStatusData) => {
                this.cdr.detectChanges();
                const index = this.dataSource.data.indexOf(row);
                this.getData();
                this.dataSource.data[index] = status;
            }
        );
    }

    onDelete(status: StockStatusData): void {
        const config: HelperConfirmationConfig = {
            title: `Delete Stock Status <strong>${status.name}</strong>`,
            message:
                'Are you sure you want to delete this stock status? <strong>This cannot be undone!</strong>',
            icon: {
                show: true,
                name: 'heroicons_outline:exclamation-triangle',
                color: 'warn',
            },
            actions: {
                confirm: { show: true, label: 'Delete', color: 'warn' },
                cancel: { show: true, label: 'Cancel' },
            },
            dismissible: true,
        };

        const dialogRef = this._confirmationService.open(config);

        dialogRef.afterClosed().subscribe((result: string) => {
            if (result === 'confirmed') {
                this._service.delete(status.id).subscribe({
                    next: (res) => {
                        this.dataSource.data = this.dataSource.data.filter(
                            (s) => s.id !== status.id
                        );
                        this._snackBarService.openSnackBar(
                            res.message,
                            GlobalConstants.success
                        );
                        this.cdr.detectChanges();
                        this.getData();
                    },
                    error: (err: HttpErrorResponse) => {
                        this._snackBarService.openSnackBar(
                            err?.error?.message ?? GlobalConstants.genericError,
                            GlobalConstants.error
                        );
                    },
                });
            }
        });
    }
}
