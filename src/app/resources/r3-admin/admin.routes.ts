import { Routes } from '@angular/router';
import { DashboardComponent } from './a1-dashboard/component';

import { SaleComponent } from './a2-sale/component';

import { UserComponent } from './a5-user/u1-listing/component';
import { ProductComponent } from './a3-product/product.component';
import { SetupLayoutComponent } from './a6-setup/component';
import { ProductTypeComponent } from './a6-setup/s1-type/component';

import { StockStatusComponent } from './a6-setup/s3-stock-status/component';
import { PromotionComponent } from './a6-setup/s2-promotion/component';
import { StockComponent } from './a4-stock/stock.component';

export default [
    {
        path: 'dashboard',
        component: DashboardComponent,
    },
    {
        path: 'pos',
        component: SaleComponent,
    },
    {
        path: 'products',
        component: ProductComponent,
    },

     {
        path: 'stocks',
        component: StockComponent,
    },

    {
        path: 'users',
        component: UserComponent,
    },
    {
        path: 'settings',
        component: SetupLayoutComponent,
        children: [
            { path: '', pathMatch: 'full', redirectTo: 'products/types' },
            {
                path: 'products/types',
                component: ProductTypeComponent,
            },

             {
                path: 'promotion',
                component: PromotionComponent,
            },

             {
                path: 'stock-status',
                component: StockStatusComponent,
            },
        ],
    },
] as Routes;
