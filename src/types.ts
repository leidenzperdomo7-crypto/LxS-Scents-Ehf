export interface Fragrance {
  id: string;
  name: string;
  tagline: string;
  price: number;
  size: string;
  concentration: string;
  description: string;
  classification: string;
  image: string;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  season: string;
  sillage: string;
  color: string;
  secondaryColor: string;
  inspiredBy?: string;
  ingredients?: string;
  gender?: 'femme' | 'homme' | 'unisex';
}

export interface CustomScent {
  name: string;
  concentration: string;
  percentage: string;
  poeticDescription: string;
  classification: string;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  colorPalette: string[];
  season: string;
  sillage: string;
  ritual: string;
  fallback?: boolean;
}

export interface CartItem {
  fragrance: Fragrance;
  quantity: number;
  sizeSelected: string;
}
