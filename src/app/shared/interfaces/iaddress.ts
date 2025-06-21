export interface IAddress {
    _id?: string;
    name?: string;
    details: string;
    phone: string;
    city: string;
}

export interface AddressResponse {
    status: string;
    message: string;
    data?: IAddress[];
} 