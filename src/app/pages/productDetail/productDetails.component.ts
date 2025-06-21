import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CategoriesService } from '../../core/services/categories/categories.service';
import { ProductsService } from '../../core/services/products/products.service';
import { CartService } from '../../core/services/cart/cart.service';
import { WishlistService } from '../../core/services/wishlist/wishlist.service';
import { Iproduct } from '../../shared/interfaces/iproduct';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './productDetails.component.html',
  styleUrl: './productDetails.component.css'
})
export class ProductDetailsComponent implements OnInit {
  // Dependency injection
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly productsService = inject(ProductsService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly cartService = inject(CartService);
  private readonly wishlistService = inject(WishlistService);
  private readonly toastr = inject(ToastrService);
  private readonly router = inject(Router);
  private readonly titleService = inject(Title);

  // State management
  productId: string = '';
  productDetails: Iproduct = {} as Iproduct;
  isLoading = signal(true);
  isAddingToCart = signal(false);
  isAddingToWishlist = signal(false);
  isInWishlist = signal(false);
  selectedImageIndex = signal(-1);
  quantity = signal(1);
  activeTab = signal('description');
  relatedProducts: Iproduct[] = [];
  isLoadingRelated = signal(false);

  ngOnInit(): void {
    this.loadProductDetails();
  }

  // Load product details from API
  loadProductDetails(): void {
    this.isLoading.set(true);

    this.activatedRoute.paramMap.subscribe({
      next: (params) => {
        this.productId = params.get('id') || '';

        if (!this.productId) {
          this.handleError('Product ID not found');
          return;
        }

        this.productsService.getSpecificProducts(this.productId).subscribe({
          next: (res) => {
            this.productDetails = res.data;
            this.titleService.setTitle(`${this.productDetails.title} | FreshCart`);
            this.loadRelatedProducts();
            this.checkIfInWishlist();
            this.isLoading.set(false);
          },
          error: (err) => {
            this.handleError('Failed to load product details');
            console.error('Error loading product details:', err);
          }
        });
      },
      error: (err) => {
        this.handleError('Failed to process request');
        console.error('Error in route params:', err);
      }
    });
  }

  // Check if product is in wishlist
  checkIfInWishlist(): void {
    this.wishlistService.getLoggedUserWishlist().subscribe({
      next: (res) => {
        if (res && res.data) {
          // Check if current product is in wishlist
          const inWishlist = res.data.some((item: any) => item._id === this.productId);
          this.isInWishlist.set(inWishlist);
        }
      },
      error: (err) => {
        console.error('Error checking wishlist:', err);
      }
    });
  }

  // Load related products from the same category
  loadRelatedProducts(): void {
    if (!this.productDetails.category?._id) return;

    this.isLoadingRelated.set(true);

    this.categoriesService.getProductsByCategory(this.productDetails.category._id, 1, 4).subscribe({
      next: (res) => {
        // Filter out the current product
        this.relatedProducts = res.data.filter((product: Iproduct) =>
          product._id !== this.productDetails._id
        ).slice(0, 4);
        this.isLoadingRelated.set(false);
      },
      error: (err) => {
        console.error('Error loading related products:', err);
        this.isLoadingRelated.set(false);
      }
    });
  }

  // Add product to cart
  addToCart(): void {
    if (this.isAddingToCart()) return;

    this.isAddingToCart.set(true);
    this.toastr.info('Adding to cart...', 'Please wait');

    this.cartService.addProductToCart(this.productId).subscribe({
      next: (res) => {
        if (res.status === "success") {
          this.toastr.success(res.message, "FreshCart");
        }
        this.isAddingToCart.set(false);
      },
      error: (err) => {
        this.handleError('Failed to add product to cart');
        console.error('Error adding to cart:', err);
        this.isAddingToCart.set(false);
      }
    });
  }

  // Toggle product in wishlist
  addToWishlist(): void {
    if (this.isAddingToWishlist()) return;

    this.isAddingToWishlist.set(true);

    // If product is already in wishlist, remove it
    if (this.isInWishlist()) {
      this.toastr.info('Removing from wishlist...', 'Please wait');

      this.wishlistService.removeProductFromWishlist(this.productId).subscribe({
        next: (res) => {
          if (res.status === "success") {
            this.isInWishlist.set(false);
            this.toastr.success(res.message, "FreshCart");
          }
          this.isAddingToWishlist.set(false);
        },
        error: (err) => {
          this.handleError('Failed to remove product from wishlist');
          console.error('Error removing from wishlist:', err);
          this.isAddingToWishlist.set(false);
        }
      });
    } else {
      // If not in wishlist, add it
      this.toastr.info('Adding to wishlist...', 'Please wait');

      this.wishlistService.addProductToWishlist(this.productId).subscribe({
        next: (res) => {
          if (res.status === "success") {
            this.isInWishlist.set(true);
            this.toastr.success(res.message, "FreshCart");
          }
          this.isAddingToWishlist.set(false);
        },
        error: (err) => {
          this.handleError('Failed to add product to wishlist');
          console.error('Error adding to wishlist:', err);
          this.isAddingToWishlist.set(false);
        }
      });
    }
  }

  // Set selected image
  selectImage(index: number): void {
    this.selectedImageIndex.set(index);
  }

  // Set active tab
  setActiveTab(tab: string): void {
    this.activeTab.set(tab);
  }

  // Navigate to related product
  goToProduct(productId: string): void {
    this.router.navigate(['/details', productId]);
  }

  // Handle errors
  private handleError(message: string): void {
    this.toastr.error(message, 'Error');
    this.isLoading.set(false);
  }

  // Generate array of stars for ratings
  generateStars(rating: number): number[] {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return [
      ...Array(fullStars).fill(1),
      ...(hasHalfStar ? [0.5] : []),
      ...Array(emptyStars).fill(0)
    ];
  }
}
