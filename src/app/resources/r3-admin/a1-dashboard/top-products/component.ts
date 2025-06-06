// src/app/resources/r3-admin/a1-dashboard/top-products/component.ts
import { Component } from '@angular/core';

export interface Product {
  id: number;
  name: string;
  sales: number;
  revenue: number;
  image: string;
}

@Component({
  selector: 'top-products',
  standalone: true,
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class TopProductsComponent {
  products: Product[] = [
    {
      id: 1,
      name: 'Cyberpunk 2077',
      sales: 400,
      revenue: 60000,
      image: 'assets/images/cyberpunk2077.jpg',
    },
    {
      id: 2,
      name: 'STRAY',
      sales: 350,
      revenue: 45000,
      image: 'assets/images/stray.jpg',
    },
    {
      id: 3,
      name: 'Elden Ring',
      sales: 300,
      revenue: 40940,
      image: 'assets/images/eldenring.jpg',
    },
    {
      id: 4,
      name: 'Forza Horizon 5',
      sales: 100,
      revenue: 10000,
      image: 'assets/images/forzahorizon5.jpg',
    },
    {
      id: 5,
      name: 'God Of War',
      sales: 50,
      revenue: 5000,
      image: 'assets/images/godofwar.jpg',
    },
  ];

  constructor() {}

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatSales(sales: number): string {
    return `${sales} sales`;
  }

  onViewAll(): void {
    console.log('View all products clicked');
  }

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }

  onImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/images/fallback.jpg'; // Replace with your fallback image path
  }
}