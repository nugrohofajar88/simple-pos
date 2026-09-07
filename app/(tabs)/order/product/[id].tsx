import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppTextInput } from '@/src/components/AppTextInput';
import { getModifierGroupsWithOptions, getProduct, type ModifierGroupRow, type ModifierOptionRow } from '@/src/db/queries/menu';
import { useCartStore } from '@/src/store/cartStore';

type GroupWithOptions = ModifierGroupRow & { options: ModifierOptionRow[] };

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = Number(id);
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);

  const [productName, setProductName] = useState('');
  const [basePrice, setBasePrice] = useState(0);
  const [costPrice, setCostPrice] = useState(0);
  const [productFound, setProductFound] = useState(true);
  const [groups, setGroups] = useState<GroupWithOptions[]>([]);
  const [selected, setSelected] = useState<Record<number, Set<number>>>({});
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [product, groupRows] = await Promise.all([
        getProduct(productId),
        getModifierGroupsWithOptions(productId),
      ]);
      if (product) {
        setProductName(product.name);
        setBasePrice(product.basePrice);
        setCostPrice(product.costPrice);
      } else {
        setProductFound(false);
      }
      setGroups(groupRows);

      const initialSelected: Record<number, Set<number>> = {};
      for (const group of groupRows) {
        const defaults = group.options.filter((option) => option.isDefault).map((option) => option.id);
        initialSelected[group.id] = new Set(defaults);
      }
      setSelected(initialSelected);
      setLoading(false);
    })();
  }, [productId]);

  const toggleOption = (group: GroupWithOptions, optionId: number) => {
    setSelected((prev) => {
      const current = new Set(prev[group.id] ?? []);
      if (group.selectionType === 'single') {
        current.clear();
        current.add(optionId);
      } else {
        if (current.has(optionId)) current.delete(optionId);
        else current.add(optionId);
      }
      return { ...prev, [group.id]: current };
    });
  };

  const modifiersTotal = groups.reduce((sum, group) => {
    const selectedIds = selected[group.id] ?? new Set();
    const groupTotal = group.options
      .filter((option) => selectedIds.has(option.id))
      .reduce((groupSum, option) => groupSum + option.priceDelta, 0);
    return sum + groupTotal;
  }, 0);

  const unitTotal = basePrice + modifiersTotal;

  const handleAddToCart = () => {
    for (const group of groups) {
      if (group.isRequired && (selected[group.id]?.size ?? 0) === 0) {
        Alert.alert('Belum lengkap', `Pilih dulu "${group.name}".`);
        return;
      }
    }

    const modifiers = groups.flatMap((group) => {
      const selectedIds = selected[group.id] ?? new Set();
      return group.options
        .filter((option) => selectedIds.has(option.id))
        .map((option) => ({
          modifierGroupName: group.name,
          modifierOptionName: option.name,
          priceDelta: option.priceDelta,
        }));
    });

    addItem({ productId, productName, unitPrice: basePrice, costPrice, qty, note, modifiers });
    router.back();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!productFound) {
    return (
      <View style={styles.center}>
        <Text>Produk tidak ditemukan.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>{productName}</Text>
      <Text style={styles.basePrice}>Rp{basePrice.toLocaleString('id-ID')}</Text>

      {groups.map((group) => (
        <View key={group.id} style={styles.groupBlock}>
          <Text style={styles.groupName}>
            {group.name}
            {group.isRequired ? ' *' : ''}
          </Text>
          <View style={styles.optionRow}>
            {group.options.map((option) => {
              const isSelected = selected[group.id]?.has(option.id) ?? false;
              return (
                <Pressable
                  key={option.id}
                  style={[styles.optionChip, isSelected && styles.optionChipActive]}
                  onPress={() => toggleOption(group, option.id)}
                >
                  <Text style={[styles.optionChipText, isSelected && styles.optionChipTextActive]}>
                    {option.name}
                    {option.priceDelta > 0 ? ` (+${option.priceDelta.toLocaleString('id-ID')})` : ''}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      <Text style={styles.label}>Catatan (opsional)</Text>
      <AppTextInput style={styles.noteInput} value={note} onChangeText={setNote} placeholder="mis. less ice" />

      <View style={styles.qtyRow}>
        <Text style={styles.label}>Jumlah</Text>
        <View style={styles.qtyStepper}>
          <Pressable style={styles.qtyButton} onPress={() => setQty((q) => Math.max(1, q - 1))}>
            <Text style={styles.qtyButtonText}>-</Text>
          </Pressable>
          <Text style={styles.qtyValue}>{qty}</Text>
          <Pressable style={styles.qtyButton} onPress={() => setQty((q) => q + 1)}>
            <Text style={styles.qtyButtonText}>+</Text>
          </Pressable>
        </View>
      </View>

      <Pressable style={styles.addButton} onPress={handleAddToCart}>
        <Text style={styles.addButtonText}>
          Tambah ke Keranjang — Rp{(unitTotal * qty).toLocaleString('id-ID')}
        </Text>
      </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '600' },
  basePrice: { fontSize: 15, color: '#555', marginBottom: 16 },
  groupBlock: { marginBottom: 16 },
  groupName: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: { borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14 },
  optionChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  optionChipText: { color: '#333' },
  optionChipTextActive: { color: '#fff', fontWeight: '600' },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  noteInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 14, marginBottom: 16 },
  qtyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  qtyStepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  qtyButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonText: { fontSize: 18, fontWeight: '600' },
  qtyValue: { fontSize: 16, fontWeight: '600', minWidth: 24, textAlign: 'center' },
  addButton: { backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 32 },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
