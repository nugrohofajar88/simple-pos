import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createModifierGroup, createModifierOption, deleteModifierGroup, deleteModifierOption } from '@/src/api/menuApi';
import { AppTextInput } from '@/src/components/AppTextInput';
import { CurrencyInput } from '@/src/components/CurrencyInput';
import {
  getModifierGroupsWithOptions,
  getProduct,
  type ModifierGroupRow,
  type ModifierOptionRow,
} from '@/src/db/queries/menu';

type GroupWithOptions = ModifierGroupRow & { options: ModifierOptionRow[] };

export default function ProductModifiersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = Number(id);

  const [productName, setProductName] = useState('');
  const [groups, setGroups] = useState<GroupWithOptions[]>([]);
  const [loading, setLoading] = useState(true);

  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupMultiple, setNewGroupMultiple] = useState(false);
  const [newGroupRequired, setNewGroupRequired] = useState(false);

  const [optionForms, setOptionForms] = useState<Record<number, { name: string; priceDelta: string }>>({});

  const load = useCallback(async () => {
    const [product, groupRows] = await Promise.all([getProduct(productId), getModifierGroupsWithOptions(productId)]);
    setProductName(product?.name ?? '');
    setGroups(groupRows);
    setLoading(false);
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) {
      Alert.alert('Nama kosong', 'Nama grup modifier harus diisi (mis. Size, Suhu, Level Gula).');
      return;
    }
    try {
      await createModifierGroup({
        productId,
        name: newGroupName.trim(),
        selectionType: newGroupMultiple ? 'multiple' : 'single',
        isRequired: newGroupRequired,
      });
      setNewGroupName('');
      setNewGroupMultiple(false);
      setNewGroupRequired(false);
      load();
    } catch (error) {
      Alert.alert('Gagal simpan', String((error as Error).message ?? error));
    }
  };

  const handleDeleteGroup = (group: GroupWithOptions) => {
    Alert.alert('Hapus Grup Modifier', `Yakin hapus grup "${group.name}" beserta semua opsinya?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteModifierGroup(group.id);
            load();
          } catch (error) {
            Alert.alert('Gagal hapus', String((error as Error).message ?? error));
          }
        },
      },
    ]);
  };

  const handleAddOption = async (groupId: number) => {
    const form = optionForms[groupId];
    if (!form?.name?.trim()) {
      Alert.alert('Nama kosong', 'Nama opsi harus diisi.');
      return;
    }
    const priceDelta = form.priceDelta ? Number(form.priceDelta) : 0;
    if (Number.isNaN(priceDelta)) {
      Alert.alert('Harga tambahan tidak valid', 'Isi angka, boleh 0.');
      return;
    }
    try {
      await createModifierOption({ modifierGroupId: groupId, name: form.name.trim(), priceDelta, isDefault: false });
      setOptionForms((prev) => ({ ...prev, [groupId]: { name: '', priceDelta: '' } }));
      load();
    } catch (error) {
      Alert.alert('Gagal simpan', String((error as Error).message ?? error));
    }
  };

  const handleDeleteOption = (option: ModifierOptionRow) => {
    Alert.alert('Hapus Opsi', `Yakin hapus opsi "${option.name}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteModifierOption(option.id);
            load();
          } catch (error) {
            Alert.alert('Gagal hapus', String((error as Error).message ?? error));
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
      <Text style={styles.title}>Modifier — {productName}</Text>

      {groups.length === 0 && (
        <Text style={styles.emptyHint}>Belum ada grup modifier. Tambah lewat form di bawah.</Text>
      )}

      {groups.map((group) => (
        <View key={group.id} style={styles.groupBlock}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupName}>
              {group.name} <Text style={styles.groupMeta}>({group.selectionType === 'multiple' ? 'multi' : 'single'}{group.isRequired ? ', wajib' : ''})</Text>
            </Text>
            <Pressable onPress={() => handleDeleteGroup(group)}>
              <Text style={styles.deleteLink}>Hapus</Text>
            </Pressable>
          </View>

          {group.options.map((option) => (
            <View key={option.id} style={styles.optionRow}>
              <Text style={styles.optionText}>
                {option.name} {option.priceDelta > 0 ? `(+Rp${option.priceDelta.toLocaleString('id-ID')})` : ''}
                {option.isDefault ? ' · default' : ''}
              </Text>
              <Pressable onPress={() => handleDeleteOption(option)}>
                <Text style={styles.deleteLinkSmall}>Hapus</Text>
              </Pressable>
            </View>
          ))}

          <View style={styles.addOptionRow}>
            <AppTextInput
              style={styles.optionInput}
              placeholder="Nama opsi"
              value={optionForms[group.id]?.name ?? ''}
              onChangeText={(text) =>
                setOptionForms((prev) => ({ ...prev, [group.id]: { ...prev[group.id], name: text, priceDelta: prev[group.id]?.priceDelta ?? '' } }))
              }
            />
            <CurrencyInput
              style={styles.priceInput}
              placeholder="+Rp"
              value={optionForms[group.id]?.priceDelta ?? ''}
              onChangeText={(text) =>
                setOptionForms((prev) => ({ ...prev, [group.id]: { name: prev[group.id]?.name ?? '', priceDelta: text } }))
              }
            />
            <Pressable style={styles.addOptionButton} onPress={() => handleAddOption(group.id)}>
              <Text style={styles.addOptionButtonText}>+</Text>
            </Pressable>
          </View>
        </View>
      ))}

      <View style={styles.newGroupBlock}>
        <Text style={styles.newGroupTitle}>Tambah Grup Modifier Baru</Text>
        <AppTextInput
          style={styles.input}
          placeholder="mis. Size, Suhu, Level Gula"
          value={newGroupName}
          onChangeText={setNewGroupName}
        />
        <View style={styles.switchRow}>
          <Text>Boleh pilih lebih dari satu</Text>
          <Switch value={newGroupMultiple} onValueChange={setNewGroupMultiple} />
        </View>
        <View style={styles.switchRow}>
          <Text>Wajib dipilih</Text>
          <Switch value={newGroupRequired} onValueChange={setNewGroupRequired} />
        </View>
        <Pressable style={styles.saveButton} onPress={handleAddGroup}>
          <Text style={styles.saveButtonText}>Tambah Grup</Text>
        </Pressable>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  emptyHint: { color: '#888', fontSize: 13, marginBottom: 16 },
  groupBlock: { marginBottom: 20, borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 12 },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  groupName: { fontSize: 16, fontWeight: '600' },
  groupMeta: { fontSize: 12, fontWeight: '400', color: '#888' },
  deleteLink: { color: '#dc2626', fontSize: 13 },
  deleteLinkSmall: { color: '#dc2626', fontSize: 12 },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, paddingLeft: 8 },
  optionText: { fontSize: 14, color: '#333' },
  addOptionRow: { flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' },
  optionInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 8, fontSize: 14 },
  priceInput: { width: 90, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 8, fontSize: 14 },
  addOptionButton: { backgroundColor: '#2563eb', width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  addOptionButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  newGroupBlock: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 16, marginTop: 8, marginBottom: 32, gap: 10 },
  newGroupTitle: { fontSize: 15, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  saveButton: { backgroundColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  saveButtonText: { color: '#fff', fontWeight: '600' },
});
