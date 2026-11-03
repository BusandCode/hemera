// Old address: Store orders are in My Orders / Order History now.
import { Redirect } from 'expo-router';

export default function OurProductsOrdersRedirect() {
  return <Redirect href={'/my-orders' as any} />;
}
