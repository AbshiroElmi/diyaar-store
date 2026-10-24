import { api } from "../client";
import { ENDPOINTS } from "../endpoints";
import type { Category, Paginated, Product, ProductInput, ProductListParams } from "../types";

export const productsService = {
  list: (params: ProductListParams = {}) => api.get<Paginated<Product>>(ENDPOINTS.getProducts, { ...params }),
  create: (data: ProductInput) =>
    api.post<{ success: boolean; product: Product }>(ENDPOINTS.createProduct, data).then((r) => r.product),
  update: (productId: string, data: Partial<Product>) =>
    api.post<{ success: boolean; product: Product }>(ENDPOINTS.updateProduct, { product_id: productId, ...data }).then((r) => r.product),
  remove: (productId: string) => api.post<{ success: boolean }>(ENDPOINTS.deleteProduct, { product_id: productId }),
};

export const categoriesService = {
  list: () => api.get<{ success: boolean; categories: Category[] }>(ENDPOINTS.getCategories).then((r) => r.categories),
  create: (data: { category_name: string; description?: string }) =>
    api.post<{ success: boolean; category: Category }>(ENDPOINTS.createCategory, data).then((r) => r.category),
  update: (categoryId: string, data: Partial<Category>) =>
    api.post<{ success: boolean; category: Category }>(ENDPOINTS.updateCategory, { category_id: categoryId, ...data }).then((r) => r.category),
  remove: (categoryId: string) => api.post<{ success: boolean }>(ENDPOINTS.deleteCategory, { category_id: categoryId }),
};
