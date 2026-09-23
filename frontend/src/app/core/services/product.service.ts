import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product, ProductFormValue } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private base = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<{ products: Product[] }> {
    return this.http.get<{ products: Product[] }>(this.base);
  }

  getById(id: string): Observable<{ product: Product }> {
    return this.http.get<{ product: Product }>(`${this.base}/${id}`);
  }

  create(value: ProductFormValue, imageFile: File): Observable<{ product: Product }> {
    const formData = this.toFormData(value, imageFile);
    return this.http.post<{ product: Product }>(this.base, formData);
  }

  update(id: string, value: ProductFormValue, imageFile?: File | null): Observable<{ product: Product }> {
    const formData = this.toFormData(value, imageFile);
    return this.http.put<{ product: Product }>(`${this.base}/${id}`, formData);
  }

  delete(id: string): Observable<{ message: string; id: string }> {
    return this.http.delete<{ message: string; id: string }>(`${this.base}/${id}`);
  }

  /** Builds the full, browsable URL for a product image returned by the API. */
  resolveImageUrl(imageUrl: string): string {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${environment.uploadsBaseUrl}${imageUrl}`;
  }

  private toFormData(value: ProductFormValue, imageFile?: File | null): FormData {
    const formData = new FormData();
    formData.append('name', value.name);
    formData.append('category', value.category);
    formData.append('price', String(value.price));
    formData.append('productCode', value.productCode);
    formData.append('description', value.description ?? '');
    formData.append('featured', String(value.featured ?? true));
    if (imageFile) {
      formData.append('image', imageFile);
    }
    return formData;
  }
}