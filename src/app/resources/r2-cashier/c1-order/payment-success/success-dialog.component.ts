import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-payment-success-dialog',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    standalone: true,
    imports: [MatIconModule, MatButtonModule],
})
export class PaymentSuccessDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<PaymentSuccessDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { total: number; transactionId: string }
    ) {}

    onDone(): void {
        this.dialogRef.close();
    }
}