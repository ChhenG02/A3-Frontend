// ================================================================>> Core Library
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

// ================================================================>> Third party Library
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';

import { Subject, takeUntil } from 'rxjs';

// ================================================================>> Custom Library
import { UserService } from 'app/core/user/service';
import { User } from 'app/core/user/interface';
import { env } from 'envs/env';
import { SnackbarService } from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants from 'helper/shared/constants';
import { ProductType } from '../c2-sale/interface';
import { ItemComponent } from './item/component';
import { OrderService } from './order.service';
import { Data, Product } from './order.interface';
import { ViewDetailSaleComponent } from 'app/shared/view/view.component';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { KhqrService } from './khqr/khqr.service';
import { KHQRRequest } from './khqr/khqr.interface';
interface CartItem {
    id: number;
    name: string;
    qty: number;
    temp_qty: number;
    unit_price: number;
    image: string;
    code: string;
    type: ProductType;
}

@Component({
    selector: 'app-order',
    standalone: true,
    templateUrl: './order.template.html',
    styleUrls: ['./style.scss'], // Note: Corrected from 'styleUrl' to 'styleUrls'

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
    // Create a private subject to handle unsubscription
    private _unsubscribeAll: Subject<User> = new Subject<User>();

    // Define the base URL for file uploads
    fileUrl: string = env.FILE_BASE_URL;
    data: Data[] = [];
    qrData: string = '';
    isGeneratingQR = false;
    allProducts: Product[] = [];
    isLoading: boolean = false;
    carts: CartItem[] = [];
    isAdjustingOrder: boolean = false;
    isCheckoutSuccess: boolean = false;
    orderedItems: CartItem[] = [];
    lastOrderData: any;
    user: User;
    isOrderBeingMade: boolean = false;
    canSubmit: boolean = false;
    totalPrice: number = 0;
    selectedTab: any;

    @ViewChild('qrScannerDialog') qrScannerDialog!: TemplateRef<any>;
    qrDialogRef: any;

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private dialog: MatDialog,
        private _userService: UserService,
        private _service: OrderService,
        private _snackBarService: SnackbarService,
        private khqrService: KhqrService
    ) {
        // Subscribe to changes in the user's data
        this._userService.user$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((user: User) => {
                this.user = user;
                // Mark for check - triggers change detection manually
                this._changeDetectorRef.markForCheck();
            });
    }

    // Payment related properties
    selectedPaymentMethod: string = 'cash';
    currentAmount: string = '';
    displayAmount: string = '';

    discount: number = 5; // set this as needed
    tax: number = 2; // set this as needed

    // Order summary (You should replace these with actual calculated values)
    orderSummary = {
        subtotal: 0,
        discount: 0,
        tax: 0,
        total: 0,
    };

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

    // Generates a unique bill number (e.g., using timestamp)
    generateBillNumber(): string {
        const now = new Date();
        return `INV-${now.getFullYear()}${
            now.getMonth() + 1
        }${now.getDate()}-${now.getTime()}`;
    }

    onScanPay() {
        const amount = this.orderSummary?.total ?? 0;
        const requestData = this.generateKHQRRequest(amount);

        this.isGeneratingQR = true;
        this.khqrService.generateQRCode(requestData).subscribe({
            next: (res) => {
                this.qrData = res.qr;
                this.isGeneratingQR = false;
            },
            error: (err) => {
                console.error('KHQR generation failed', err);
                this.isGeneratingQR = false;
            },
        });
    }

    updateOrderSummary(): void {
        this.orderSummary.subtotal = this.totalPrice;
        this.orderSummary.discount = this.discount;
        this.orderSummary.tax = this.tax;
        this.orderSummary.total = this.totalPrice - this.discount + this.tax;
    }

    // Call updateOrderSummary() whenever cart, discount, or tax changes:
    getTotalPrice(): void {
        this.totalPrice = this.carts.reduce(
            (total, item) => total + item.qty * item.unit_price,
            0
        );
        this.updateOrderSummary();
    }

    // 👇 Place this method inside the class
    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent): void {
        const key = event.key;

        if (!isNaN(Number(key))) {
            // Numeric key pressed
            if (key === '0') {
                this.inputNumber('0');
            } else {
                this.inputNumber(key); // handles 1–9
            }
        } else if (key === '.') {
            this.inputDecimal();
        } else if (key === 'Backspace') {
            this.clearInput();
        } else if (key.toLowerCase() === 'c') {
            this.clearAll();
        } else if (key === 'Enter') {
            this.processPayment();
        }
    }

    // Payment methods
    selectPaymentMethod(method: string): void {
        this.selectedPaymentMethod = method;
        if (method === 'scanpay') {
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
        if (this.currentAmount === '') {
            this.displayAmount = '';
        } else {
            this.displayAmount = '$' + this.currentAmount;
        }
    }

    processPayment(): void {
        if (this.currentAmount === '') {
            alert('Please enter payment amount.');
            return;
        }

        const amount = parseFloat(this.currentAmount);
        const total = this.orderSummary.total;

        if (this.selectedPaymentMethod === 'cash') {
            if (amount < total) {
                alert('Insufficient cash amount.');
                return;
            }

            const change = amount - total;
            this.completePayment(amount, change);
        } else {
            this.processScanPayment();
        }
    }

    completePayment(amount: number, change: number): void {
        // Your business logic for successful payment
        console.log(`Payment complete. Change: $${change.toFixed(2)}`);
        this.isCheckoutSuccess = true;
    }

    processScanPayment(): void {
        // Your QR/online payment logic
        alert('Redirecting to ScanPay...');
    }

    goBack(): void {
        this.isCheckoutSuccess = false;
        this.isAdjustingOrder = true;
        this._changeDetectorRef.detectChanges();
    }

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
        // Optionally, you can do more with the result (e.g., open the link)
    }

    // === QR Camera Selection ===
    availableDevices: MediaDeviceInfo[] = [];
    selectedDevice: MediaDeviceInfo | undefined;

    onCamerasFound(devices: MediaDeviceInfo[]): void {
        this.availableDevices = devices;
        // Optionally, auto-select the first non-virtual camera
        const realCam = devices.find((d) => !/obs|virtual|snap/i.test(d.label));
        this.selectedDevice = realCam || devices[0];
    }

    onDeviceSelect(deviceId: string) {
        this.selectedDevice = this.availableDevices.find(
            (d) => d.deviceId === deviceId
        );
    }

    // ===> onInit method to initialize the component
    ngOnInit(): void {
        // Set isLoading to true to indicate that data is being loaded
        this.isLoading = true;

        // Subscribe to the list method of the orderService
        this._service.getData().subscribe({
            next: (response) => {
                this.data = response.data;

                // Create the "ALL" category
                this.allProducts = this.data.reduce((all, item) => {
                    return all.concat(item.products);
                }, []);

                // Add the "ALL" category to the data array
                this.data.unshift({
                    id: 0, // Use a unique id for the "ALL" category
                    name: 'All Categories',
                    products: this.allProducts,
                });
                if (this.data && this.data.length > 0) {
                    this.selectedTab = this.data[0]; // Automatically select the first tab
                    this._changeDetectorRef.detectChanges(); // Manually trigger change detection
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

    // Function to handle tab selection
    selectTab(item: any): void {
        this.selectedTab = item;
        this._changeDetectorRef.detectChanges(); // Trigger change detection manually
    }

    // Function to handle the ngOnDestroy
    ngOnDestroy(): void {
        // Emit a value through the _unsubscribeAll subject to trigger the unsubscription
        this._unsubscribeAll.next(null);
        // Complete the subject to release resources
        this._unsubscribeAll.complete();
    }
    // Function to clear the cart
    clearCartAll(): void {
        this.carts = [];
        this.totalPrice = 0;
        this.canSubmit = false;
        this._snackBarService.openSnackBar(
            'Cancel order successfully',
            GlobalConstants.success
        );
    }
    // Function to increment the quantity of an item
    incrementQty(index: number): void {
        const item = this.carts[index];
        if (item.temp_qty < 1000) {
            item.temp_qty += 1;
            item.qty = item.temp_qty;
            this.getTotalPrice();
        }
    }

    // Function to decrement the quantity of an item
    decrementQty(index: number): void {
        const item = this.carts[index];
        if (item.temp_qty > 1) {
            item.temp_qty -= 1;
            item.qty = item.temp_qty;
            this.getTotalPrice();
        }
    }
    // Function to add an item to the cart
    addToCart(incomingItem: Product, qty = 0): void {
        // Find an existing item in the cart with the same id as the incoming item
        const existingItem = this.carts.find(
            (item) => item.id === incomingItem.id
        );

        if (existingItem) {
            // If the item already exists, update its quantity and temp_qty
            existingItem.qty += qty;
            existingItem.temp_qty = existingItem.qty;
        } else {
            // If the item doesn't exist, create a new CartItem and add it to the cart
            const newItem: CartItem = {
                id: incomingItem.id,
                name: incomingItem.name,
                qty: qty,
                temp_qty: qty,
                unit_price: incomingItem.unit_price,
                image: incomingItem.image,
                code: incomingItem.code,
                type: incomingItem.product_type,
            };
            this.carts.push(newItem);
            // Set canSubmit to true, indicating that there is at least one item in the cart
            this.canSubmit = true;
        }

        // Calculate and update the total price of the items in the cart
        this.getTotalPrice();
    }

    // Function to calculate the total price of the items in the cart
    getSubTotalPrice(): void {
        // Calculate the total price by iterating over items in the cart and summing the product of quantity and unit price
        this.totalPrice = this.carts.reduce(
            (total, item) => total + item.qty * item.unit_price,
            0
        );
    }

    // Function to remove an item from the cart
    remove(value: any, index: number = -1): void {
        // If the value is 0, set canSubmit to true
        if (value === 0) {
            this.canSubmit = true;
        }

        // Remove the item from the cart at the specified index
        this.carts.splice(index, 1);

        // Calculate and update the total price of the items in the cart
        this.getTotalPrice();
    }

    // Function to handle the blur event on the quantity input field
    blur(event: any, index: number = -1): void {
        // Store the current quantity before any changes
        const tempQty = this.carts[index].qty;

        // Check if the entered value is 0, and update canSubmit accordingly
        if (event.target.value == 0) {
            this.canSubmit = false;
        } else {
            this.canSubmit = true;
        }

        // Parse the entered value as an integer (base 10)
        const enteredValue = parseInt(event.target.value, 10);

        // Ensure the entered value does not exceed 1000
        if (enteredValue > 1000) {
            event.target.value = '1000';
        }

        // Check if the entered value is falsy (e.g., an empty string)
        if (!event.target.value) {
            // Restore the quantity to its previous value if the entered value is falsy
            this.carts[index].qty = tempQty;
            this.carts[index].temp_qty = tempQty;
        } else {
            // Update the quantity with the entered value
            this.carts[index].qty = enteredValue;
            this.carts[index].temp_qty = enteredValue;
        }

        // Calculate and update the total price of the items in the cart
        this.getTotalPrice();
    }

    // Function to handle the keydown event on the quantity input field
    private matDialog = inject(MatDialog);
    checkOut(): void {
        const carts: { [itemId: number]: number } = {};

        this.carts.forEach((item: CartItem) => {
            carts[item.id] = item.qty;
        });

        const body = {
            cart: JSON.stringify(carts),
        };

        this.isOrderBeingMade = true;

        this._service.create(body).subscribe({
            next: (response) => {
                this.isOrderBeingMade = false;
                this.isCheckoutSuccess = true;
                this.lastOrderData = response.data;

                // Store the cart items before clearing
                this.orderedItems = [...this.carts];

                this.carts = [];
                this._snackBarService.openSnackBar(
                    response.message,
                    GlobalConstants.success
                );
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

    confirmPayment(): void {
        // Validate cash amount if needed
        if (this.selectedPaymentMethod === 'cash') {
            const amount = parseFloat(this.currentAmount);
            if (isNaN(amount) || amount < this.orderSummary.total) {
                this._snackBarService.openSnackBar(
                    'Please enter a valid cash amount (must be at least the total).',
                    GlobalConstants.error
                );
                return;
            }
        }
        // Now create the order
        const carts: { [itemId: number]: number } = {};
        this.orderedItems.forEach((item: CartItem) => {
            carts[item.id] = item.qty;
        });

        const body = {
            cart: JSON.stringify(carts),
        };

        this.isOrderBeingMade = true;

        this._service.create(body).subscribe({
            next: (response) => {
                this.isOrderBeingMade = false;
                this.lastOrderData = response.data;
                this._snackBarService.openSnackBar(
                    response.message,
                    GlobalConstants.success
                );
                // Show receipt
                this.viewReceipt();
                // Optionally, clear payment state here
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
    // Add this new method
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
}
