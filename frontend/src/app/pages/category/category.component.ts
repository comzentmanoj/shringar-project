// src/app/pages/category/category.component.ts
import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models/product.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './category.component.html',
  styleUrl: './category.component.scss',
})
export class CategoryComponent implements OnInit {
  allProducts = signal<Product[]>([]);
  loading = signal<boolean>(true);
  errorMessage = signal<string>('');
  categorySlug = signal<string>('');

  filteredProducts = computed(() =>
    this.allProducts().filter((p) => this.slugify(p.category) === this.categorySlug())
  );

  // Falls back to a title-cased version of the slug until products load,
  // then switches to the exact category label as stored on the product.
  categoryLabel = computed(() => {
    const match = this.filteredProducts()[0];
    if (match) return match.category;
    return this.categorySlug()
      .split('-')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  });

  constructor(private route: ActivatedRoute, private productService: ProductService) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.categorySlug.set(params.get('categoryName') ?? '');
    });

    this.productService.getAll().subscribe({
      next: (res) => {
        this.allProducts.set(res.products);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load products right now. Please try again shortly.');
        this.loading.set(false);
      },
    });
  }

  resolveImage(imageUrl: string): string {
    return this.productService.resolveImageUrl(imageUrl);
  }

  openWhatsApp(productName?: string, productCode?: string, price?: number): void {
    let message =
      'Hi! I discovered Shringar by Lakshuu and would love to know more about your jewellery.';

    if (productName) {
      message = `Hi! I'm interested in the ${productName} (Code: ${productCode}, Price: ₹${price}). Could you please share more details and availability?`;
    }

    const url = `https://wa.me/${environment.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  /** Matches the same slug format used for the category tile links on the home page. */
  private slugify(text: string): string {
    return (text ?? '').toLowerCase().trim().replace(/\s+/g, '-');
  }
}