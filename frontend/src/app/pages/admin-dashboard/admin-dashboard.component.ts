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

  form: ProductFormValue = {
    name: '', category: '', price: 0, productCode: '', description: '', featured: true,
  };

  constructor(
    private productService: ProductService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void { this.fetchProducts(); }

  fetchProducts(): void {
    this.loading.set(true);
    this.productService.getAll().subscribe({
      next: (res) => { this.products.set(res.products); this.loading.set(false); },
      error: () => { this.errorMessage.set('Could not load products.'); this.loading.set(false); },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  resolveImage(url: string): string { return this.productService.resolveImageUrl(url); }

  onSubmit(): void {
    if (!this.editingId && !this.selectedFile) {
      this.errorMessage.set('Please select an image.');
      return;
    }
    this.errorMessage.set('');

    const request$ = this.editingId
      ? this.productService.update(this.editingId, this.form, this.selectedFile)
      : this.productService.create(this.form, this.selectedFile as File);

    request$.subscribe({
      next: () => { this.resetForm(); this.fetchProducts(); },
      error: (err) => this.errorMessage.set(err?.error?.message || 'Something went wrong.'),
    });
  }

  editProduct(p: Product): void {
    this.editingId = p._id;
    this.form = {
      name: p.name, category: p.category, price: p.price,
      productCode: p.productCode, description: p.description, featured: p.featured,
    };
    this.selectedFile = null;
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
    this.form = { name: '', category: '', price: 0, productCode: '', description: '', featured: true };
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/admin/login']);
  }
}