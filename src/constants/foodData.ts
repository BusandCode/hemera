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
  logo: string;
};

export const partners: Partner[] = [
  {
    id: 'mama-titis',
    name: "Mama Titi's",
    rating: 4.8,
    etaMinutes: 20,
    image:
      'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&q=80',
    logo:
      'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=100&q=80',
  },
  {
    id: 'suya-spot',
    name: 'Suya Spot',
    rating: 4.9,
    etaMinutes: 15,
    image:
      'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400&q=80',
    logo:
      'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=100&q=80',
  },
];

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

const partyJollof: Omit<MenuItem, 'id'> = {
  partnerName: "MAMA TITI'S",
  isPopular: true,
  name: 'Party Jollof Rice',
  description:
    'Smoky firewood jollof with fried plantain and coleslaw',
  price: 4000,
  rating: 4.9,
  etaMinutes: 20,
  image:
    'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&q=80',
};

export const todaysMenu: MenuItem[] = [
  { id: 'party-jollof-1', ...partyJollof },
  { id: 'party-jollof-2', ...partyJollof },
  { id: 'party-jollof-3', ...partyJollof },
  { id: 'party-jollof-4', ...partyJollof },
  { id: 'party-jollof-5', ...partyJollof },
];