import { HelperNavigationItem } from 'helper/components/navigation';

const adminNavigation: HelperNavigationItem[] = [
    {
        id: 'dashboard',
        title: 'Dashboard',
        type: 'basic-parent',
        icon: 'mdi:view-dashboard',
        link: '/admin/dashboard',
    },
    {
        id: 'pos',
        title: 'Sale',
        type: 'basic-parent',
        icon: 'mdi:cart-outline',
        link: '/admin/pos',
    },
    {
        id: 'product',
        title: 'Product',
        type: 'basic-parent',
        icon: 'mdi:package-variant-closed',
        link: '/admin/products',
    },

    // {
    //     id: 'product',
    //     title: 'ផលិតផល',
    //     type: 'collapsable',
    //     icon: 'mdi:package-variant-closed',
    //     children: [
    //         {
    //             id: 'product.all',
    //             title: 'ទាំងអស់',
    //             type: 'basic',
    //             link: '/admin/product/all',
    //         },
    //         {
    //             id: 'product.type',
    //             title: 'ប្រភេទ',
    //             type: 'basic',
    //             link: '/admin/product/type',
    //         },
    //     ],
    // },
    {
        id: 'stock',
        title: 'Stock',
        type: 'basic-parent',
        icon: 'mdi:file-check-outline',
        link: '/admin/stock',
    },
    {
        id: 'users',
        title: 'User',
        type: 'basic-parent',
        icon: 'mdi:account-group-outline',
        link: '/admin/users',
    },
    {
        id: 'account',
        title: 'Account',
        type: 'basic-parent',
        icon: 'mdi:account-circle-outline',
        link: '/profile',
    },
    {
        id: 'Setting',
        title: 'Setting',
        type: 'basic-parent',
        icon: 'mdi:cog',
        link: '/admin/settings',
    },
];

const userNavigation: HelperNavigationItem[] = [
    {
        id: 'order',
        title: 'Menu',
        type: 'basic-parent',
        icon: 'mdi:monitor',
        link: '/cashier/order',
    },
    {
        id: 'pos',
        title: 'Sale',
        type: 'basic-parent',
        icon: 'mdi:cart-outline',
        link: '/cashier/pos',
    },
    {
        id: 'account',
        title: 'Account',
        type: 'basic-parent',
        icon: 'mdi:account-circle-outline',
        link: '/profile',
    },
];

export const navigationData = {
    admin: adminNavigation,
    user: userNavigation
}
