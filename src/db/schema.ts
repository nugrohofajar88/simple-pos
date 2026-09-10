import { relations, sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Cache read-only hasil GET /api/menu - id = id server LANGSUNG (bukan autoincrement lokal),
// gak ada remoteId/updatedAt/deletedAt/syncedAt lagi krn server satu-satunya sumber kebenaran.
// Diisi ulang total (delete-all lalu insert) tiap kali fetchMenu() sukses - lihat src/api/menuApi.ts.
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
});

export const products = sqliteTable('products', {
  id: integer('id').primaryKey(),
  categoryId: integer('category_id')
    .notNull()
    .references(() => categories.id),
  name: text('name').notNull(),
  basePrice: real('base_price').notNull(),
  costPrice: real('cost_price').notNull().default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const modifierGroups = sqliteTable('modifier_groups', {
  id: integer('id').primaryKey(),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  name: text('name').notNull(),
  selectionType: text('selection_type', { enum: ['single', 'multiple'] }).notNull(),
  isRequired: integer('is_required', { mode: 'boolean' }).notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const modifierOptions = sqliteTable('modifier_options', {
  id: integer('id').primaryKey(),
  modifierGroupId: integer('modifier_group_id')
    .notNull()
    .references(() => modifierGroups.id),
  name: text('name').notNull(),
  priceDelta: real('price_delta').notNull().default(0),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderNumber: text('order_number').notNull().unique(),
  status: text('status', { enum: ['completed', 'voided'] }).notNull().default('completed'),
  customerName: text('customer_name'),
  subtotal: real('subtotal').notNull(),
  total: real('total').notNull(),
  paymentMethod: text('payment_method').notNull(),
  note: text('note'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
  remoteId: integer('remote_id'),
  syncedAt: text('synced_at'),
  // Penanda "user hapus order ini" - bukan LWW/2 arah, cuma sinyal 1 arah HP->server.
  // Order disembunyikan dari UI begitu ini keisi, baris beneran kehapus (lokal+server)
  // begitu sync konfirmasi. Lihat SyncService.pushDeletedOrders().
  deletedAt: text('deleted_at'),
});

export const orderItems = sqliteTable('order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id),
  productId: integer('product_id').references(() => products.id),
  productName: text('product_name').notNull(),
  unitPrice: real('unit_price').notNull(),
  costPrice: real('cost_price').notNull().default(0),
  qty: integer('qty').notNull(),
  note: text('note'),
  printed: integer('printed', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
  remoteId: integer('remote_id'),
  syncedAt: text('synced_at'),
});

export const orderItemModifiers = sqliteTable('order_item_modifiers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderItemId: integer('order_item_id')
    .notNull()
    .references(() => orderItems.id),
  modifierGroupName: text('modifier_group_name').notNull(),
  modifierOptionName: text('modifier_option_name').notNull(),
  priceDelta: real('price_delta').notNull().default(0),
});

export const expenses = sqliteTable('expenses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  description: text('description').notNull(),
  amount: real('amount').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
  remoteId: integer('remote_id'),
  syncedAt: text('synced_at'),
});

export const otherIncomes = sqliteTable('other_incomes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  description: text('description').notNull(),
  amount: real('amount').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
  remoteId: integer('remote_id'),
  syncedAt: text('synced_at'),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  modifierGroups: many(modifierGroups),
}));

export const modifierGroupsRelations = relations(modifierGroups, ({ one, many }) => ({
  product: one(products, { fields: [modifierGroups.productId], references: [products.id] }),
  options: many(modifierOptions),
}));

export const modifierOptionsRelations = relations(modifierOptions, ({ one }) => ({
  modifierGroup: one(modifierGroups, {
    fields: [modifierOptions.modifierGroupId],
    references: [modifierGroups.id],
  }),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
  modifiers: many(orderItemModifiers),
}));

export const orderItemModifiersRelations = relations(orderItemModifiers, ({ one }) => ({
  orderItem: one(orderItems, { fields: [orderItemModifiers.orderItemId], references: [orderItems.id] }),
}));
