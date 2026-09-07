import type { db as Db } from './client';
import { categories, modifierGroups, modifierOptions, products } from './schema';

const STANDARD_MODIFIER_GROUPS = [
  {
    name: 'Size',
    isRequired: true,
    options: [
      { name: 'Regular', priceDelta: 0, isDefault: true },
      { name: 'Large', priceDelta: 5000, isDefault: false },
    ],
  },
  {
    name: 'Suhu',
    isRequired: true,
    options: [
      { name: 'Iced', priceDelta: 0, isDefault: true },
      { name: 'Hot', priceDelta: 0, isDefault: false },
    ],
  },
  {
    name: 'Level Gula',
    isRequired: false,
    options: [
      { name: 'Normal', priceDelta: 0, isDefault: true },
      { name: 'Less Sugar', priceDelta: 0, isDefault: false },
      { name: 'No Sugar', priceDelta: 0, isDefault: false },
    ],
  },
] as const;

async function addStandardModifiers(database: typeof Db, productId: number) {
  for (const [groupIndex, group] of STANDARD_MODIFIER_GROUPS.entries()) {
    const [insertedGroup] = await database.insert(modifierGroups).values({
      productId,
      name: group.name,
      selectionType: 'single',
      isRequired: group.isRequired,
      sortOrder: groupIndex,
    }).returning();

    await database.insert(modifierOptions).values(
      group.options.map((option, optionIndex) => ({
        modifierGroupId: insertedGroup.id,
        name: option.name,
        priceDelta: option.priceDelta,
        isDefault: option.isDefault,
        sortOrder: optionIndex,
      }))
    );
  }
}

export async function seedIfEmpty(database: typeof Db) {
  const existing = await database.select().from(categories).limit(1);
  if (existing.length > 0) return;

  const [kopi] = await database.insert(categories).values({ name: 'Kopi', sortOrder: 0 }).returning();
  const [nonKopi] = await database.insert(categories).values({ name: 'Non-Kopi', sortOrder: 1 }).returning();
  const [snack] = await database.insert(categories).values({ name: 'Snack', sortOrder: 2 }).returning();

  const drinkProducts = [
    { categoryId: kopi.id, name: 'Cafe Latte', basePrice: 22000, sortOrder: 0 },
    { categoryId: kopi.id, name: 'Americano', basePrice: 18000, sortOrder: 1 },
    { categoryId: kopi.id, name: 'Cappuccino', basePrice: 22000, sortOrder: 2 },
    { categoryId: nonKopi.id, name: 'Chocolate', basePrice: 20000, sortOrder: 0 },
    { categoryId: nonKopi.id, name: 'Matcha Latte', basePrice: 23000, sortOrder: 1 },
  ];

  for (const product of drinkProducts) {
    const [inserted] = await database.insert(products).values(product).returning();
    await addStandardModifiers(database, inserted.id);
  }

  await database.insert(products).values({
    categoryId: snack.id,
    name: 'Croffle Original',
    basePrice: 25000,
    sortOrder: 0,
  });
}
