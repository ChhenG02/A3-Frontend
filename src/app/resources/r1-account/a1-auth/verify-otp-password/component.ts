// core library
import { CommonModule, NgIf }   from '@angular/common';
import { HttpErrorResponse }    from '@angular/common/http';
import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import {
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    UntypedFormBuilder,
    Validators
} from '@angular/forms';
import { MatButtonModule }      from '@angular/material/button';
import { MatCheckboxModule }    from '@angular/material/checkbox';
import { MatFormFieldModule }   from '@angular/material/form-field';
import { MatIconModule }        from '@angular/material/icon';
import { MatInputModule }       from '@angular/material/input';

// custom library

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink }       from '@angular/router';
import { AuthService }              from 'app/core/auth/service';
import { HelperAlertComponent, HelperAlertType } from 'helper/components/alert';
import { SnackbarService }          from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants              from 'helper/shared/constants';

// third party library
import { Subject }                  from 'rxjs';
@Component({
    standalone: true,
    imports: [
        RouterLink,
        FormsModule,
        CommonModule,
        NgIf,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
        HelperAlertComponent,
    ],
    selector: 'verify-otp-password',
    templateUrl: 'template.html',
    styleUrls: ['./style.scss'],
})

export class VerifyOTPAndPasswordComponent implements OnInit {
    private _unsubscribeAll: Subject<void> = new Subject<void>();
    @ViewChild('input1') input1: ElementRef;
    @ViewChild('input2') input2: ElementRef;
    @ViewChild('input3') input3: ElementRef;
    @ViewChild('input4') input4: ElementRef;
    @ViewChild('input5') input5: ElementRef;
    @ViewChild('input6') input6: ElementRef;

    isOtpForm: boolean[] = [true, false, false]; //[otp,password,2fa]
    alert: { type: HelperAlertType; message: string } = {
        type: 'success',
        message: '',
    };

    // Properties
    public token: string = '';
    public numStr1: string = '';
    public numStr2: string = '';
    public numStr3: string = '';
    public numStr4: string = '';
    public numStr5: string = '';
    public numStr6: string = '';
    public otpCode: string = '';
    public remainingTime: number = 0;
    public reSendOtp: boolean = false;
    public isLoading: boolean = false;
    public countdownInterval: any;
    public phone: string = '';
    public canSubmit: boolean = false;

    otp_id: string = '';
    temp2fa: string = '';
    passwordForm: FormGroup;


    // Constructor
    constructor(
        private _authService: AuthService,
        private _formBuilder: UntypedFormBuilder,
        private _router: Router,
        private _snackbarService: SnackbarService,
    ) { }


    // Initialize component
    ngOnInit() {
        localStorage.setItem('phone', 'odompanharith@gmail.com');
        this.phone = 'odompanharith@gmail.com';
        this.remainingTime = 60;
        this.startCountdown();

        this.passwordForm = this._formBuilder.group({
            username: this.phone,
            password: [null, Validators.required],
        });
    }


    // Start countdown
    startCountdown() {
        this.remainingTime -= 1;
        this.countdownInterval = setInterval(() => {
            if (this.remainingTime > 0) {
                this.remainingTime--;
            } else {
                clearInterval(this.countdownInterval);
                this.reSendOtp = true;
                this.numStr1 = this.numStr2 = this.numStr3 = this.numStr4 = this.numStr5 = this.numStr6 = '';
                this.canSubmit = false;
            }
        }, 1000);
    }

    // Format time in MM:SS
    formatTime(seconds: number): string {
        const minutes: number = Math.floor(seconds / 60);
        const remainingSeconds: number = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }


    // Resend OTP code
    resendOtp(): void {
        this.isLoading = true;
        const credentials = {
            username: this.phone,
        };
        this._authService.sendOtp(credentials).subscribe({
            next: (response) => {
                this.isLoading = false;
                this.remainingTime = 60;
                this.startCountdown();
                this.reSendOtp = false;
                this._snackbarService.openSnackBar(response.message, GlobalConstants.success);
            },
            error: (err: HttpErrorResponse) => {
                console.log(err)
                const errors: { field: string, message: string }[] | undefined = err.error.errors;
                let message: string = err.error.message;
                if (errors && errors.length > 0) {
                    message = errors.map((obj) => obj.message).join(', ')
                }
                this._snackbarService.openSnackBar(message ?? GlobalConstants.genericError, GlobalConstants.error);
                this.isLoading = false;
            }
        });
    }

    // Change to password form
    changeToPassword(): void {
        this.isOtpForm = [false, true, false];
    }


    // Change to OTP form
    changeToOtp(): void {
        this.isOtpForm = [true, false, false];
    }


    // Change to 2FA form
    changeTo2fa(): void {
        this.isOtpForm = [false, false, true];
    }


    // Verify OTP code
    verify(): void {
        this.isLoading = true;

        // Prepare credentials for verification
        const credentials = {
            username: this.phone,
            otp: this.otpCode
        };

        this._authService.verifyOtp(credentials).subscribe({
            next: (_response) => {
                this.isLoading = false;
                this.clearAllInput(); // Assuming this clears the input fields
                this._router.navigateByUrl('');
                this._snackbarService.openSnackBar("Login Successfully", GlobalConstants.success);
            },
            error: (err: HttpErrorResponse) => {
                const errors: { field: string, message: string }[] | undefined = err.error.errors;
                let message: string = err.error.message;

                // Construct the error message if multiple errors exist
                if (errors && errors.length > 0) {
                    message = errors.map((obj) => obj.message).join(', ');
                }
                this._snackbarService.openSnackBar(message ?? GlobalConstants.genericError, GlobalConstants.error);
                this.isLoading = false;
            }
        });
    }

    // 2FA verification
    showAlert: boolean = false;
    signIn(): void {
        this.showAlert = false; // Hide previous alert
        this.isLoading = true;
        this.passwordForm.disable(); // Disable the form during request

        this._authService.signIn(this.passwordForm.value).subscribe({
            next: () => {
                this._router.navigateByUrl(''); // Navigate to home on success
            },
            error: (err) => {
                // Re-enable the form
                this.passwordForm.enable();
                // Set the alert
                this.alert = {
                    type: 'error',
                    message: err.error?.message || 'Wrong Phone numeber or password',
                };

                this.isLoading = false;
                // Show the alert
                this.showAlert = true;
            }
        })
    }

    // Clear all input fields
    clearAllInput() {
        this.numStr1 = '';
        this.numStr2 = '';
        this.numStr3 = '';
        this.numStr4 = '';
        this.numStr5 = '';
        this.numStr6 = '';
    }


    // Listen for keydown event on the document
    keyDownHandler1(event: KeyboardEvent | any): void {
        if (event.key === 'Backspace') {
            this.numStr1 = '';
            this.checkValid();
            event.preventDefault();
        } else if (event.key === 'Tab') {
            event.preventDefault();
        } else {
            var keyCode = event.which || event.keyCode;

            if (keyCode !== 46 && keyCode > 31 && (keyCode < 48 || keyCode > 57)) {
                if (this.numStr1 !== '') {
                    this.input2.nativeElement.focus();
                }
                event.preventDefault();
            } else {
                const array = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

                if (array.includes(event.key)) {
                    this.numStr1 = event.key;
                    if (!this.checkValid()) {
                        this.input2.nativeElement.focus();
                    } else {
                        this.input1.nativeElement.blur();
                    }
                    event.preventDefault();
                } else {
                    // Prevent input of non-English numbers (Khmer numbers)
                    event.preventDefault();
                }
            }
        }

    }

    // Listen for keydown event on the document
    keyDownHandler2(event: KeyboardEvent | any): void {
        if (event.key === 'Backspace') {
            if (this.numStr2 === '') {
                this.input1.nativeElement.focus();
            }
            this.numStr2 = '';
            this.checkValid();
            event.preventDefault();
        } else if (event.key === 'Tab') {
            event.preventDefault();
        } else {
            var keyCode = event.which || event.keyCode;

            if (keyCode !== 46 && keyCode > 31 && (keyCode < 48 || keyCode > 57)) {
                if (this.numStr2 !== '') {
                    this.input3.nativeElement.focus();
                }
                event.preventDefault();
            } else {
                const array = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

                if (array.includes(event.key)) {
                    this.numStr2 = event.key;
                    if (!this.checkValid()) {
                        this.input3.nativeElement.focus();
                    } else {
                        this.input2.nativeElement.blur();
                    }
                    event.preventDefault();
                } else {
                    // Prevent input of non-English numbers (Khmer numbers)
                    event.preventDefault();
                }
            }
        }
    }

    // Listen for keydown event on the document
    keyDownHandler3(event: KeyboardEvent | any): void {
        if (this.numStr3 === '') {
            this.input2.nativeElement.focus();
        }
        if (event.key === 'Backspace') {
            this.numStr3 = '';
            this.checkValid();
            event.preventDefault();
        } else if (event.key === 'Tab') {
            event.preventDefault();
        } else {
            var keyCode = event.which || event.keyCode;

            if (keyCode !== 46 && keyCode > 31 && (keyCode < 48 || keyCode > 57)) {
                if (this.numStr3 !== '') {
                    this.input4.nativeElement.focus();
                }
                event.preventDefault();
            } else {
                const array = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

                if (array.includes(event.key)) {
                    this.numStr3 = event.key;
                    if (!this.checkValid()) {
                        this.input4.nativeElement.focus();
                    } else {
                        this.input3.nativeElement.blur();
                    }
                    event.preventDefault();
                } else {
                    // Prevent input of non-English numbers (Khmer numbers)
                    event.preventDefault();
                }
            }
        }
    }

    // Listen for keydown event on the document
    keyDownHandler4(event: KeyboardEvent | any): void {
        if (event.key === 'Backspace') {
            if (this.numStr4 === '') {
                this.input3.nativeElement.focus();
            }
            this.numStr4 = '';
            this.checkValid();
            event.preventDefault();
        } else if (event.key === 'Tab') {
            event.preventDefault();
        } else {
            var keyCode = event.which || event.keyCode;

            if (keyCode !== 46 && keyCode > 31 && (keyCode < 48 || keyCode > 57)) {
                if (this.numStr4 !== '') {
                    this.input5.nativeElement.focus();
                }
                event.preventDefault();
            } else {
                const array = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

                if (array.includes(event.key)) {
                    this.numStr4 = event.key;
                    if (!this.checkValid()) {
                        this.input5.nativeElement.focus();
                    } else {
                        this.input4.nativeElement.blur();
                    }
                    event.preventDefault();
                } else {
                    // Prevent input of non-English numbers (Khmer numbers)
                    event.preventDefault();
                }
            }
        }
    }

    // Listen for keydown event on the document
    keyDownHandler5(event: KeyboardEvent | any): void {
        if (event.key === 'Backspace') {
            if (this.numStr5 === '') {
                this.input4.nativeElement.focus();
            }
            this.numStr5 = '';
            this.checkValid();
            event.preventDefault();
        } else if (event.key === 'Tab') {
            event.preventDefault();
        } else {
            var keyCode = event.which || event.keyCode;

            if (keyCode !== 46 && keyCode > 31 && (keyCode < 48 || keyCode > 57)) {
                if (this.numStr5 !== '') {
                    this.input6.nativeElement.focus();
                }
                event.preventDefault();
            } else {
                const array = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

                if (array.includes(event.key)) {
                    this.numStr5 = event.key;
                    if (!this.checkValid()) {
                        this.input6.nativeElement.focus();
                    } else {
                        this.input5.nativeElement.blur();
                    }
                    event.preventDefault();
                } else {
                    // Prevent input of non-English numbers (Khmer numbers)
                    event.preventDefault();
                }
            }
        }
    }

    // Listen for keyup event on the document
    keyDownHandler6(event: KeyboardEvent | any): void {
        if (event.key === 'Backspace') {
            if (this.numStr6 === '') {
                this.input5.nativeElement.focus();
            }
            this.numStr6 = '';
            this.checkValid();
            event.preventDefault();
        } else if (event.key === 'Tab') {
            event.preventDefault();
        } else {
            var keyCode = event.which || event.keyCode;

            if (keyCode !== 46 && keyCode > 31 && (keyCode < 48 || keyCode > 57)) {
                event.preventDefault();
            } else {
                const array = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

                if (array.includes(event.key)) {
                    this.numStr6 = event.key;
                    if (this.checkValid()) {
                        this.input6.nativeElement.blur();
                    }
                    event.preventDefault();
                } else {
                    // Prevent input of non-English numbers (Khmer numbers)
                    event.preventDefault();
                }
            }
        }
    }

    // Listen for keyup event on the document
    @HostListener('document:keyup', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if (event.key === 'Enter' && this.numStr6 !== '') {
            if (this.checkValid()) {
                this.input6.nativeElement.blur();
                this.verify();
            }
            event.preventDefault();
        }
    }

    // Check if the OTP code is valid
    checkValid(): boolean {
        this.otpCode = this.numStr1 + this.numStr2 + this.numStr3 + this.numStr4 + this.numStr5 + this.numStr6;
        this.canSubmit = this.otpCode.length === 6;
        return this.canSubmit;
    }

    // Unsubscribe from all subscriptions
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
