// src/app/pages/home/home.component.ts
import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models/product.model';
import { environment } from '../../../environments/environment';

interface CategoryTile {
  name: string;
  slug: string;
  image: string;
}

const HERO_SLIDE_INTERVAL_MS = 4500;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  products = signal<Product[]>([]);
  loading = signal<boolean>(true);
  errorMessage = signal<string>('');

  // Carousel state
  heroIndex = signal<number>(0);
  heroProducts = computed(() => this.products().slice(0, 5));
  private heroTimer?: ReturnType<typeof setInterval>;

  // ---- EDIT HERE ----
  // Fixed category list. `slug` must match the lowercase, hyphenated version
  // of the `category` field you store on each product (e.g. "Maang Tikka" -> "maang-tikka").
  // Swap in your own images whenever you're ready.
  categories: CategoryTile[] = [
    {
      name: 'Earrings',
      slug: 'earrings',
      image:
        'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Necklaces',
      slug: 'necklaces',
      image:
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Rings',
      slug: 'rings',
      image:
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Bangles',
      slug: 'bangles',
      image:
        'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=600&q=80',
    },
  ];

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.productService.getAll().subscribe({
      next: (res) => {
        this.products.set(res.products.filter((p) => p.featured));
        this.loading.set(false);
        this.startHeroAutoSlide();
      },
      error: () => {
        this.errorMessage.set('Could not load the collection right now. Please try again shortly.');
        this.loading.set(false);
      },
    });
  }

  ngOnDestroy(): void {
    this.stopHeroAutoSlide();
  }

  goToHeroSlide(index: number): void {
    this.heroIndex.set(index);
    // Restart the timer so it doesn't jump forward right after a manual click.
    this.stopHeroAutoSlide();
    this.startHeroAutoSlide();
  }

  resolveImage(imageUrl: string): string {
    return this.productService.resolveImageUrl(imageUrl);
  }

  openWhatsApp(productName?: string, productCode?: string, price?: number, imageUrl?: string): void {
    let message =
      'Hi! I discovered Shringar by Lakshuu and would love to know more about your jewellery.';

    if (productName) {
      message = `Hi! I'm interested in the ${productName} (Code: ${productCode}, Price: ₹${price}). Could you please share more details and availability?`;
    }

    const url = `https://wa.me/${environment.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  private startHeroAutoSlide(): void {
    if (this.heroProducts().length <= 1) return;
    this.heroTimer = setInterval(() => {
      this.heroIndex.set((this.heroIndex() + 1) % this.heroProducts().length);
    }, HERO_SLIDE_INTERVAL_MS);
  }

  private stopHeroAutoSlide(): void {
    if (this.heroTimer) {
      clearInterval(this.heroTimer);
      this.heroTimer = undefined;
    }
  }
}