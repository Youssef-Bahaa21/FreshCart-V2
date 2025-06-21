import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { BrandsService } from '../../core/services/brands/brands.service';
import { Ibrand } from '../../shared/interfaces/ibrand';
import { Iproduct } from '../../shared/interfaces/iproduct';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { CartService } from '../../core/services/cart/cart.service';
import { WishlistService } from '../../core/services/wishlist/wishlist.service';

@Component({
  selector: 'app-brands',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CurrencyPipe],
  templateUrl: './brands.component.html',
  styleUrl: './brands.component.css'
})
export class BrandsComponent implements OnInit {
  // Dependency injection
  private readonly brandsService = inject(BrandsService);
  private readonly router = inject(Router);
  private readonly toastrService = inject(ToastrService);
  private readonly cartService = inject(CartService);
  private readonly wishlistService = inject(WishlistService);

  // State management
  brands: Ibrand[] = [];
  selectedBrand: Ibrand | null = null;
  brandProducts: Iproduct[] = [];
  isLoading = signal(false);
  isProductsLoading = signal(false);
  loadingStates = new Map<string, boolean>();
  wishlistLoadingStates = new Map<string, boolean>();

  // Screen size detection
  isMobile = window.innerWidth < 768;
  isSmallScreen = window.innerWidth < 992;

  // Pagination
  currentPage = 1;
  totalPages = 1;
  itemsPerPage = this.calculateItemsPerPage();

  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 768;
    this.isSmallScreen = window.innerWidth < 992;
    const newItemsPerPage = this.calculateItemsPerPage();

    // Only reload if items per page changed
    if (newItemsPerPage !== this.itemsPerPage) {
      this.itemsPerPage = newItemsPerPage;
      this.updatePagination();
    }
  }

  private calculateItemsPerPage(): number {
    if (window.innerWidth < 480) {
      return 6; // Extra small devices
    } else if (window.innerWidth < 768) {
      return 8; // Small devices
    } else if (window.innerWidth < 992) {
      return 12; // Medium devices
    } else {
      return 16; // Large devices
    }
  }

  ngOnInit(): void {
    this.getBrandsData();
  }

  // Get all brands
  getBrandsData(): void {
    this.isLoading.set(true);

    this.brandsService.getAllBrands().subscribe({
      next: (res) => {
        this.brands = res.data;
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching brands:', err);
        this.toastrService.error('Could not load brands', 'Error');
        this.isLoading.set(false);
      }
    });
  }

  // Handle brand selection
  selectBrand(brand: Ibrand): void {
    this.selectedBrand = brand;
    this.currentPage = 1;
    this.loadBrandProducts(brand._id);
  }

  // Load products for a selected brand
  loadBrandProducts(brandId: string): void {
    this.isProductsLoading.set(true);

    this.brandsService.getProductsByBrand(brandId).subscribe({
      next: (res) => {
        this.brandProducts = res.data;
        this.updatePagination();
        this.isProductsLoading.set(false);

        // When products load, scroll to products section if mobile
        if (this.isMobile && this.brandProducts.length > 0) {
          setTimeout(() => {
            const productsContainer = document.querySelector('.products-container');
            if (productsContainer) {
              productsContainer.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });
            }
          }, 100);
        }
      },
      error: (err) => {
        console.error('Error fetching brand products:', err);
        this.toastrService.error('Could not load products for this brand', 'Error');
        this.isProductsLoading.set(false);
      }
    });
  }

  // Add product to cart
  addToCart(id: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    if (this.loadingStates.get(id)) return;

    this.loadingStates.set(id, true);
    this.toastrService.info('Adding product to cart...', 'Please wait');

    this.cartService.addProductToCart(id).subscribe({
      next: (res) => {
        if (res.status === "success") {
          this.toastrService.success(res.message, "FreshCart");
        }
        this.loadingStates.set(id, false);
      },
      error: (err) => {
        console.error('Error adding to cart:', err);
        this.toastrService.error('Could not add to cart', 'Error');
        this.loadingStates.set(id, false);
      }
    });
  }

  // Add product to wishlist
  addToWishlist(id: string) {
    if (this.wishlistLoadingStates.get(id)) return;

    this.wishlistLoadingStates.set(id, true);
    this.toastrService.info('Adding product to wishlist...', 'Please wait');

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

  // Navigate to product details
  goToProductDetails(productId: string): void {
    this.router.navigate(['/details', productId]);
  }

  // Update pagination based on current items per page
  private updatePagination(): void {
    this.totalPages = Math.ceil(this.brandProducts.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || !this.selectedBrand) {
      return;
    }

    this.loadBrandProducts(this.selectedBrand._id);
  }

  // Generate array for pagination buttons
  getPaginationArray(): number[] {
    const pages: number[] = [];

    // Adjust number of visible pages for small screens
    const maxVisiblePages = this.isMobile ? 3 : this.isSmallScreen ? 4 : 5;

    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

      if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  // Get current page items based on pagination
  getCurrentPageItems(): Iproduct[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.brandProducts.slice(startIndex, startIndex + this.itemsPerPage);
  }

  // Change current page
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // Generate page array for pagination
  pageArray(): number[] {
    // Adjust number of visible pages for small screens
    const maxVisiblePages = this.isMobile ? 3 : this.isSmallScreen ? 4 : 5;

    if (this.totalPages <= maxVisiblePages) {
      return Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }

    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  }
}
