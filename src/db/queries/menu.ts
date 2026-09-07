import { and, eq, isNull } from 'drizzle-orm';

import { db } from '@/src/db/client';
import { categories, modifierGroups, modifierOptions, products } from '@/src/db/schema';

export type CategoryRow = typeof categories.$inferSelect;
export type ProductRow = typeof products.$inferSelect;
export type ModifierGroupRow = typeof modifierGroups.$inferSelect;
export type ModifierOptionRow = typeof modifierOptions.$inferSelect;

export function sqliteNow(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

export async function getCategories() {
  return db
    .select()
    .from(categories)
    .where(isNull(categories.deletedAt))
    .orderBy(categories.sortOrder);
}

export async function getProductsByCategory(categoryId: number) {
  return db
    .select()
    .from(products)
    .where(and(eq(products.categoryId, categoryId), isNull(products.deletedAt)))
    .orderBy(products.sortOrder);
}

export async function getAllProducts() {
  return db.select().from(products).where(isNull(products.deletedAt)).orderBy(products.sortOrder);
}

export async function getCategory(id: number) {
  const [row] = await db.select().from(categories).where(eq(categories.id, id));
  return row;
}

export async function getProduct(id: number) {
  const [row] = await db.select().from(products).where(eq(products.id, id));
  return row;
}

export async function getModifierGroupsWithOptions(productId: number) {
  const groups = await db
    .select()
    .from(modifierGroups)
    .where(and(eq(modifierGroups.productId, productId), isNull(modifierGroups.deletedAt)))
    .orderBy(modifierGroups.sortOrder);

  const groupsWithOptions = [];
  for (const group of groups) {
    const options = await db
      .select()
      .from(modifierOptions)
      .where(and(eq(modifierOptions.modifierGroupId, group.id), isNull(modifierOptions.deletedAt)))
      .orderBy(modifierOptions.sortOrder);
    groupsWithOptions.push({ ...group, options });
  }
  return groupsWithOptions;
}

export async function createCategory(name: string) {
  const existing = await getCategories();
  const [row] = await db
    .insert(categories)
    .values({ name, sortOrder: existing.length, updatedAt: sqliteNow() })
    .returning();
  return row;
}

export async function updateCategory(id: number, name: string) {
  await db.update(categories).set({ name, updatedAt: sqliteNow() }).where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  const productsInCategory = await getProductsByCategory(id);
  if (productsInCategory.length > 0) {
    throw new Error('Kategori masih punya produk, hapus/pindahkan produknya dulu.');
  }
  const now = sqliteNow();
  await db.update(categories).set({ deletedAt: now, updatedAt: now }).where(eq(categories.id, id));
}

export async function createProduct(input: { categoryId: number; name: string; basePrice: number; costPrice: number }) {
  const existing = await getProductsByCategory(input.categoryId);
  const [row] = await db
    .insert(products)
    .values({ ...input, sortOrder: existing.length, updatedAt: sqliteNow() })
    .returning();
  return row;
}

export async function updateProduct(
  id: number,
  input: { name: string; basePrice: number; costPrice: number; categoryId: number }
) {
  await db.update(products).set({ ...input, updatedAt: sqliteNow() }).where(eq(products.id, id));
}

export async function deleteProduct(id: number) {
  const now = sqliteNow();
  const groups = await db
    .select()
    .from(modifierGroups)
    .where(and(eq(modifierGroups.productId, id), isNull(modifierGroups.deletedAt)));
  for (const group of groups) {
    await db
      .update(modifierOptions)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(modifierOptions.modifierGroupId, group.id));
  }
  await db.update(modifierGroups).set({ deletedAt: now, updatedAt: now }).where(eq(modifierGroups.productId, id));
  await db.update(products).set({ deletedAt: now, updatedAt: now }).where(eq(products.id, id));
}

export async function createModifierGroup(input: {
  productId: number;
  name: string;
  selectionType: 'single' | 'multiple';
  isRequired: boolean;
}) {
  const existing = await db
    .select()
    .from(modifierGroups)
    .where(and(eq(modifierGroups.productId, input.productId), isNull(modifierGroups.deletedAt)));
  const [row] = await db
    .insert(modifierGroups)
    .values({ ...input, sortOrder: existing.length, updatedAt: sqliteNow() })
    .returning();
  return row;
}

export async function updateModifierGroup(
  id: number,
  input: { name: string; selectionType: 'single' | 'multiple'; isRequired: boolean }
) {
  await db.update(modifierGroups).set({ ...input, updatedAt: sqliteNow() }).where(eq(modifierGroups.id, id));
}

export async function deleteModifierGroup(id: number) {
  const now = sqliteNow();
  await db.update(modifierOptions).set({ deletedAt: now, updatedAt: now }).where(eq(modifierOptions.modifierGroupId, id));
  await db.update(modifierGroups).set({ deletedAt: now, updatedAt: now }).where(eq(modifierGroups.id, id));
}

export async function createModifierOption(input: {
  modifierGroupId: number;
  name: string;
  priceDelta: number;
  isDefault: boolean;
}) {
  const existing = await db
    .select()
    .from(modifierOptions)
    .where(and(eq(modifierOptions.modifierGroupId, input.modifierGroupId), isNull(modifierOptions.deletedAt)));
  const [row] = await db
    .insert(modifierOptions)
    .values({ ...input, sortOrder: existing.length, updatedAt: sqliteNow() })
    .returning();
  return row;
}

export async function updateModifierOption(
  id: number,
  input: { name: string; priceDelta: number; isDefault: boolean }
) {
  await db.update(modifierOptions).set({ ...input, updatedAt: sqliteNow() }).where(eq(modifierOptions.id, id));
}

export async function deleteModifierOption(id: number) {
  const now = sqliteNow();
  await db.update(modifierOptions).set({ deletedAt: now, updatedAt: now }).where(eq(modifierOptions.id, id));
}
