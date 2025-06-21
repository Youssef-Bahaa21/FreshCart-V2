export interface Iwishlist {
    count: number;
    _id: string;
    data: WishlistData[];
}

export interface WishlistData {
    sold: number;
    images: string[];
    subcategory: string[];
    ratingsQuantity: number;
    _id: string;
    title: string;
    slug: string;
    description: string;
    quantity: number;
    price: number;
    imageCover: string;
    category: Category;
    brand: Category;
    ratingsAverage: number;
    createdAt: string;
    updatedAt: string;
    id: string;
}

export interface Category {
    _id: string;
    name: string;
    slug: string;
    image?: string;
} 