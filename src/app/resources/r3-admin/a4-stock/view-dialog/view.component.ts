import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { env } from 'envs/env';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import { Subject } from 'rxjs';
import { Data } from './view.interface';
import { StockService } from '../stock.service';
import { Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-stock-view-dialog',
  templateUrl: './view.template.html',
  styleUrls: ['./style.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    DatePipe,
  ],
})
export class ViewDialogComponent implements OnInit, OnDestroy {
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  fileUrl = env.FILE_BASE_URL;
  isLoading: boolean = false;
  stock: Data | null = null;
  @Output() edit = new EventEmitter<Data>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public element: Data,
    private _dialogRef: MatDialogRef<ViewDialogComponent>,
    private cdr: ChangeDetectorRef,
    private _snackbar: SnackbarService,
    private stockService: StockService
  ) {}

  ngOnInit(): void {
    this.viewData();
  }
  
  onEdit() {
    if (this.stock) {
      this.edit.emit(this.stock);
      this.closeDialog();
    }
  }

  viewData(): void {
    this.isLoading = true;
    this.stockService.view(this.element.id).subscribe({
      next: (res) => {
        this.stock = res.data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this._snackbar.openSnackBar(err.error?.message || 'Failed to load stock details', 'Dismiss');
        this.cdr.detectChanges();
      },
    });
  }

  closeDialog(): void {
    this._dialogRef.close();
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }
}