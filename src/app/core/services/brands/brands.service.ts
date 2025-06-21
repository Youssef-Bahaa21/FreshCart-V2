import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { enviroment } from '../../enviroments/enviroments';

@Injectable({
    providedIn: 'root'
})
export class BrandsService {

    constructor(private httpClient: HttpClient) { }

    // Get all brands
    getAllBrands(page: number = 1, limit: number = 20): Observable<any> {
        return this.httpClient.get(`${enviroment.baseUrl}/api/v1/brands?page=${page}&limit=${limit}`);
    }

    // Get specific brand by ID
    getSpecificBrand(id: string): Observable<any> {
        return this.httpClient.get(`${enviroment.baseUrl}/api/v1/brands/${id}`);
    }

    // Get products by brand ID
    getProductsByBrand(brandId: string, page: number = 1, limit: number = 20): Observable<any> {
        return this.httpClient.get(`${enviroment.baseUrl}/api/v1/products?brand=${brandId}&page=${page}&limit=${limit}`);
    }
} 