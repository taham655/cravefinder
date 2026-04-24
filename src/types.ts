export interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  rating: number;
  priceRange: string;
  cuisineType: string;
  whyItMatches: string;
  features: string[];
  lat: number;
  lng: number;
}

export interface SearchFilters {
  halal: boolean;
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
}
