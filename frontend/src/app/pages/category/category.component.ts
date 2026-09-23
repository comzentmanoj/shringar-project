// src/app/pages/category/category.component.ts
import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models/product.model';
import { environment } from '../../../environments/environment';

interface CategoryOption {
  name: string;
  slug: string;
}

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

  canonicalSlug = computed(() => {
    const raw = this.categorySlug();
    if (!raw || raw === 'all') return 'all';
    return this.canonicalizeCategory(raw).slug;
  });

  // Only displays categories that actually have products in the database
  categoriesList = computed<CategoryOption[]>(() => {
    const categoryMap = new Map<string, string>(); // slug -> display name

    for (const p of this.allProducts()) {
      if (p.category && p.category.trim()) {
        const { name, slug } = this.canonicalizeCategory(p.category);
        if (!categoryMap.has(slug)) {
          categoryMap.set(slug, name);
        }
      }
    }

    const dynamicCategories: CategoryOption[] = Array.from(categoryMap.entries()).map(
      ([slug, name]) => ({
        name,
        slug,
      })
    );

    // Alphabetical order for a clean layout
    dynamicCategories.sort((a, b) => a.name.localeCompare(b.name));

    return [{ name: 'All Pieces', slug: 'all' }, ...dynamicCategories];
  });

  filteredProducts = computed(() => {
    const targetSlug = this.canonicalSlug();
    if (targetSlug === 'all') {
      return this.allProducts();
    }

    return this.allProducts().filter((p) => {
      if (!p.category) return false;
      const prodSlug = this.canonicalizeCategory(p.category).slug;
      return prodSlug === targetSlug;
    });
  });

  // Displays clean canonical category title
  categoryLabel = computed(() => {
    const targetSlug = this.canonicalSlug();
    if (targetSlug === 'all') {
      return 'All Pieces';
    }

    const found = this.categoriesList().find((c) => c.slug === targetSlug);
    if (found) return found.name;

    return this.canonicalizeCategory(this.categorySlug()).name;
  });

  constructor(private route: ActivatedRoute, private productService: ProductService) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('categoryName') ?? '';
      this.categorySlug.set(slug);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
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

  openWhatsApp(
    productName?: string,
    productCode?: string,
    price?: number,
    imageUrl?: string
  ): void {
    let message =
      'Hi! I discovered Shringar by Lakshuu and would love to know more about your jewellery.';

    if (productName) {
      message = `Hi! I'm interested in the ${productName} (Code: ${productCode}, Price: ₹${price}). Could you please share more details and availability?`;
      if (imageUrl) {
        message += `\nProduct Link/Image: ${imageUrl}`;
      }
    }

    const url = `https://wa.me/${environment.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  /**
   * Maps typos, singular/plural, and case variations to a single clean canonical category.
   */
  private canonicalizeCategory(raw: string): { name: string; slug: string } {
    const trimmed = (raw ?? '').trim();
    const lower = trimmed.toLowerCase().replace(/[-_]/g, ' ');

    if (
      lower === 'earing' ||
      lower === 'earings' ||
      lower === 'earring' ||
      lower === 'earrings'
    ) {
      return { name: 'Earrings', slug: 'earrings' };
    }

    if (
      lower === 'necklase' ||
      lower === 'necklases' ||
      lower === 'necklace' ||
      lower === 'necklaces'
    ) {
      return { name: 'Necklaces', slug: 'necklaces' };
    }

    if (lower === 'ring' || lower === 'rings') {
      return { name: 'Rings', slug: 'rings' };
    }

    if (lower === 'bangle' || lower === 'bangles') {
      return { name: 'Bangles', slug: 'bangles' };
    }

    if (lower === 'anklet' || lower === 'anklets') {
      return { name: 'Anklets', slug: 'anklet' };
    }

    if (lower === 'bracelet' || lower === 'bracelets') {
      return { name: 'Bracelets', slug: 'bracelet' };
    }

    // Title case any other category
    const name = trimmed
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    const slug = this.slugify(name);
    return { name, slug };
  }

  private slugify(text: string): string {
    return (text ?? '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-');
  }
}