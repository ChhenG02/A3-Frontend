// ================================================================================>> Main Library
import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';

// ================================================================================>> Third Party Library
// Material
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// ================================================================================>> Custom Library
// Ng
import { PdfViewerModule } from 'ng2-pdf-viewer';

@Component({
    selector: 'helpers-pdf-viewer',
    standalone: true,
    templateUrl: './pdf-viewer.component.html',
    styleUrls: ['./pdf-viewer.component.scss'],
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        PdfViewerModule,
        MatDialogModule,
        MatInputModule,
        MatProgressSpinnerModule
    ]
})
export class HeplersPdfViewerComponent {

    constructor(@Inject(MAT_DIALOG_DATA) public file: { url: string, title: string }) { }

    currentPage = 1;
    totalPages: number;
    zoom = 1; // Default zoom level
    normalZoom = 1; // Normal or default zoom level
    highZoom = 2; // Higher zoom level for toggling in
    isLoading = true; // Loading state

    afterLoadComplete(pdfData: any): void {
        this.totalPages = pdfData.numPages;
        this.isLoading = false; // Hide the loading spinner
    }

    validateInput(event: any): void {
        // Allow numbers only, remove non-digit characters
        const input = event.target;
        const initialLength = input.value.length;
        input.value = input.value.replace(/[^0-9]/g, '');
        if (input.value.length !== initialLength) {
            event.preventDefault();
        }
    }

    goToPage(): void {
        this.currentPage = Math.min(Math.max(1, this.currentPage), this.totalPages); // Ensures the page number is within valid range
    }

    zoomIn(): void {
        this.zoom *= 1.1;
    }

    zoomOut(): void {
        this.zoom /= 1.1;
    }

    zoomToggle(): void {
        if (this.zoom !== this.normalZoom) {
            this.zoom = this.normalZoom; // Reset to normal zoom
        } else {
            this.zoom = this.highZoom; // Toggle to higher zoom
        }
    }

    downloadPDF(): void {
        // Create a link and trigger the download
        const link = document.createElement('a');
        link.href = this.file.url;
        link.download = this.file.title;  // You might want to use a specific file name
        link.click();
    }

    printPDF(): void {
        // Open the PDF in a new window and invoke the print dialog
        const win = window.open(this.file.url, '_blank');
        win.onload = () => {
            win.print();
        };
    }

}
