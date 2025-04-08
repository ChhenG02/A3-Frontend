import { Routes } from "@angular/router";
import { DashboardComponent } from "./a1-dashboard/component";

import { ProductTypeComponent } from "./a3-product/p2-type/component";
import { SaleComponent } from "./a2-sale/component";
import { UserComponent } from "./a4-user/u1-listing/component";
import { ProductComponent } from "./a3-product/p1-product/component";

export default [
    {
        path: 'dashboard',
        component: DashboardComponent
    },
    {
        path: 'pos',
        component: SaleComponent
    },
    {
        path: 'product',
        children: [
            {
                path: 'all',
                component: ProductComponent
            },
            {
                path: 'type',
                component: ProductTypeComponent
            },
        ]
    },
    {
        path: 'users',
        component: UserComponent
    },

] as Routes;
