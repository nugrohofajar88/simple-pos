import { apiFetch } from '@/src/api/client';
import { replaceMenuCache, type MenuSnapshot } from '@/src/db/queries/menu';

/**
 * Ambil snapshot menu penuh dari server & replace total cache lokal. Dipanggil setiap layar
 * Menu/Order dibuka (best-effort) & saat app dibuka/tekan Sync - server satu-satunya sumber
 * kebenaran, jadi gak ada merge/reconcile, cuma "apa kata server sekarang".
 */
export async function fetchMenu(): Promise<MenuSnapshot> {
  const { data } = await apiFetch('/menu');
  const snapshot: MenuSnapshot = data;
  await replaceMenuCache(snapshot);
  return snapshot;
}

export async function createCategory(name: string) {
  await apiFetch('/categories', { method: 'POST', body: JSON.stringify({ name }) });
  await fetchMenu();
}

export async function updateCategory(id: number, name: string) {
  await apiFetch(`/categories/${id}`, { method: 'PUT', body: JSON.stringify({ name }) });
  await fetchMenu();
}

export async function deleteCategory(id: number) {
  await apiFetch(`/categories/${id}`, { method: 'DELETE' });
  await fetchMenu();
}

export async function createProduct(input: { categoryId: number; name: string; basePrice: number; costPrice: number }) {
  await apiFetch('/products', {
    method: 'POST',
    body: JSON.stringify({
      category_id: input.categoryId,
      name: input.name,
      base_price: input.basePrice,
      cost_price: input.costPrice,
    }),
  });
  await fetchMenu();
}

export async function updateProduct(
  id: number,
  input: { name: string; basePrice: number; costPrice: number; categoryId: number }
) {
  await apiFetch(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      category_id: input.categoryId,
      name: input.name,
      base_price: input.basePrice,
      cost_price: input.costPrice,
    }),
  });
  await fetchMenu();
}

export async function deleteProduct(id: number) {
  await apiFetch(`/products/${id}`, { method: 'DELETE' });
  await fetchMenu();
}

export async function createModifierGroup(input: {
  productId: number;
  name: string;
  selectionType: 'single' | 'multiple';
  isRequired: boolean;
}) {
  await apiFetch(`/products/${input.productId}/modifier-groups`, {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      selection_type: input.selectionType,
      is_required: input.isRequired,
    }),
  });
  await fetchMenu();
}

export async function updateModifierGroup(
  id: number,
  input: { name: string; selectionType: 'single' | 'multiple'; isRequired: boolean }
) {
  await apiFetch(`/modifier-groups/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: input.name,
      selection_type: input.selectionType,
      is_required: input.isRequired,
    }),
  });
  await fetchMenu();
}

export async function deleteModifierGroup(id: number) {
  await apiFetch(`/modifier-groups/${id}`, { method: 'DELETE' });
  await fetchMenu();
}

export async function createModifierOption(input: {
  modifierGroupId: number;
  name: string;
  priceDelta: number;
  isDefault: boolean;
}) {
  await apiFetch(`/modifier-groups/${input.modifierGroupId}/options`, {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      price_delta: input.priceDelta,
      is_default: input.isDefault,
    }),
  });
  await fetchMenu();
}

export async function updateModifierOption(id: number, input: { name: string; priceDelta: number; isDefault: boolean }) {
  await apiFetch(`/modifier-options/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: input.name,
      price_delta: input.priceDelta,
      is_default: input.isDefault,
    }),
  });
  await fetchMenu();
}

export async function deleteModifierOption(id: number) {
  await apiFetch(`/modifier-options/${id}`, { method: 'DELETE' });
  await fetchMenu();
}
