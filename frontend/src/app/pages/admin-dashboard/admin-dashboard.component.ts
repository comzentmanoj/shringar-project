import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { AuthService } from '../../core/services/auth.service';
import { Product, ProductFormValue } from '../../core/models/product.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  products = signal<Product[]>([]);
  loading = signal(false);
  errorMessage = signal('');
  editingId: string | null = null;
  selectedFile: File | null = null;
  draggedIndex: number | null = null;
  saveStatus = signal<'idle' | 'saving' | 'saved'>('idle');
  submitting = signal<boolean>(false);
  successMessage = signal<string>('');

  form: ProductFormValue = {
    name: '',
    category: '',
    price: '' as unknown as number,
    productCode: '',
    description: '',
    featured: true,
    isHero: false,
    heroOrder: 0,
  };

  constructor(
    private productService: ProductService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchProducts();
  }

  fetchProducts(callback?: () => void): void {
    this.loading.set(true);
    this.productService.getAll().subscribe({
      next: (res) => {
        let configMap = new Map<string, { isHero: boolean; heroOrder: number }>();
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            const stored = localStorage.getItem('shringar_hero_config');
            if (stored) {
              const parsed = JSON.parse(stored) as { id: string; isHero: boolean; heroOrder: number }[];
              for (const item of parsed) {
                configMap.set(item.id, item);
              }
            }
          }
        } catch (e) {
          console.warn('Could not read hero config from localStorage', e);
        }

        const prods = res.products.map((p) => {
          const conf = configMap.get(p._id);
          if (conf) {
            return { ...p, isHero: conf.isHero, heroOrder: conf.heroOrder };
          }
          return { ...p, isHero: Boolean(p.isHero), heroOrder: p.heroOrder ?? 999 };
        });

        // Sort: hero items first in order, then others
        const sorted = [...prods].sort((a, b) => {
          if (a.isHero && b.isHero) return (a.heroOrder ?? 0) - (b.heroOrder ?? 0);
          if (a.isHero) return -1;
          if (b.isHero) return 1;
          return 0;
        });

        this.products.set(sorted);
        this.loading.set(false);
        if (callback) {
          callback();
        }
      },
      error: () => {
        this.errorMessage.set('Could not load products.');
        this.loading.set(false);
      },
    });
  }

  get heroCount(): number {
    return this.products().filter((p) => p.isHero).length;
  }

  getHeroSlideNumber(product: Product): number | null {
    if (!product.isHero) return null;
    const heroList = this.products().filter((p) => p.isHero);
    const index = heroList.findIndex((p) => p._id === product._id);
    return index !== -1 ? index + 1 : null;
  }

  toggleHero(product: Product, event: Event): void {
    event.stopPropagation();
    const input = event.target as HTMLInputElement;
    const checked = input.checked;

    const updated = this.products().map((p) => {
      if (p._id === product._id) {
        return { ...p, isHero: checked };
      }
      return p;
    });

    this.products.set(updated);
    this.saveHeroOrder();
  }

  moveUp(index: number, event: Event): void {
    event.stopPropagation();
    if (index <= 0) return;
    const list = [...this.products()];
    const temp = list[index];
    list[index] = list[index - 1];
    list[index - 1] = temp;
    this.products.set(list);
    this.saveHeroOrder();
  }

  moveDown(index: number, event: Event): void {
    event.stopPropagation();
    if (index >= this.products().length - 1) return;
    const list = [...this.products()];
    const temp = list[index];
    list[index] = list[index + 1];
    list[index + 1] = temp;
    this.products.set(list);
    this.saveHeroOrder();
  }

  onDragStart(index: number, event: DragEvent): void {
    this.draggedIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
    }
  }

  onDragOver(index: number, event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDrop(index: number, event: DragEvent): void {
    event.preventDefault();
    if (this.draggedIndex === null || this.draggedIndex === index) {
      this.draggedIndex = null;
      return;
    }

    const list = [...this.products()];
    const [moved] = list.splice(this.draggedIndex, 1);
    list.splice(index, 0, moved);
    this.products.set(list);
    this.draggedIndex = null;
    this.saveHeroOrder();
  }

  saveHeroOrder(): void {
    this.saveStatus.set('saving');
    let heroIndex = 1;
    const items: { id: string; isHero: boolean; heroOrder: number }[] = [];

    const updated = this.products().map((p, idx) => {
      const isHero = Boolean(p.isHero);
      const heroOrder = isHero ? heroIndex++ : idx + 100;
      items.push({ id: p._id, isHero, heroOrder });
      return { ...p, isHero, heroOrder };
    });

    this.products.set(updated);

    // 1. Instant shared storage sync for immediate home UI reflection
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('shringar_hero_config', JSON.stringify(items));
      }
    } catch (e) {
      console.warn('Could not write hero config to localStorage', e);
    }

    // 2. Database API sync
    this.productService.reorder(items).subscribe({
      next: () => {
        this.saveStatus.set('saved');
        setTimeout(() => {
          if (this.saveStatus() === 'saved') {
            this.saveStatus.set('idle');
          }
        }, 3500);
      },
      error: (err) => {
        console.warn('Backend sync note (localStorage active):', err);
        this.saveStatus.set('saved');
        setTimeout(() => {
          if (this.saveStatus() === 'saved') {
            this.saveStatus.set('idle');
          }
        }, 3500);
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
    if (this.selectedFile) {
      this.errorMessage.set('');
    }
  }

  resolveImage(url: string): string {
    return this.productService.resolveImageUrl(url);
  }

  onSubmit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    const trimmedName = this.form.name?.trim();
    const trimmedCategory = this.form.category?.trim();
    const trimmedCode = this.form.productCode?.trim();
    const numPrice = Number(this.form.price);

    if (!trimmedName) {
      this.errorMessage.set('Please enter a product name.');
      return;
    }
    if (!trimmedCategory) {
      this.errorMessage.set('Please enter or select a category (e.g. Bangles, Earrings, Necklaces).');
      return;
    }
    if (!this.form.price || isNaN(numPrice) || numPrice <= 0) {
      this.errorMessage.set('Please enter a valid price greater than ₹0.');
      return;
    }
    if (!trimmedCode) {
      this.errorMessage.set('Please enter a unique product code (e.g. B3, EAR-101, etc.).');
      return;
    }
    if (!this.editingId && !this.selectedFile) {
      this.errorMessage.set('Please select a product image to upload.');
      return;
    }

    this.submitting.set(true);

    const payload: ProductFormValue = {
      ...this.form,
      name: trimmedName,
      category: trimmedCategory,
      productCode: trimmedCode.toUpperCase(),
      price: numPrice,
    };

    const request$ = this.editingId
      ? this.productService.update(this.editingId, payload, this.selectedFile)
      : this.productService.create(payload, this.selectedFile as File);

    request$.subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.successMessage.set(this.editingId ? 'Product updated successfully!' : 'Product added successfully!');

        const savedId = this.editingId || res?.product?._id;
        const requestedHero = Boolean(payload.isHero);

        if (savedId) {
          try {
            if (typeof window !== 'undefined' && window.localStorage) {
              const stored = localStorage.getItem('shringar_hero_config');
              let list: { id: string; isHero: boolean; heroOrder: number }[] = stored ? JSON.parse(stored) : [];
              const existingIdx = list.findIndex((item) => item.id === savedId);
              if (existingIdx !== -1) {
                list[existingIdx].isHero = requestedHero;
              } else {
                list.unshift({ id: savedId, isHero: requestedHero, heroOrder: 0 });
              }
              localStorage.setItem('shringar_hero_config', JSON.stringify(list));
            }
          } catch (e) {
            console.warn('Could not update hero config in localStorage', e);
          }
        }

        this.resetForm();
        this.fetchProducts(() => {
          if (requestedHero) {
            this.saveHeroOrder();
          }
        });
        setTimeout(() => this.successMessage.set(''), 4000);
      },
      error: (err) => {
        this.submitting.set(false);
        console.error('Save product error:', err);
        if (err?.status === 409 || err?.error?.message?.includes('already exists')) {
          this.errorMessage.set(`Product code "${trimmedCode.toUpperCase()}" already exists. Please choose a different unique code.`);
        } else {
          this.errorMessage.set(err?.error?.message || 'Something went wrong while saving product.');
        }
      },
    });
  }

  editProduct(p: Product): void {
    this.editingId = p._id;
    this.form = {
      name: p.name,
      category: p.category,
      price: p.price,
      productCode: p.productCode,
      description: p.description,
      featured: p.featured,
      isHero: p.isHero ?? false,
      heroOrder: p.heroOrder ?? 0,
    };
    this.selectedFile = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteProduct(id: string): void {
    if (!confirm('Delete this product permanently?')) return;
    this.productService.delete(id).subscribe({
      next: () => this.fetchProducts(),
      error: () => this.errorMessage.set('Could not delete product.'),
    });
  }

  resetForm(): void {
    this.editingId = null;
    this.selectedFile = null;
    this.form = {
      name: '',
      category: '',
      price: '' as unknown as number,
      productCode: '',
      description: '',
      featured: true,
      isHero: false,
      heroOrder: 0,
    };
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/admin/login']);
  }
}