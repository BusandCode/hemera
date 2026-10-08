import { Feather } from '@expo/vector-icons';
import { foodColors } from './foodColors';

/** Services that open a pop-up instead of a screen. */
export type ServiceAction = 'products' | 'locations';

export type QuickService = {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  symbol?: string;
  title: string;
  subtitle: string;
  bgColor: string;
  route?: string;
  action?: ServiceAction;
};

/** The 8 services on the home screen grid (unchanged). */
export const quickServices: QuickService[] = [
  { id: 'echop',   icon: 'coffee',         title: 'E-Chop',      subtitle: 'Order food you love',     bgColor: foodColors.primary,     route: '/echop' },
  { id: 'ewash',   icon: 'droplet',        title: 'E-Wash',      subtitle: 'Laundry & dry cleaning',  bgColor: foodColors.badgeBlue,   route: '/wash' },
  { id: 'track',   icon: 'map-pin',        title: 'Track Order', subtitle: 'Track your orders live',  bgColor: foodColors.forestGreen, route: '/track-order' },
  { id: 'pickup',  icon: 'truck',          title: 'Pickup',      subtitle: 'Schedule a pickup',       bgColor: foodColors.primary,     route: '/request-pickup' },
  { id: 'support', icon: 'message-circle', title: 'Support',     subtitle: 'Get help anytime',        bgColor: foodColors.badgeBlue,   route: '/contact-support' },
  { id: 'quality', icon: 'shield',         title: 'Our Promise', subtitle: 'Top quality assurance',   bgColor: foodColors.primary,     route: '/quality-promise' },
  { id: 'eplan',   icon: 'calendar',       title: 'E-Plan',      subtitle: 'Plan meals ahead',        bgColor: foodColors.forestGreen, route: '/e-plan' },
  { id: 'offers',  icon: 'tag',            title: 'Offers',      subtitle: 'Exclusive deals for you', bgColor: foodColors.badgeBlue,   route: '/offers' },
];

/** Extra services shown only on the All Services screen. */
export const extraServices: QuickService[] = [
  { id: 'history',      icon: 'file-text',    title: 'Order History',       subtitle: 'Review past orders',          bgColor: foodColors.badgeBlue,   route: '/order-history' },
  { id: 'eplanWallet',  icon: 'credit-card',  title: 'E-Plan Wallet',       subtitle: 'Manage meal credits',         bgColor: foodColors.forestGreen, route: '/wallet' },
  { id: 'favorites',    icon: 'heart',        title: 'Restaurant', subtitle: 'Quick access to favs',        bgColor: foodColors.primary,     route: '/favorites' },
  { id: 'products',     icon: 'shopping-bag', title: 'Our Products',        subtitle: 'Browse goods. Buy quality.',  bgColor: foodColors.forestGreen, action: 'products' },
  { id: 'subscription', icon: 'refresh-cw',   title: 'Subscriptions',       subtitle: 'Manage recurring cycles',     bgColor: foodColors.badgeBlue,   route: '/subscriptions' },
  { id: 'vendor',       icon: 'briefcase',    title: 'Vendor',              subtitle: 'Become a vendor partner',     bgColor: foodColors.primary,     route: '/vendor-partner' },
  { id: 'locations',    icon: 'map',          title: 'Our Locations',       subtitle: 'View service areas',          bgColor: foodColors.forestGreen, action: 'locations' },
  { id: 'payPerOrder',  icon: 'dollar-sign',  symbol: '₦', title: 'Pay Per Order', subtitle: 'Flexible one-off payments', bgColor: foodColors.badgeBlue, route: '/pay-per-pickup' },
];

const [echop, ewash, track, pickup, support, quality, eplan, offers] = quickServices;

/** Order used on the All Services screen. */
export const allServices: QuickService[] = [
  echop, ewash, track, pickup,
  ...extraServices,
  support, quality, eplan, offers,
];