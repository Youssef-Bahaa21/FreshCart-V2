import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { enviroment } from '../../enviroments/enviroments';

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {

  constructor(private httpClient: HttpClient) { }

  // Get all categories
  getAllCategories(): Observable<any> {
    return this.httpClient.get(`${enviroment.baseUrl}/api/v1/categories`);
  }

  // Get specific category by ID
  getSpecificCategory(id: string): Observable<any> {
    return this.httpClient.get(`${enviroment.baseUrl}/api/v1/categories/${id}`);
  }

  // Get products by category ID
  getProductsByCategory(categoryId: string, page: number = 1, limit: number = 20): Observable<any> {
    return this.httpClient.get(`${enviroment.baseUrl}/api/v1/products?category=${categoryId}&page=${page}&limit=${limit}`);
  }

  // Get subcategories by category ID
  getSubcategoriesByCategory(categoryId: string): Observable<any> {
    return this.httpClient.get(`${enviroment.baseUrl}/api/v1/categories/${categoryId}/subcategories`);
  }
}
