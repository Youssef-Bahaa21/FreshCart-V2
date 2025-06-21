import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { enviroment } from '../../enviroments/enviroments';
import { AddressResponse, IAddress } from '../../../shared/interfaces/iaddress';

@Injectable({
    providedIn: 'root'
})
export class AddressesService {

    constructor(private httpClient: HttpClient) { }

    /**
     * Get all addresses for the logged in user
     */
    getUserAddresses(): Observable<AddressResponse> {
        return this.httpClient.get<AddressResponse>(`${enviroment.baseUrl}/api/v1/addresses`);
    }

    /**
     * Add a new address
     */
    addAddress(address: IAddress): Observable<AddressResponse> {
        return this.httpClient.post<AddressResponse>(`${enviroment.baseUrl}/api/v1/addresses`, address);
    }

    /**
     * Update an existing address
     */
    updateAddress(addressId: string, address: IAddress): Observable<AddressResponse> {
        return this.httpClient.put<AddressResponse>(`${enviroment.baseUrl}/api/v1/addresses/${addressId}`, address);
    }

    /**
     * Delete an address
     */
    deleteAddress(addressId: string): Observable<AddressResponse> {
        return this.httpClient.delete<AddressResponse>(`${enviroment.baseUrl}/api/v1/addresses/${addressId}`);
    }
} 