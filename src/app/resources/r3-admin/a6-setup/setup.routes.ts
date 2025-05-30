import { Routes } from '@angular/router';
import { SetupLayoutComponent } from './component';
import { ProductTypeComponent } from './s1-type/component';
import { promotionComponent } from './s2-promotion/component';
import { StockStatusComponent } from './s3-stock-status/component';


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
                component: promotionComponent
            },
              {
                path: 'stock-status',
                component: StockStatusComponent
            },
        ]

    },
] as Routes;
