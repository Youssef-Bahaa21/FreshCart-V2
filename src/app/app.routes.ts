import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { loggedGuard } from './core/guards/logged.guard';
import { ForgetpasswordComponent } from './core/services/components/forgetpassword/forgetpassword.component';

export const routes: Routes = [
    {
        path: '', redirectTo: 'home', pathMatch: 'full'
    },
    {
        path: 'login',
        loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
        canActivate: [loggedGuard]
    },
    {
        path: 'register',
        loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent),
        canActivate: [loggedGuard]
    },
    {
        path: 'forget',
        component: ForgetpasswordComponent,
        canActivate: [loggedGuard]
    },
    {
        path: 'home',
        loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
        title: 'home',
        canActivate: [authGuard]
    },
    {
        path: 'cart',
        loadComponent: () => import('./pages/cart/cart.component').then(m => m.CartComponent),
        title: 'cart'
    },
    {
        path: 'wishlist',
        loadComponent: () => import('./pages/wishlist/wishlist.component').then(m => m.WishlistComponent),
        title: 'wishlist'
    },
    {
        path: 'products',
        loadComponent: () => import('./pages/products/products.component').then(m => m.ProductsComponent),
        title: 'products'
    },
    {
        path: 'brands',
        loadComponent: () => import('./pages/brands/brands.component').then(m => m.BrandsComponent),
        title: 'brands'
    },
    {
        path: 'categories',
        loadComponent: () => import('./pages/categories/categories.component').then(m => m.CategoriesComponent),
        title: 'categories'
    },
    {
        path: 'addresses',
        loadComponent: () => import('./pages/addresses/addresses.component').then(m => m.AddressesComponent),
        title: 'addresses',
        canActivate: [authGuard]
    },
    {
        path: 'checkout/:id',
        loadComponent: () => import('./pages/checkout/checkout.component').then(m => m.CheckoutComponent),
        title: 'checkout',
        canActivate: [authGuard],
        data: { ssr: false }
    },
    {
        path: 'details/:id',
        loadComponent: () => import('./pages/productDetail/productDetails.component').then(m => m.ProductDetailsComponent),
        title: 'details'
    },
    {
        path: 'allorders',
        loadComponent: () => import('./pages/allorders/allorders.component').then(m => m.AllordersComponent)
    },
    {
        path: '**',
        loadComponent: () => import('./pages/notfound/notfound.component').then(m => m.NotfoundComponent)
    }
];
