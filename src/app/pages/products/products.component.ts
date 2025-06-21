import { ProductsService } from './../../core/services/products/products.service';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Iproduct } from '../../shared/interfaces/iproduct';
import { Icategory } from '../../shared/interfaces/icategory';
import { CurrencyPipe, NgClass, NgFor, NgIf, UpperCasePipe, NgIf as ngIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart/cart.service';
import { WishlistService } from '../../core/services/wishlist/wishlist.service';
import { ToastrService } from 'ngx-toastr';
import { catchError, finalize, of } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [UpperCasePipe, RouterLink, CurrencyPipe, NgIf, FormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent implements OnInit {
  // Dependency injection
  private readonly productsService = inject(ProductsService);
  private readonly cartService = inject(CartService);
  private readonly wishlistService = inject(WishlistService);
  private readonly toastrService = inject(ToastrService);

  // State management
  products: Iproduct[] = [];
  filteredProducts: Iproduct[] = [];
  allProducts: Iproduct[] = []; // Store all products for filtering
  categories: Icategory[] = [];
  isLoading = signal(false);
  loadingStates = new Map<string, boolean>();
  wishlistLoadingStates = new Map<string, boolean>();
  wishlistedProducts = new Set<string>(); // Track products in wishlist by ID

  // Pagination
  currentPage = 1;
  totalPages = 1;
  itemsPerPage = 8; // Display 8 products per page

  // Filters
  searchQuery = '';
  sortBy = 'popularity';
  priceRange = { min: 0, max: 5000 };
  selectedCategories: string[] = [];

  // Method to get all products
  getProductsData() {
    this.isLoading.set(true);

    this.productsService.getAllProducts().pipe(
      catchError(err => {
        this.handleError('Failed to load products', err);
        return of({ data: [] });
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (res) => {
        this.allProducts = res.data;
        this.calculateTotalPages();
        this.applyFilters(); // This will handle pagination too
      }
    });
  }

  // Method to filter products based on search
  applyFilters() {
    // First filter based on search query
    if (!this.searchQuery.trim()) {
      this.products = [...this.allProducts];
    } else {
      const query = this.searchQuery.toLowerCase().trim();

      this.products = this.allProducts.filter(product => {
        return product.title.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.category.name.toLowerCase().includes(query);
      });
    }

    // Apply sorting 
    this.applySorting();

    // Set total pages based on filtered results
    this.calculateTotalPages();

    // Apply pagination after filtering and sorting
    this.applyPagination();
  }

  // Calculate total pages
  calculateTotalPages() {
    this.totalPages = Math.max(1, Math.ceil(this.products.length / this.itemsPerPage));

    // Reset to page 1 if current page is out of bounds
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  // Apply pagination to get the current page's products
  applyPagination() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = Math.min(startIndex + this.itemsPerPage, this.products.length);
    this.filteredProducts = this.products.slice(startIndex, endIndex);
  }

  // Navigate to a specific page
  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    // Set loading if navigating to a different page
    if (page !== this.currentPage) {
      this.isLoading.set(true);

      // Timeout simulates loading for better UX
      setTimeout(() => {
        this.currentPage = page;
        this.applyPagination();
        this.isLoading.set(false);
      }, 300);
    }
  }

  // Generate array for pagination buttons
  getPaginationArray(): number[] {
    const pages: number[] = [];

    // If there are less than 5 pages, show all
    if (this.totalPages <= 5) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show 5 pages centered around current page if possible
      let startPage = Math.max(1, this.currentPage - 2);
      let endPage = Math.min(this.totalPages, startPage + 4);

      // Adjust if needed to always show 5 pages if possible
      if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  // Method to sort products
  applySorting() {
    switch (this.sortBy) {
      case 'price-low':
        this.products.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        this.products.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        this.products.sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        break;
      case 'popularity':
      default:
        this.products.sort((a, b) => b.ratingsAverage - a.ratingsAverage);
        break;
    }
  }

  // Method to add product to cart
  addToCart(id: string) {
    // Set loading state for this specific product
    this.loadingStates.set(id, true);
    this.toastrService.info('Adding product to cart...', 'Please wait');

    this.cartService.addProductToCart(id).pipe(
      catchError(err => {
        this.handleError('Failed to add to cart', err);
        return of({ status: 'error' });
      }),
      finalize(() => this.loadingStates.set(id, false))
    ).subscribe({
      next: (res) => {
        if (res.status === "success") {
          this.toastrService.success(res.message, "FreshCart");
        }
      }
    });
  }

  // Helper method to handle errors
  private handleError(message: string, error: any) {
    console.error(`${message}:`, error);
    this.toastrService.error(message, 'Error');
  }

  // Reset filters
  resetFilters() {
    this.searchQuery = '';
    this.sortBy = 'popularity';
    this.currentPage = 1;
    this.applyFilters();
  }

  // Generate array for star ratings
  generateStarArray(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i + 1);
  }

  // Lifecycle methods
  ngOnInit(): void {
    this.getProductsData();
    this.loadWishlistProducts();
  }

  loadWishlistProducts(): void {
    this.wishlistService.getLoggedUserWishlist().subscribe({
      next: (res) => {
        if (res && res.data) {
          // Clear previous set
          this.wishlistedProducts.clear();

          // Add all wishlist product IDs to set
          res.data.forEach((item: any) => {
            this.wishlistedProducts.add(item._id);
          });
        }
      },
      error: (err) => {
        console.error('Error loading wishlist:', err);
      }
    });
  }

  // Check if a product is in the wishlist
  isInWishlist(productId: string): boolean {
    return this.wishlistedProducts.has(productId);
  }

  // Toggle product in wishlist
  toggleWishlist(id: string): void {
    this.wishlistLoadingStates.set(id, true);

    // If product is already in wishlist, remove it
    if (this.isInWishlist(id)) {
      this.toastrService.info('Removing from wishlist...', 'Please wait');

      this.wishlistService.removeProductFromWishlist(id).subscribe({
        next: (res) => {
          if (res.status === "success") {
            this.wishlistedProducts.delete(id);
            this.toastrService.success(res.message, "FreshCart");
          }
          this.wishlistLoadingStates.set(id, false);
        },
        error: (err) => {
          console.error('Error removing from wishlist:', err);
          this.toastrService.error('Could not remove from wishlist', 'Error');
          this.wishlistLoadingStates.set(id, false);
        }
      });
    } else {
      // If not in wishlist, add it
      this.toastrService.info('Adding to wishlist...', 'Please wait');

      this.wishlistService.addProductToWishlist(id).subscribe({
        next: (res) => {
          if (res.status === "success") {
            this.wishlistedProducts.add(id);
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
  }
}
