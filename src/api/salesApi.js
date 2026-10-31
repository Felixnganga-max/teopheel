// The call-taking screen: what's in stock for the customer's area, then dispatch.
import { api } from './client';
import { useQuery, useMutation } from './hooks';

// Rows: { location, product: { _id, name, brand, sizeKg, image, refillPrice, fullPrice }, full, empty }
// Location admins always get their own shop. Owners can pass locationId or the customer's typed area.
export const getAvailableStock = ({ locationId, area } = {}) => api.get('/stock/available', { locationId, area });

// payload: {
//   customerName, deliveryAddress, productId,
//   orderType: 'refill' | 'full_purchase', quantity,
//   returnedProductId?,                       // refill where the empty is a compatible brand (all empties)
//   returns?: [{ productId, quantity }],      // or a mix; quantities add up to `quantity`
//   phone?,                                   // omit to add it later via attachPhone
//   paymentMode: 'instant' | 'invoice',
//   customerId?, invoiceWhatsapp?,            // invoice orders (corporate customer)
//   rider?: { name, phone? },
//   locationId?                               // owners only
// }
// Resolves data: { order, payLink, invoice, whatsapp }
//   whatsapp.whatsappLink -> window.open(...) to share the invoice PDF link
export const dispatchOrder = (payload) => api.post('/orders', payload);

export const useAvailableStock = (params = {}, options) =>
  useQuery(() => getAvailableStock(params), [params.locationId, params.area], options);

export const useDispatchOrder = () => useMutation(dispatchOrder);
