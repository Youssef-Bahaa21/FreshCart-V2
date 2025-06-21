import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { enviroment } from '../../enviroments/enviroments';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {

  constructor(private httpClient: HttpClient) { }
  getAllProducts(page: number = 1, limit: number = 100): Observable<any> {
    return this.httpClient.get(`${enviroment.baseUrl}/api/v1/products?page=${page}&limit=${limit}`)
  }
  getSpecificProducts(id: string): Observable<any> {
    return this.httpClient.get(`${enviroment.baseUrl}/api/v1/products/${id}`)
  }

}
