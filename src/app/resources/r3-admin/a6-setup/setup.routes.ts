import { Routes } from '@angular/router';
import { SetupLayoutComponent } from './component';
import { ProductTypeComponent } from './s1-type/component';


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
        ]

    },
] as Routes;
