import { ProductsService } from './../../core/services/products/products.service';
import { Component, inject, OnInit, signal, HostListener } from '@angular/core';
import { Iproduct } from '../../shared/interfaces/iproduct';
import { CategoriesService } from '../../core/services/categories/categories.service';
import { CarouselModule, OwlOptions } from 'ngx-owl-carousel-o';
import { Icategory } from '../../shared/interfaces/icategory';
import { CurrencyPipe, UpperCasePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart/cart.service';
import { WishlistService } from '../../core/services/wishlist/wishlist.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: true,
  imports: [CarouselModule, UpperCasePipe, CurrencyPipe, RouterLink]
})
export class HomeComponent implements OnInit {
  private readonly categoryService = inject(CategoriesService)
  private readonly productsService = inject(ProductsService)
  private readonly cartService = inject(CartService)
  private readonly wishlistService = inject(WishlistService)
  private readonly toastrService = inject(ToastrService)
  private readonly router = inject(Router)

  products: Iproduct[] = []
  categories: Icategory[] = []
  loadingStates = new Map<string, boolean>() // For cart loading states
  wishlistLoadingStates = new Map<string, boolean>() // For wishlist loading states
  isMobile: boolean = false;

  // Featured Categories - can be dynamically determined later
  featuredCategories: string[] = []

  customMainSlider: OwlOptions = {
    loop: true,
    mouseDrag: true,
    touchDrag: true,
    pullDrag: false,
    dots: true,
    navSpeed: 700,
    navText: ['<i class="fas fa-chevron-left"></i>', '<i class="fas fa-chevron-right"></i>'],
    items: 1,
    autoplayTimeout: 4000,
    autoplay: true,
    animateOut: 'fadeOut',
    nav: false,
    responsive: {
      0: {
        nav: false,
        dots: true,
        autoplay: true
      },
      768: {
        nav: false
      }
    }
  }

  customOptions: OwlOptions = {
    loop: true,
    mouseDrag: true,
    touchDrag: true,
    pullDrag: false,
    dots: true,
    autoplay: true,
    autoplayHoverPause: true,
    autoplayTimeout: 3000,
    navSpeed: 700,
    navText: ['<i class="fas fa-angle-left"></i>', '<i class="fas fa-angle-right"></i>'],
    responsive: {
      0: {
        items: 2,
        dots: true,
        nav: false
      },
      576: {
        items: 3
      },
      768: {
        items: 4
      },
      992: {
        items: 5,
        nav: false
      }
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
  }

  getProductsData() {
    this.productsService.getAllProducts().subscribe({
      next: (res) => {
        this.products = res.data
      },
      error: (err) => {
        console.error('Error fetching products:', err);
        this.toastrService.error('Could not load products', 'Error');
      }
    })
  }

  getCategoriesData() {
    this.categoryService.getAllCategories().subscribe({
      next: (res) => {
        this.categories = res.data
      },
      error: (err) => {
        console.error('Error fetching categories:', err);
        this.toastrService.error('Could not load categories', 'Error');
      }
    })
  }

  navigateToCategory(category: Icategory) {
    // Store selected category in session storage to be retrieved by the categories component
    sessionStorage.setItem('selectedCategoryId', category._id);
    this.router.navigate(['/categories']);
  }

  addToCart(id: string) {
    this.loadingStates.set(id, true);
    this.toastrService.info('Adding to cart...', 'FreshCart');

    this.cartService.addProductToCart(id).subscribe({
      next: (res) => {
        if (res.status == "success") {
          this.toastrService.success(res.message, "FreshCart");
        }
        this.loadingStates.set(id, false);
      },
      error: (err) => {
        console.error('Error adding to cart:', err);
        this.toastrService.error('Could not add to cart', 'Error');
        this.loadingStates.set(id, false);
      }
    })
  }

  addToWishlist(id: string) {
    this.wishlistLoadingStates.set(id, true);
    this.toastrService.info('Adding to wishlist...', 'FreshCart');

    this.wishlistService.addProductToWishlist(id).subscribe({
      next: (res) => {
        if (res.status === "success") {
          this.toastrService.success(res.message, "FreshCart");
        }
        this.wishlistLoadingStates.set(id, false);
      },
      error: (err) => {
        console.error('Error adding to wishlist:', err);
        this.toastrService.error('Could not add to wishlist', 'Error');
        this.wishlistLoadingStates.set(id, false);
      }
    });
  }

  ngOnInit(): void {
    this.getProductsData()
    this.getCategoriesData()
    this.checkScreenSize()
  }
}

