import { ImageSourcePropType } from 'react-native';

export type FoodCategory =
  | 'All'
  | 'Rice Dishes'
  | 'Swallow'
  | 'Soups'
  | 'Grills'
  | 'Drinks';

export const categories: FoodCategory[] = [
  'All',
  'Rice Dishes',
  'Swallow',
  'Soups',
  'Grills',
  'Drinks',
];

export type Partner = {
  id: string;
  name: string;
  rating: number;
  etaMinutes: number;
  image: string;
  logo: ImageSourcePropType;
};

export type MenuItem = {
  id: string;
  partnerName: string;
  isPopular: boolean;
  name: string;
  description: string;
  price: number;
  rating: number;
  etaMinutes: number;
  image: string;
};

export type PartnerCategory = {
  id: string;
  title: string;
  items: MenuItem[];
};

export type PartnerReview = {
  id: string;
  author: string;
  initials: string;
  rating: number;
  date: string;
  comment: string;
};

export type PartnerDetail = Partner & {
  tagline: string;
  cuisine: string;
  address: string;
  distanceKm: number;
  priceLevel: '₦';
  openNow: boolean;
  hours: string;
  reviewCount: number;
  categories: PartnerCategory[];
  reviews: PartnerReview[];
};