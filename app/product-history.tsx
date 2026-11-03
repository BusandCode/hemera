// Product History was merged into My Orders / Order History (under "Store").
import { Redirect } from 'expo-router';

export default function ProductHistoryRedirect() {
  return <Redirect href={'/my-orders' as any} />;
}
