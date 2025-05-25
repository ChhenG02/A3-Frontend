import { Routes } from '@angular/router';
import { DashboardComponent } from './a1-dashboard/component';


import { SaleComponent } from './a2-sale/component';

import { UserComponent } from './a5-user/u1-listing/component';
import { ProductComponent } from './a3-product/component';
import { SetupLayoutComponent } from './a6-setup/component';
import { ProductTypeComponent } from './a6-setup/s1-type/component';

import { ProductTypeComponent } from "./a3-product/p2-type/component";
import { SaleComponent } from "./a2-sale/component";
import { UserComponent } from "./a5-user/u1-listing/component";
import { ProductComponent } from "./a3-product/p1-product/component";
import { ViewUserComponent } from "./a6-setting/u2-view/component";


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
        path: 'product',

        component: ProductComponent,

        children: [
            {
                path: 'all',
                component: ProductComponent
            },
        ]
    },
    {
        path: 'stock',
        children: [
            {
                path: 'all',
                component: ProductComponent
            },
        ]

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

    {
        path: 'setting',
        component: ViewUserComponent
    },

] as Routes;
