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

type TabCategory = Exclude<FoodCategory, 'All'>;

const CATEGORY_KEYWORDS: Record<TabCategory, string[]> = {
  'Rice Dishes': ['rice', 'jollof'],
  Swallow: ['swallow', 'amala', 'eba', 'fufu', 'pounded'],
  Soups: ['soup', 'egusi', 'ogbono'],
  Grills: ['grill', 'suya'],
  Drinks: ['drink', 'juice', 'zobo'],
};

const TAB_CATEGORIES = Object.keys(CATEGORY_KEYWORDS) as TabCategory[];

function hasKeyword(text: string, category: TabCategory) {
  return CATEGORY_KEYWORDS[category].some((keyword) => text.includes(keyword));
}

export function matchesCategory(
  item: { name: string; category?: string },
  category: FoodCategory
): boolean {
  if (category === 'All') return true;
  const itemCategory = item.category?.trim().toLowerCase() ?? '';
  if (itemCategory && TAB_CATEGORIES.some((tab) => hasKeyword(itemCategory, tab))) {
    return hasKeyword(itemCategory, category);
  }
  return hasKeyword(item.name.toLowerCase(), category);
}

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
  /** Menu category title, e.g. "Rice Dishes". Used for related suggestions. */
  category?: string;
  /** Delivery area of the partner that sells this item. */
  state?: string;
  lga?: string;
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