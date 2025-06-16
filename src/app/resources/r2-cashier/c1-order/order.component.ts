// ================================================================>> Core Library Imports
import { CommonModule, DecimalPipe, NgForOf, NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { QRCodeComponent } from 'angularx-qrcode';
import {
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
    TemplateRef,
    ViewChild,
    HostListener,
    inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

// ================================================================>> Third Party Library Imports
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { Subject, takeUntil } from 'rxjs';

// ================================================================>> Custom Library Imports
import { UserService } from 'app/core/user/service';
import { User } from 'app/core/user/interface';
import { env } from 'envs/env';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { ProductType } from '../c2-sale/sale.interface';
import { ItemComponent } from './item/component';
import { OrderService } from './order.service';
import { Data, Product } from './order.interface';
import { ViewDetailSaleComponent } from 'app/shared/view/view.component';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { KhqrService } from './khqr/khqr.service';
import { KHQRRequest } from './khqr/khqr.interface';

// ================================================================>> Interfaces
interface CartItem {
    id: number;
    name: string;
    qty: number;
    temp_qty: number;
    unit_price: number;
    image: string;
    code: string;
    type: ProductType;
    promotion_id?: number;
    discount?: number;
}
@Component({
    selector: 'app-order',
    standalone: true,
    templateUrl: './order.template.html',
    styleUrls: ['./style.scss'],
    imports: [
        CommonModule,
        DecimalPipe,
        MatIconModule,
        MatTabsModule,
        ItemComponent,
        FormsModule,
        NgIf,
        NgForOf,
        MatButtonModule,
        MatProgressSpinnerModule,
        ZXingScannerModule,
        QRCodeComponent,
    ],
})
export class OrderComponent implements OnInit, OnDestroy {
    // ================================================================>> Section: State & Data Properties
    private _unsubscribeAll: Subject<User> = new Subject<User>();
    fileUrl: string = env.FILE_BASE_URL;
    data: Data[] = [];
    allProducts: Product[] = [];
    carts: CartItem[] = [];
    orderedItems: CartItem[] = [];
    lastOrderData: any;
    user: User;
    selectedTab: any;

    // ================================================================>> Section: UI State Flags
    isLoading = false;
    isAdjustingOrder = false;
    isCheckoutSuccess = false;
    isOrderBeingMade = false;
    canSubmit = false;

    // ================================================================>> Section: Payment & QR
    selectedPaymentMethod: string = 'cash';
    currentAmount: string = '';
    displayAmount: string = '';
    discount: number = 0;
    isWaitingForScanPay = false;
    scanPayPollingInterval: any = null;
    qrData: string = '';
    isGeneratingQR = false;

    // ================================================================>> Section: Order Summary
    totalPrice: number = 0;
    orderSummary = {
        subtotal: 0,
        discount: 0,
        total: 0,
    };

    // ================================================================>> Section: QR Scanner
    @ViewChild('qrScannerDialog') qrScannerDialog!: TemplateRef<any>;
    qrDialogRef: any;
    availableDevices: MediaDeviceInfo[] = [];
    selectedDevice: MediaDeviceInfo | undefined;

    // ================================================================>> Section: Constructor & Dependency Injection
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private dialog: MatDialog,
        private _userService: UserService,
        private _service: OrderService,
        private _snackBarService: SnackbarService,
        private khqrService: KhqrService
    ) {
        // Subscribe to user changes
        this._userService.user$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((user: User) => {
                this.user = user;
                this._changeDetectorRef.markForCheck();
            });
    }

    // ================================================================>> Section: Angular Lifecycle
    ngOnInit(): void {
        this.isLoading = true;
        this._service.getData().subscribe({
            next: (response) => {
                this.data = response.data;
                this.allProducts = this.data.reduce(
                    (all, item) => all.concat(item.products),
                    []
                );
                this.data.unshift({
                    id: 0,
                    name: 'All Categories',
                    products: this.allProducts,
                });
                if (this.data && this.data.length > 0) {
                    this.selectedTab = this.data[0];
                    this._changeDetectorRef.detectChanges();
                }
            },
            error: (err) => {
                this.isLoading = false;
                this._snackBarService.openSnackBar(
                    err?.error?.message || GlobalConstants.genericError,
                    GlobalConstants.error
                );
            },
        });
    }

    ngOnDestroy(): void {
        if (this.scanPayPollingInterval) {
            clearInterval(this.scanPayPollingInterval);
        }
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // ================================================================>> Section: Tab & Category
    selectTab(item: any): void {
        this.selectedTab = item;
        this._changeDetectorRef.detectChanges();
    }

    // ================================================================>> Section: Cart Management
    addToCart(incomingItem: Product, qty = 0): void {
    if (this.isCheckoutSuccess) {
        this._snackBarService.openSnackBar(
            'Cannot add items to cart during payment.',
            GlobalConstants.error
        );
        return;
    }
    const existingItem = this.carts.find(
        (item) => item.id === incomingItem.id
    );
    if (existingItem) {
        existingItem.qty += qty;
        existingItem.temp_qty = existingItem.qty;
    } else {
        const newItem: CartItem = {
            id: incomingItem.id,
            name: incomingItem.name,
            qty: qty,
            temp_qty: qty,
            unit_price: incomingItem.unit_price,
            image: incomingItem.image,
            code: incomingItem.code,
            type: incomingItem.product_type,
            promotion_id: incomingItem.promotion_id,
            discount: incomingItem.discount ?? 0, // Default to 0 if undefined
        };
        this.carts.push(newItem);
        this.canSubmit = true;
    }
    this.getTotalPrice();
}

    incrementQty(index: number): void {
        const item = this.carts[index];
        if (item.temp_qty < 1000) {
            item.temp_qty += 1;
            item.qty = item.temp_qty;
            this.getTotalPrice();
        }
    }

    decrementQty(index: number): void {
        const item = this.carts[index];
        if (item.temp_qty > 1) {
            item.temp_qty -= 1;
            item.qty = item.temp_qty;
            this.getTotalPrice();
        }
    }

    remove(value: any, index: number = -1): void {
        this.carts.splice(index, 1);
        this.getTotalPrice();
        if (this.carts.length === 0) {
            this.canSubmit = false; // Disable checkout if cart is empty
        }
    }

    clearCartAll(): void {
        this.carts = [];
        this.totalPrice = 0;
        this.canSubmit = false;
        this.qrData = '';
        this.khqrService.lastMd5 = '';
        if (this.scanPayPollingInterval) {
            clearInterval(this.scanPayPollingInterval);
            this.scanPayPollingInterval = null;
        }
        this.isWaitingForScanPay = false;
        this._snackBarService.openSnackBar(
            'Cancel order successfully',
            GlobalConstants.success
        );
    }

    blur(event: any, index: number = -1): void {
        const enteredValue = parseInt(event.target.value, 10);
        if (isNaN(enteredValue) || enteredValue <= 0) {
            this.carts.splice(index, 1); // Remove item if qty is 0 or invalid
            this.canSubmit = this.carts.length > 0;
        } else if (enteredValue > 1000) {
            event.target.value = '1000';
            this.carts[index].qty = 1000;
            this.carts[index].temp_qty = 1000;
            this.canSubmit = true;
        } else {
            this.carts[index].qty = enteredValue;
            this.carts[index].temp_qty = enteredValue;
            this.canSubmit = true;
        }
        this.getTotalPrice();
    }

    // ================================================================>> Section: Price Calculation
    getTotalPrice(): void {
        // Calculate subtotal (total without discounts)
        const subtotal = this.carts.reduce((total, item) => {
            return total + item.qty * item.unit_price;
        }, 0);

        // Calculate total after discounts
        const totalAfterDiscount = this.carts.reduce((total, item) => {
            const price =
                item.promotion_id && item.discount > 0
                    ? item.unit_price * (1 - item.discount / 100)
                    : item.unit_price;
            return total + item.qty * price;
        }, 0);

        // Calculate discount as subtotal minus total after discounts
        const discount = subtotal - totalAfterDiscount;

        this.totalPrice = totalAfterDiscount;
        this.discount = discount;
        this.updateOrderSummary();
    }

    updateOrderSummary(): void {
        this.orderSummary.subtotal = this.totalPrice + this.discount; // Subtotal is total before discounts
        this.orderSummary.discount = this.discount;
        this.orderSummary.total = this.totalPrice; // Total after discounts, no tax
    }

    // ================================================================>> Section: Payment & Checkout
    selectPaymentMethod(method: string): void {
        // If switching away from scanpay, clear QR and polling state
        if (this.selectedPaymentMethod === 'scanpay' && method !== 'scanpay') {
            this.qrData = '';
            this.khqrService.lastMd5 = '';
            if (this.scanPayPollingInterval) {
                clearInterval(this.scanPayPollingInterval);
                this.scanPayPollingInterval = null;
            }
            this.isWaitingForScanPay = false;
            this.isGeneratingQR = false;
        }
        this.selectedPaymentMethod = method;
        if (method === 'scanpay') {
            this.qrData = '';
            this.khqrService.lastMd5 = '';
            if (this.scanPayPollingInterval) {
                clearInterval(this.scanPayPollingInterval);
                this.scanPayPollingInterval = null;
            }
            this.isWaitingForScanPay = false;
            this.isGeneratingQR = false;
            this.onScanPay();
        }
    }

    inputNumber(num: string): void {
        if (this.currentAmount === '0') {
            this.currentAmount = num;
        } else {
            this.currentAmount += num;
        }
        this.updateDisplay();
    }

    inputDecimal(): void {
        if (!this.currentAmount.includes('.')) {
            this.currentAmount += this.currentAmount === '' ? '0.' : '.';
            this.updateDisplay();
        }
    }

    clearInput(): void {
        if (this.currentAmount.length > 0) {
            this.currentAmount = this.currentAmount.slice(0, -1);
            this.updateDisplay();
        }
    }

    clearAll(): void {
        this.currentAmount = '';
        this.updateDisplay();
    }

    updateDisplay(): void {
        this.displayAmount =
            this.currentAmount === '' ? '' : '$' + this.currentAmount;
    }

    processPayment(): void {
        if (this.currentAmount === '') {
            this._snackBarService.openSnackBar(
                'Please enter payment amount.',
                GlobalConstants.error
            );
            return;
        }
        const amount = parseFloat(this.currentAmount);
        const total = this.orderSummary.total;
        if (this.selectedPaymentMethod === 'cash') {
            if (isNaN(amount) || amount < total) {
                this._snackBarService.openSnackBar(
                    `Amount must be at least $${total.toFixed(2)}.`,
                    GlobalConstants.error
                );
                return;
            }
            this.confirmPayment(); // Proceed to confirm payment
        } else {
            this.processScanPayment();
        }
    }

    completePayment(amount: number, change: number): void {
        console.log(`Payment complete. Change: $${change.toFixed(2)}`);
        this.isCheckoutSuccess = true;
    }

    processScanPayment(): void {
        alert('Redirecting to ScanPay...');
    }

    confirmPayment(): void {
    if (!this.carts.length) {
        this._snackBarService.openSnackBar(
            'No items in cart.',
            GlobalConstants.error
        );
        return;
    }
    if (this.selectedPaymentMethod === 'cash') {
        const amount = parseFloat(this.currentAmount);
        if (isNaN(amount)) {
            this._snackBarService.openSnackBar(
                'Please enter a valid payment amount.',
                GlobalConstants.error
            );
            return;
        }
        if (Math.abs(amount - this.orderSummary.total) >= 0.01) {
            this._snackBarService.openSnackBar(
                `Amount ($${amount.toFixed(2)}) must exactly equal total ($${this.orderSummary.total.toFixed(2)}).`,
                GlobalConstants.error
            );
            return;
        }
    }
    const carts: { [itemId: number]: number } = {};
    this.carts.forEach((item: CartItem) => {
        carts[item.id] = item.qty;
    });
    const body = { cart: JSON.stringify(carts) };
    this.isOrderBeingMade = true;
    this._service.create(body).subscribe({
        next: (response) => {
            this.isOrderBeingMade = false;
            this.lastOrderData = response.data;
            this.orderedItems = [...this.carts];
            this.carts = [];
            this.isCheckoutSuccess = false;
            this.canSubmit = false;
            this.currentAmount = '';
            this.displayAmount = '';
            this.qrData = '';
            this.khqrService.lastMd5 = '';
            if (this.scanPayPollingInterval) {
                clearInterval(this.scanPayPollingInterval);
                this.scanPayPollingInterval = null;
            }
            this.isWaitingForScanPay = false;
            this._snackBarService.openSnackBar(
                response.message || 'Payment successful!',
                GlobalConstants.success
            );
            this.viewReceipt();
            this._changeDetectorRef.detectChanges();
        },
        error: (err: HttpErrorResponse) => {
            this.isOrderBeingMade = false;
            this._snackBarService.openSnackBar(
                err?.error?.message || GlobalConstants.genericError,
                GlobalConstants.error
            );
        },
    });
}

    // ================================================================>> Section: Order Submission
    private matDialog = inject(MatDialog);

    canConfirmPayment(): boolean {
    if (this.isOrderBeingMade) return false;
    if (this.selectedPaymentMethod === 'cash') {
        const amount = Number(this.currentAmount);
        return (
            !!this.currentAmount &&
            !isNaN(amount) &&
            Math.abs(amount - this.orderSummary.total) < 0.01 // Exact match with tolerance
        );
    }
    return true; // For ScanPay, no amount input required
}

    checkOut(): void {
        if (!this.carts.length) {
            this._snackBarService.openSnackBar(
                'Cart is empty.',
                GlobalConstants.error
            );
            return;
        }
        this.selectedPaymentMethod = 'cash';
        this.isCheckoutSuccess = true;
        this._changeDetectorRef.detectChanges();
    }

    addPayment(): void {
    const amount = parseFloat(this.currentAmount);
    const total = this.orderSummary.total;

    // Step 1: Handle empty/invalid input
    if (!this.currentAmount || isNaN(amount)) {
        this._snackBarService.openSnackBar(
            'Please enter a valid amount.',
            GlobalConstants.error
        );
        return;
    }

    // Step 2: For cash, amount must exactly equal total
    if (this.selectedPaymentMethod === 'cash') {
        if (Math.abs(amount - total) >= 0.01) {
            this._snackBarService.openSnackBar(
                `Amount ($${amount.toFixed(2)}) must exactly equal total ($${total.toFixed(2)}).`,
                GlobalConstants.error
            );
            return;
        }
    }

    // Step 3: All checks passed
    this.confirmPayment();
}

    checkScanPayStatus(): void {
        if (!this.qrData || !this.khqrService) return;

        // You need the md5 from the KHQRResponse (store it when generating QR)
        const md5 = this.khqrService.lastMd5 || ''; // Or however you store it
        if (!md5) {
            this._snackBarService.openSnackBar(
                'No payment session found.',
                GlobalConstants.error
            );
            return;
        }

        this.isOrderBeingMade = true;
        this.khqrService.checkPaymentStatus({ md5 }).subscribe({
            next: (res) => {
                this.isOrderBeingMade = false;
                if (res.status === 'PAID') {
                    this._snackBarService.openSnackBar(
                        'Payment received. Completing order...',
                        GlobalConstants.success
                    );
                    this.confirmPayment();
                } else {
                    this._snackBarService.openSnackBar(
                        'Payment not yet received. Please complete payment in your banking app.',
                        GlobalConstants.error
                    );
                }
            },
            error: (err) => {
                this.isOrderBeingMade = false;
                this._snackBarService.openSnackBar(
                    'Failed to check payment status.',
                    GlobalConstants.error
                );
            },
        });
    }

    viewReceipt(): void {
        if (!this.lastOrderData) return;
        const dialogConfig = new MatDialogConfig();
        dialogConfig.data = this.lastOrderData;
        dialogConfig.autoFocus = false;
        dialogConfig.position = { right: '0px' };
        dialogConfig.height = '100dvh';
        dialogConfig.width = '100dvw';
        dialogConfig.maxWidth = '550px';
        dialogConfig.panelClass = 'custom-mat-dialog-as-mat-drawer';
        dialogConfig.enterAnimationDuration = '0s';
        this.matDialog.open(ViewDetailSaleComponent, dialogConfig);
    }

    goBack(): void {
        this.isCheckoutSuccess = false;
        this.isAdjustingOrder = true;
        this.currentAmount = '';
        this.displayAmount = '';
        this.qrData = ''; // <-- Clear QR code
        this.khqrService.lastMd5 = ''; // <-- Clear last md5
        if (this.scanPayPollingInterval) {
            clearInterval(this.scanPayPollingInterval);
            this.scanPayPollingInterval = null;
        }
        this.isWaitingForScanPay = false;
        this._changeDetectorRef.detectChanges();
    }

    // ================================================================>> Section: QR/ScanPay
    generateKHQRRequest(amount: number): KHQRRequest {
        return {
            bank_account: env.KHQR_BANK_ACCOUNT,
            merchant_name: env.KHQR_MERCHANT_NAME,
            merchant_city: env.KHQR_MERCHANT_CITY,
            amount,
            currency: env.KHQR_CURRENCY,
            store_label: env.KHQR_STORE_LABEL,
            phone_number: env.KHQR_PHONE_NUMBER,
            bill_number: this.generateBillNumber(),
            terminal_label: env.KHQR_TERMINAL_LABEL,
            static: env.KHQR_STATIC,
        };
    }

    generateBillNumber(): string {
        const now = new Date();
        return `INV-${now.getFullYear()}${
            now.getMonth() + 1
        }${now.getDate()}-${now.getTime()}`;
    }

    startScanPayPolling() {
        // Clear any previous polling
        if (this.scanPayPollingInterval) {
            clearInterval(this.scanPayPollingInterval);
        }
        // Poll every 3 seconds (adjust as needed)
        this.scanPayPollingInterval = setInterval(() => {
            this.khqrService
                .checkPaymentStatus({ md5: this.khqrService.lastMd5 })
                .subscribe({
                    next: (res) => {
                        if (res.status === 'PAID') {
                            clearInterval(this.scanPayPollingInterval);
                            this.isWaitingForScanPay = false;
                            this.confirmPayment();
                        }
                    },
                    error: () => {
                        // Optionally handle error
                    },
                });
        }, 3000);
    }

    onScanPay() {
        const amount = this.orderSummary?.total ?? 0;
        const requestData = this.generateKHQRRequest(amount);
        this.isGeneratingQR = true;
        this.isWaitingForScanPay = true;
        this.startScanPayPolling();
        this.khqrService.generateQRCode(requestData).subscribe({
            next: (res) => {
                this.qrData = res.qr;
                this.khqrService.lastMd5 = res.md5 || ''; // Store md5 for later use
                this.isGeneratingQR = false;
            },
            error: (err) => {
                console.error('KHQR generation failed', err);
                this.isGeneratingQR = false;
                this.isWaitingForScanPay = false;
            },
        });
    }

    // ================================================================>> Section: QR Scanner Dialog
    openQrScanner() {
        this.qrDialogRef = this.dialog.open(this.qrScannerDialog, {
            width: '400px',
            autoFocus: false,
        });
    }

    closeQrScanner() {
        if (this.qrDialogRef) {
            this.qrDialogRef.close();
        }
    }

    onQrCodeResult(result: string) {
        this.closeQrScanner();
        alert('Scanned QR Code: ' + result);
    }

    onCamerasFound(devices: MediaDeviceInfo[]): void {
        this.availableDevices = devices;
        const realCam = devices.find((d) => !/obs|virtual|snap/i.test(d.label));
        this.selectedDevice = realCam || devices[0];
    }

    onDeviceSelect(deviceId: string) {
        this.selectedDevice = this.availableDevices.find(
            (d) => d.deviceId === deviceId
        );
    }

    // ================================================================>> Section: Keyboard Shortcuts
    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent): void {
        const key = event.key;
        if (!isNaN(Number(key))) {
            this.inputNumber(key);
        } else if (key === '.') {
            this.inputDecimal();
        } else if (key === 'Backspace') {
            this.clearInput();
        } else if (key.toLowerCase() === 'c') {
            this.clearAll();
        }
    }
}
