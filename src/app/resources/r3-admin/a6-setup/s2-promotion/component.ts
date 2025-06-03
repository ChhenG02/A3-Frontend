// ================================================================>> Core Library (Angular)
import { CommonModule, DatePipe, DecimalPipe, NgClass, NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';

// ================================================================>> Third Party Library (Angular Material)
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

// ================================================================>> Custom Library (Application-specific)
import { env } from 'envs/env';
import { HelperConfirmationConfig, HelperConfirmationService } from 'helper/services/confirmation';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';

import { PromotionDialogComponent } from './view-dialog/component';
import { PromotionService } from './service';
import { PromotionData, PromotionList } from './interface';

@Component({
    selector: 'promotions',
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
export class PromotionComponent implements OnInit {
    private _service = inject(PromotionService);
    private _snackBarService = inject(SnackbarService);
    private _confirmationService = inject(HelperConfirmationService);
    private _matDialog = inject(MatDialog);

    public displayedColumns: string[] = ['no', 'discount_value', 'start_date', 'end_date', 'action'];
    public dataSource: MatTableDataSource<PromotionData> = new MatTableDataSource<PromotionData>([]);

    public isLoading: boolean = true;
    constructor(
        private cdr: ChangeDetectorRef,
    ){
        
    }

    ngOnInit(): void {
        this.getData();
    }

    getData(): void {
        this.isLoading = true;
        this._service.getData().subscribe({
            next: (response: PromotionList) => {
                this.dataSource.data = response.data.Promotion;
                this.isLoading = false;
            },
            error: (err: HttpErrorResponse) => {
                this._snackBarService.openSnackBar(
                    err?.error?.message ?? GlobalConstants.genericError,
                    GlobalConstants.error
                );
                this.isLoading = false;
            }
        });
    }

    create(): void {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.data = { title: 'Create Promotion', promotion: null };
        dialogConfig.autoFocus = false;
        dialogConfig.position = { right: '0px' };
        dialogConfig.height = '100dvh';
        dialogConfig.width = '100dvw';
        dialogConfig.maxWidth = '550px';
        dialogConfig.panelClass = 'custom-mat-dialog-as-mat-drawer';
        dialogConfig.enterAnimationDuration = '0s';

        const dialogRef = this._matDialog.open(PromotionDialogComponent, dialogConfig);

        dialogRef.componentInstance.ResponseData.subscribe((promo: PromotionData) => {
            this.cdr.detectChanges()
            const data = this.dataSource.data;
            data.push(promo);
            data.sort((a, b) => a.id - b.id);
            this.getData();
            this.dataSource.data = data;
        });
        // dialogRef.afterClosed().subscribe((promo: PromotionData) => {
        //     if (promo) {
        //         const message = `កែប្រែបានជោគជ័យ`;
        //         this.cdr.detectChanges()
        //         const data = this.dataSource.data;
        //         data.push(promo);
        //         data.sort((a, b) => a.id - b.id);
        //         this.dataSource.data = data;
        //     }
        // });

    }
    

    update(row: PromotionData): void {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.data = { title: 'Edit Promotion', promotion: row };
        dialogConfig.autoFocus = false;
        dialogConfig.position = { right: '0px' };
        dialogConfig.height = '100dvh';
        dialogConfig.width = '100dvw';
        dialogConfig.maxWidth = '550px';
        dialogConfig.panelClass = 'custom-mat-dialog-as-mat-drawer';
        dialogConfig.enterAnimationDuration = '0s';

        const dialogRef = this._matDialog.open(PromotionDialogComponent, dialogConfig);

        dialogRef.componentInstance.ResponseData.subscribe((promo: PromotionData) => {
            this.cdr.detectChanges()
            const index = this.dataSource.data.indexOf(row);
            this.getData();
            this.dataSource.data[index] = promo;
        });
    }

    onDelete(promo: PromotionData): void {
        const config: HelperConfirmationConfig = {
            title: `Delete Promotion <strong>ID ${promo.discount_value}</strong>`,
            message: 'Are you sure you want to delete this promotion? <strong>This cannot be undone!</strong>',
            icon: {
                show: true,
                name: 'heroicons_outline:exclamation-triangle',
                color: 'warn',
            },
            actions: {
                confirm: { show: true, label: 'Delete', color: 'warn' },
                cancel: { show: true, label: 'Cancel' }
            },
            dismissible: true,
        };

        const dialogRef = this._confirmationService.open(config);

        dialogRef.afterClosed().subscribe((result: string) => {
            if (result === 'confirmed') {
                this._service.delete(promo.id).subscribe({
                    next: (res) => {
                        this.dataSource.data = this.dataSource.data.filter(p => p.id !== promo.id);
                        this._snackBarService.openSnackBar(res.message, GlobalConstants.success);
                        this.cdr.detectChanges()
                        this.getData();
                    },
                    error: (err: HttpErrorResponse) => {
                        this._snackBarService.openSnackBar(
                            err?.error?.message ?? GlobalConstants.genericError,
                            GlobalConstants.error
                        );
                    }
                });
            }
        });
    }
}
