// core library
import { NgIf } from '@angular/common';
import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import {
    FormsModule,
    NgForm,
    ReactiveFormsModule,
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { MatButtonModule }      from '@angular/material/button';
import { MatCheckboxModule }    from '@angular/material/checkbox';
import { MatFormFieldModule }   from '@angular/material/form-field';
import { MatIconModule }        from '@angular/material/icon';
import { MatInputModule }       from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink }       from '@angular/router';
import { helperAnimations }         from 'helper/animations';

// custom library
import { AuthService }          from 'app/core/auth/service';
import { LanguagesComponent }   from 'app/layout/common/languages/component';
import { HelperAlertComponent, HelperAlertType } from 'helper/components/alert';
import { SnackbarService }      from 'helper/services/snack-bar/snack-bar.service';
import GlobalConstants          from 'helper/shared/constants';
import { VerifyOTPAndPasswordComponent } from './verify-otp-password/component';
import { AuthSignUpComponent }  from './sign-up/component';

@Component({
    selector: 'auth-login',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: helperAnimations,
    standalone: true,
    imports: [
        RouterLink,
        HelperAlertComponent,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
        LanguagesComponent,
        NgIf,
        VerifyOTPAndPasswordComponent,
        AuthSignUpComponent,
    ],
})
export class AuthSignInComponent implements OnInit {
    @ViewChild('signInNgForm') signInNgForm: NgForm;

    // alert message
    alert: { type: HelperAlertType; message: string } = {
        type: 'success',
        message: '',
    };

    // Images for the slider
    images: string[] = [
        'images/apps/pos1.png',
        'images/apps/pos1.png',
        'images/apps/pos1.png',
    ];
    // variables for the image slider
    currentImage: string = this.images[0];
    imageIndex: number = 0;
    interval: any;
    signInForm: UntypedFormGroup;
    showAlert: boolean = false;
    isLoading: boolean = false

    /**
     * Constructor
     */
    constructor(
        private _authService: AuthService,
        private _formBuilder: UntypedFormBuilder,
        private _router: Router,
        private _snackbarService: SnackbarService,
    ) { }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the form
        this.signInForm = this._formBuilder.group({
            username: ['0889566929', [Validators.required, Validators.pattern('^0[0-9]{8,9}$')]],
            password: ['123456', Validators.required]
        });
        this.startImageSlider();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------
    toPhone() {
        this.isChangeToVerifyOtp = false;
        this.changeToSignUp = false;
    }
    goToOtpVerify(): void {
        this.isChangeToVerifyOtp = true;
        this.changeToSignUp = false;
      }
    isChangeToVerifyOtp: boolean = false;
    checkExistUser() {
        // Return if the form is invalid
        if (this.signInForm.invalid) {
            return;
        }

        // Disable the form
        this.signInForm.disable();

        // Call the service to check if the user exists
        this._authService.checkExistUser(this.signInForm.value).subscribe({
            next: (res) => {
                if (res.data) {
                    console.log("User exists, sending OTP");
                    this.isChangeToVerifyOtp = true;

                    // Store phone number in local storage
                    localStorage.setItem('phone', this.signInForm.value.username);

                    // Send OTP to the user
                    this._authService.sendOtp({ username: this.signInForm.value.username }).subscribe({
                        next: (otpResponse) => {
                            this._snackbarService.openSnackBar(otpResponse.message, GlobalConstants.success);
                        },
                        error: (otpError) => {
                            this._snackbarService.openSnackBar(otpError.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);
                        }
                    });

                } else {
                    this.isChangeToVerifyOtp = false;
                    localStorage.removeItem('phone');
                    this._snackbarService.openSnackBar('អ្នកប្រើប្រាស់មិនមាននៅក្នុងប្រព័ន្ធទេ', GlobalConstants.error);
                }
                // Re-enable the form after processing
                this.signInForm.enable();
            },
            error: (err) => {
                // Handle any errors
                this.signInForm.enable(); // Re-enable the form
                this.signInNgForm.resetForm(); // Reset the form
                this._snackbarService.openSnackBar(err.error?.message ?? GlobalConstants.genericError, GlobalConstants.error);
                this.showAlert = true;
            }
        });
    }

    /**
     * Sign in
    */

    signIn(): void {
        // Return if the form is invalid
        if (this.signInForm.invalid) {
            return;
        }

        // Disable the form
        this.signInForm.disable();

        // Hide the alert
        this.showAlert = false;

        // Sign in
        this._authService.signIn(this.signInForm.value).subscribe({
            next: res => {
                // Navigate to the redirect url
                this._router.navigateByUrl('');
            },
            error: err => {
                // Re-enable the form
                this.signInForm.enable();

                // Reset the form
                this.signInNgForm.resetForm();

                // Set the alert
                this.alert = {
                    type: 'error',
                    message: err.error?.message || 'Wrong Phone numeber or password',
                };

                // Show the alert
                this.showAlert = true;
            }
        });
    }

    /**
     * Sign up
    */
    signUp() {
        this.changeToSignUp = true;
        this.isChangeToVerifyOtp = false;
    }
    changeToSignUp: boolean = false;

    // image slider function
    startImageSlider() {
        this.interval = setInterval(() => {
            this.imageIndex = (this.imageIndex + 1) % this.images.length;
            this.currentImage = this.images[this.imageIndex];
        }, 100000); // 100000 milliseconds = 100 seconds
    }

    // Clear the interval when the component is destroyed
    ngOnDestroy() {
        // Clear the interval when the component is destroyed to prevent memory leaks
        if (this.interval) {
            clearInterval(this.interval);
        }
    }
}
