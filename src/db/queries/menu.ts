import { and, eq } from 'drizzle-orm';

import { db } from '@/src/db/client';
import { categories, modifierGroups, modifierOptions, products } from '@/src/db/schema';

export type CategoryRow = typeof categories.$inferSelect;
export type ProductRow = typeof products.$inferSelect;
export type ModifierGroupRow = typeof modifierGroups.$inferSelect;
export type ModifierOptionRow = typeof modifierOptions.$inferSelect;

export async function getCategories() {
  return db.select().from(categories).orderBy(categories.sortOrder);
}

export async function getProductsByCategory(categoryId: number) {
  return db.select().from(products).where(eq(products.categoryId, categoryId)).orderBy(products.sortOrder);
}

export async function getAllProducts() {
  return db.select().from(products).orderBy(products.sortOrder);
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
  const groups = await db.select().from(modifierGroups).where(eq(modifierGroups.productId, productId)).orderBy(modifierGroups.sortOrder);

  const groupsWithOptions = [];
  for (const group of groups) {
    const options = await db
      .select()
      .from(modifierOptions)
      .where(eq(modifierOptions.modifierGroupId, group.id))
      .orderBy(modifierOptions.sortOrder);
    groupsWithOptions.push({ ...group, options });
  }
  return groupsWithOptions;
}

export type MenuSnapshot = {
  categories: CategoryRow[];
  products: ProductRow[];
  modifierGroups: ModifierGroupRow[];
  modifierOptions: ModifierOptionRow[];
};

/**
 * Ganti total isi cache lokal dengan snapshot terbaru dari server (bukan merge/reconcile -
 * server satu-satunya sumber kebenaran, jadi delete-all lalu insert ulang paling simpel & benar).
 */
export async function replaceMenuCache(snapshot: MenuSnapshot) {
  return db.transaction(async (tx) => {
    await tx.delete(modifierOptions);
    await tx.delete(modifierGroups);
    await tx.delete(products);
    await tx.delete(categories);

    if (snapshot.categories.length > 0) {
      await tx.insert(categories).values(snapshot.categories);
    }
    if (snapshot.products.length > 0) {
      await tx.insert(products).values(snapshot.products);
    }
    if (snapshot.modifierGroups.length > 0) {
      await tx.insert(modifierGroups).values(snapshot.modifierGroups);
    }
    if (snapshot.modifierOptions.length > 0) {
      await tx.insert(modifierOptions).values(snapshot.modifierOptions);
    }
  });
}
