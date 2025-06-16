// ================================================================>> Core Library (Angular)
import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

// ================================================================>> Third-Party Libraries
import { MatIconModule } from '@angular/material/icon';

// ================================================================>> Custom Libraries (Application-specific)
import { env } from 'envs/env';
import { Product } from '../order.interface';

@Component({
    selector: 'product-item',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [CommonModule, MatIconModule, DecimalPipe],
})
export class ItemComponent {
    @Input() data: Product;
    @Output() result = new EventEmitter<Product>();
    public fileUrl: string = env.FILE_BASE_URL;

    // ===> Method to emit the data to the parent component
    onOutput() {
        this.result.emit(this.data);
    }


     parseDiscount(discount: string | number | undefined): number {
        if (!discount) return 0;
        if (typeof discount === 'number') return discount;
        return parseFloat(discount) || 0;
    }

    // Calculate discounted price based on unit price and discount
    calculateDiscountPrice(product: Product): number {
        const discount = this.parseDiscount(product.discount);
        if (discount <= 0 || !product.promotion_id) {
            return product.unit_price;
        }
        return product.unit_price * (1 - discount / 100);
    }
}
