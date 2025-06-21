import { Component, OnInit, signal, inject, HostListener } from '@angular/core';
import { CategoriesService } from '../../core/services/categories/categories.service';
import { Icategory } from '../../shared/interfaces/icategory';
import { Iproduct } from '../../shared/interfaces/iproduct';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { CartService } from '../../core/services/cart/cart.service';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule]
})
export class CategoriesComponent implements OnInit {
  // Dependency injection
  private readonly categoryService = inject(CategoriesService);
  private readonly router = inject(Router);
  private readonly toastrService = inject(ToastrService);
  private readonly cartService = inject(CartService);

  // State management
  categories: Icategory[] = [];
  selectedCategory: Icategory | null = null;
  categoryProducts: Iproduct[] = [];
  isLoading = signal(false);
  isProductsLoading = signal(false);
  loadingStates = new Map<string, boolean>();

  // Screen size
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
      if (this.selectedCategory) {
        this.loadCategoryProducts(this.selectedCategory._id, 1);
      }
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

  // Get all categories
  getCategoriesData(): void {
    this.isLoading.set(true);

    this.categoryService.getAllCategories().subscribe({
      next: (res) => {
        this.categories = res.data;
        this.isLoading.set(false);

        // Check for selected category from home page
        this.checkForSelectedCategory();
      },
      error: (err) => {
        console.error('Error fetching categories:', err);
        this.toastrService.error('Could not load categories', 'Error');
        this.isLoading.set(false);
      }
    });
  }

  // Check for a selected category in session storage
  private checkForSelectedCategory(): void {
    const selectedCategoryId = sessionStorage.getItem('selectedCategoryId');

    if (selectedCategoryId) {
      // Find the selected category
      const category = this.categories.find(cat => cat._id === selectedCategoryId);

      if (category) {
        // Select the category
        this.selectCategory(category);

        // Scroll to the selected category (optional)
        setTimeout(() => {
          const categoryElement = document.querySelector(`[data-category-id="${selectedCategoryId}"]`);
          if (categoryElement) {
            categoryElement.scrollIntoView({
              behavior: this.isMobile ? 'auto' : 'smooth',
              block: 'center'
            });
          }
        }, this.isMobile ? 0 : 100);
      }

      // Clear the session storage
      sessionStorage.removeItem('selectedCategoryId');
    }
  }

  // Handle category selection
  selectCategory(category: Icategory): void {
    this.selectedCategory = category;
    this.loadCategoryProducts(category._id);
  }

  // Load products for a selected category
  loadCategoryProducts(categoryId: string, page: number = 1): void {
    this.isProductsLoading.set(true);
    this.currentPage = page;

    this.categoryService.getProductsByCategory(categoryId, page, this.itemsPerPage).subscribe({
      next: (res) => {
        this.categoryProducts = res.data;
        this.totalPages = Math.ceil(res.metadata?.total / this.itemsPerPage) || 1;
        this.isProductsLoading.set(false);

        // When products load, scroll to products section if mobile
        if (this.isMobile && this.categoryProducts.length > 0) {
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
        console.error('Error fetching category products:', err);
        this.toastrService.error('Could not load products for this category', 'Error');
        this.isProductsLoading.set(false);
      }
    });
  }

  // Add product to cart
  addToCart(id: string) {
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

  // Navigate to product details
  goToProductDetails(productId: string): void {
    this.router.navigate(['/details', productId]);
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || !this.selectedCategory) {
      return;
    }

    this.loadCategoryProducts(this.selectedCategory._id, page);
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

  ngOnInit(): void {
    this.getCategoriesData();
  }
}
