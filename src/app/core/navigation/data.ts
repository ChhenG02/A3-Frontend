import { HelperNavigationItem } from 'helper/components/navigation';

const adminNavigation: HelperNavigationItem[] = [
    {
        id: 'dashboard',
        title: 'ផ្ទាំងព័ត៌មាន',
        type: 'basic',
        icon: 'mdi:view-dashboard-outline',
        link: '/admin/dashboard',
    },
    {
        id: 'pos',
        title: 'ការលក់',
        type: 'basic',
        icon: 'mdi:cart-outline',
        link: '/admin/pos',
    },
    {
        id: 'product',
        title: 'ផលិតផល',
        type: 'basic',
        icon: 'mdi:package-variant-closed',
        link: '/admin/product/all',
    },
    {
        id: 'stock',
        title: 'ឃ្លាំង',
        type: 'basic',
        icon: 'mdi:file-check-outline',
        link: '/admin/stock',
    },
    {
        id: 'users',
        title: 'អ្នកប្រើប្រាស់',
        type: 'basic',
        icon: 'mdi:account-group-outline',
        link: '/admin/users',
    },
    {
        id: 'account',
        title: 'គណនី',
        type: 'basic',
        icon: 'mdi:account-circle-outline',
        link: '/profile',
    },
    {
        id: 'setting',
        title: 'ការកំណត់',
        type: 'basic',
        icon: 'mdi:cog',
        link: '/setting',
    },
];

const userNavigation: HelperNavigationItem[] = [
    {
        id: 'order',
        title: 'ការបញ្ជាទិញ',
        type: 'basic',
        icon: 'mdi:monitor',
        link: '/cashier/order',
    },
    {
        id: 'pos',
        title: 'ការលក់',
        type: 'basic',
        icon: 'mdi:cart-outline',
        link: '/cashier/pos',
    },
    {
        id: 'account',
        title: 'គណនី',
        type: 'basic',
        icon: 'mdi:account-circle-outline',
        link: '/profile',
    },
];

export const navigationData = {
    admin: adminNavigation,
    user: userNavigation
}
