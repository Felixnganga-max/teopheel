import { api } from './client';
import { useQuery, useMutation } from './hooks';

// Products are gas brands + size, with an image (Cloudinary). Image upload is multipart.
function toFormData({ image, ...fields }) {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') fd.append(k, String(v)); });
  if (image) fd.append('image', image); // File from <input type="file" />
  return fd;
}

// Each product carries compatibleWith: [{ _id, brand, sizeKg, name, active }], the cylinders it can be swapped with
export const getProducts = () => api.get('/products');
export const getProduct = (id) => api.get(`/products/${id}`);
// { brand, sizeKg, refillPrice, fullPrice, image: File }  (owner)
export const createProduct = (payload) => api.post('/products', toFormData(payload));
// any of the above + active (boolean)
export const updateProduct = (id, payload) => api.patch(`/products/${id}`, toFormData(payload));
export const deactivateProduct = (id) => api.delete(`/products/${id}`);

// Owner. Same-size cylinders only; the link works both ways.
export const setProductCompatibility = (id, compatibleProductIds) => api.put(`/products/${id}/compatibility`, { compatibleProductIds });
// Owner. "Pro Gas swaps with Afri Gas and K-Gas", applied to every size both brands sell. Resolves data: [{ product, sizeKg, compatibleWith[] }]
export const setBrandCompatibility = (brand, compatibleBrands) => api.put('/products/brands/compatibility', { brand, compatibleBrands });

export const useProducts = (options) => useQuery(getProducts, [], options);
export const useProduct = (id, options) => useQuery(() => getProduct(id), [id], { enabled: !!id, ...options });
export const useCreateProduct = () => useMutation(createProduct);
export const useUpdateProduct = () => useMutation(({ id, ...payload }) => updateProduct(id, payload));
export const useDeactivateProduct = () => useMutation(deactivateProduct);
export const useSetProductCompatibility = () => useMutation(({ id, compatibleProductIds }) => setProductCompatibility(id, compatibleProductIds));
export const useSetBrandCompatibility = () => useMutation(({ brand, compatibleBrands }) => setBrandCompatibility(brand, compatibleBrands));
