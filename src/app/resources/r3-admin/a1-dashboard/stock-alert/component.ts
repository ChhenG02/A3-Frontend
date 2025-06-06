import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StockItem {
  name: string;
  status: 'out-of-stock' | 'low-stock';
  quantity?: number;
}

@Component({
  selector: 'app-stock-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './template.html',
  styleUrl: './style.scss',
})
export class StockAlertComponent {
  stockItems: StockItem[] = [
    { name: 'Cyberpunk 20277', status: 'out-of-stock' },
    { name: 'The Last of Us', status: 'low-stock', quantity: 3 },
    { name: 'Elden Ring', status: 'low-stock', quantity: 5 }
  ];

  get outOfStockCount(): number {
    return this.stockItems.filter(item => item.status === 'out-of-stock').length;
  }

  get lowStockCount(): number {
    return this.stockItems.filter(item => item.status === 'low-stock').length;
  }

  onViewOutOfStock(): void {
    console.log('View out of stock items');
    // Add your navigation logic here
  }

  onViewLowStock(): void {
    console.log('View low stock items');
    // Add your navigation logic here
  }
}