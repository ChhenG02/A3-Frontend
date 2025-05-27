import { Routes } from '@angular/router';
import { DashboardComponent } from './a1-dashboard/component';

import { SaleComponent } from './a2-sale/component';

import { UserComponent } from './a5-user/u1-listing/component';
import { ProductComponent } from './a3-product/component';
import { SetupLayoutComponent } from './a6-setup/component';
import { ProductTypeComponent } from './a6-setup/s1-type/component';

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

    //  {
    //     path: 'stock',
    //     component: StockComponent,
    // },

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
        ],
    },
] as Routes;
