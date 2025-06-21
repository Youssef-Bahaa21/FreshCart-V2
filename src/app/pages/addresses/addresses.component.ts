import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AddressesService } from '../../core/services/addresses/addresses.service';
import { IAddress } from '../../shared/interfaces/iaddress';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-addresses',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './addresses.component.html',
    styleUrl: './addresses.component.css'
})
export class AddressesComponent implements OnInit {
    // Services
    private readonly addressesService = inject(AddressesService);
    private readonly formBuilder = inject(FormBuilder);
    private readonly toastr = inject(ToastrService);

    // State
    addresses = signal<IAddress[]>([]);
    isLoading = signal<boolean>(false);
    isSubmitting = signal<boolean>(false);
    editingAddressId = signal<string | null>(null);
    showForm = signal<boolean>(false);

    // Form
    addressForm: FormGroup = this.formBuilder.group({
        details: ['', [Validators.required]],
        phone: ['', [Validators.required, Validators.pattern(/^01[0125][0-9]{8}$/)]],
        city: ['', [Validators.required]]
    });

    ngOnInit(): void {
        this.loadAddresses();
    }

    loadAddresses(): void {
        this.isLoading.set(true);
        this.addressesService.getUserAddresses().subscribe({
            next: (response) => {
                if (response.status === 'success' && response.data) {
                    this.addresses.set(response.data);
                }
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error loading addresses:', err);
                this.toastr.error('Failed to load addresses', 'Error');
                this.isLoading.set(false);
            }
        });
    }

    addAddress(): void {
        this.editingAddressId.set(null);
        this.addressForm.reset();
        this.showForm.set(true);
    }

    editAddress(address: IAddress): void {
        this.editingAddressId.set(address._id || null);
        this.addressForm.patchValue({
            details: address.details,
            phone: address.phone,
            city: address.city
        });
        this.showForm.set(true);
    }

    deleteAddress(addressId: string): void {
        if (confirm('Are you sure you want to delete this address?')) {
            this.isLoading.set(true);
            this.addressesService.deleteAddress(addressId).subscribe({
                next: (response) => {
                    if (response.status === 'success') {
                        this.toastr.success('Address deleted successfully', 'Success');
                        this.loadAddresses();
                    }
                },
                error: (err) => {
                    console.error('Error deleting address:', err);
                    this.toastr.error('Failed to delete address', 'Error');
                    this.isLoading.set(false);
                }
            });
        }
    }

    submitForm(): void {
        if (this.addressForm.invalid) {
            this.addressForm.markAllAsTouched();
            return;
        }

        this.isSubmitting.set(true);

        const addressData: IAddress = {
            details: this.addressForm.value.details,
            phone: this.addressForm.value.phone,
            city: this.addressForm.value.city
        };

        if (this.editingAddressId()) {
            // Update existing address
            this.addressesService.updateAddress(this.editingAddressId()!, addressData).subscribe({
                next: (response) => {
                    if (response.status === 'success') {
                        this.toastr.success('Address updated successfully', 'Success');
                        this.loadAddresses();
                        this.resetForm();
                    }
                },
                error: (err) => {
                    console.error('Error updating address:', err);
                    this.toastr.error('Failed to update address', 'Error');
                    this.isSubmitting.set(false);
                }
            });
        } else {
            // Add new address
            this.addressesService.addAddress(addressData).subscribe({
                next: (response) => {
                    if (response.status === 'success') {
                        this.toastr.success('Address added successfully', 'Success');
                        this.loadAddresses();
                        this.resetForm();
                    }
                },
                error: (err) => {
                    console.error('Error adding address:', err);
                    this.toastr.error('Failed to add address', 'Error');
                    this.isSubmitting.set(false);
                }
            });
        }
    }

    resetForm(): void {
        this.addressForm.reset();
        this.editingAddressId.set(null);
        this.isSubmitting.set(false);
        this.showForm.set(false);
    }

    cancelEdit(): void {
        this.resetForm();
    }
} 