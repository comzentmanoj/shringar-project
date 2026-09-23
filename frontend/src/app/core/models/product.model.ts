export interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  productCode: string;
  imageUrl: string; // relative path from backend, e.g. /uploads/products/xyz.jpg
  description?: string;
  featured: boolean;
  isHero?: boolean;
  heroOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductFormValue {
  name: string;
  category: string;
  price: number;
  productCode: string;
  description?: string;
  featured?: boolean;
  isHero?: boolean;
  heroOrder?: number;
}