import { Routes } from '@angular/router';
import { SetupLayoutComponent } from './component';
import { ProductTypeComponent } from './s1-type/component';

import { StockStatusComponent } from './s3-stock-status/component';
import { PromotionComponent } from './s2-promotion/component';


export default [
    {
        path: '',
        component: SetupLayoutComponent,
        children: [
            { path: '', pathMatch: 'full', redirectTo: 'products/types' },
            {
                path: 'products/types',
                component: ProductTypeComponent
            },
              {
                path: 'promotions',
                component: PromotionComponent
            },
              {
                path: 'stock-status',
                component: StockStatusComponent
            },
        ]

    },
] as Routes;
