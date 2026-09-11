import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  createModifierGroup,
  createModifierOption,
  deleteModifierGroup,
  deleteModifierOption,
  updateModifierGroup,
  updateModifierOption,
} from '@/src/api/menuApi';
import { AppTextInput } from '@/src/components/AppTextInput';
import { CurrencyInput } from '@/src/components/CurrencyInput';
import {
  getModifierGroupsWithOptions,
  getProduct,
  type ModifierGroupRow,
  type ModifierOptionRow,
} from '@/src/db/queries/menu';
import { colors, fonts, radius } from '@/src/theme';

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

  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [groupEditForm, setGroupEditForm] = useState({ name: '', multiple: false, required: false });

  const [editingOptionId, setEditingOptionId] = useState<number | null>(null);
  const [optionEditForm, setOptionEditForm] = useState({ name: '', priceDelta: '', isDefault: false });

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

  const startEditGroup = (group: GroupWithOptions) => {
    setEditingGroupId(group.id);
    setGroupEditForm({
      name: group.name,
      multiple: group.selectionType === 'multiple',
      required: group.isRequired,
    });
  };

  const handleSaveGroup = async () => {
    if (!groupEditForm.name.trim() || editingGroupId === null) {
      Alert.alert('Nama kosong', 'Nama grup modifier harus diisi.');
      return;
    }
    try {
      await updateModifierGroup(editingGroupId, {
        name: groupEditForm.name.trim(),
        selectionType: groupEditForm.multiple ? 'multiple' : 'single',
        isRequired: groupEditForm.required,
      });
      setEditingGroupId(null);
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

  const startEditOption = (option: ModifierOptionRow) => {
    setEditingOptionId(option.id);
    setOptionEditForm({
      name: option.name,
      priceDelta: String(option.priceDelta),
      isDefault: option.isDefault,
    });
  };

  const handleSaveOption = async () => {
    if (!optionEditForm.name.trim() || editingOptionId === null) {
      Alert.alert('Nama kosong', 'Nama opsi harus diisi.');
      return;
    }
    const priceDelta = optionEditForm.priceDelta ? Number(optionEditForm.priceDelta) : 0;
    if (Number.isNaN(priceDelta)) {
      Alert.alert('Harga tambahan tidak valid', 'Isi angka, boleh 0.');
      return;
    }
    try {
      await updateModifierOption(editingOptionId, {
        name: optionEditForm.name.trim(),
        priceDelta,
        isDefault: optionEditForm.isDefault,
      });
      setEditingOptionId(null);
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
          {editingGroupId === group.id ? (
            <View style={styles.editBlock}>
              <AppTextInput
                style={styles.input}
                value={groupEditForm.name}
                onChangeText={(text) => setGroupEditForm((prev) => ({ ...prev, name: text }))}
              />
              <View style={styles.switchRow}>
                <Text>Boleh pilih lebih dari satu</Text>
                <Switch
                  value={groupEditForm.multiple}
                  onValueChange={(value) => setGroupEditForm((prev) => ({ ...prev, multiple: value }))}
                />
              </View>
              <View style={styles.switchRow}>
                <Text>Wajib dipilih</Text>
                <Switch
                  value={groupEditForm.required}
                  onValueChange={(value) => setGroupEditForm((prev) => ({ ...prev, required: value }))}
                />
              </View>
              <View style={styles.editActionRow}>
                <Pressable style={styles.saveButtonSmall} onPress={handleSaveGroup}>
                  <Text style={styles.saveButtonText}>Simpan</Text>
                </Pressable>
                <Pressable style={styles.cancelButton} onPress={() => setEditingGroupId(null)}>
                  <Text style={styles.cancelButtonText}>Batal</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.groupHeader}>
              <Text style={styles.groupName}>
                {group.name} <Text style={styles.groupMeta}>({group.selectionType === 'multiple' ? 'multi' : 'single'}{group.isRequired ? ', wajib' : ''})</Text>
              </Text>
              <View style={styles.groupHeaderActions}>
                <Pressable onPress={() => startEditGroup(group)}>
                  <Text style={styles.editLink}>Edit</Text>
                </Pressable>
                <Pressable onPress={() => handleDeleteGroup(group)}>
                  <Text style={styles.deleteLink}>Hapus</Text>
                </Pressable>
              </View>
            </View>
          )}

          {group.options.map((option) =>
            editingOptionId === option.id ? (
              <View key={option.id} style={styles.editOptionBlock}>
                <View style={styles.addOptionRow}>
                  <AppTextInput
                    style={styles.optionInput}
                    value={optionEditForm.name}
                    onChangeText={(text) => setOptionEditForm((prev) => ({ ...prev, name: text }))}
                  />
                  <CurrencyInput
                    style={styles.priceInput}
                    value={optionEditForm.priceDelta}
                    onChangeText={(text) => setOptionEditForm((prev) => ({ ...prev, priceDelta: text }))}
                  />
                </View>
                <View style={styles.switchRow}>
                  <Text style={styles.optionText}>Default</Text>
                  <Switch
                    value={optionEditForm.isDefault}
                    onValueChange={(value) => setOptionEditForm((prev) => ({ ...prev, isDefault: value }))}
                  />
                </View>
                <View style={styles.editActionRow}>
                  <Pressable style={styles.saveButtonSmall} onPress={handleSaveOption}>
                    <Text style={styles.saveButtonText}>Simpan</Text>
                  </Pressable>
                  <Pressable style={styles.cancelButton} onPress={() => setEditingOptionId(null)}>
                    <Text style={styles.cancelButtonText}>Batal</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View key={option.id} style={styles.optionRow}>
                <Text style={styles.optionText}>
                  {option.name} {option.priceDelta > 0 ? `(+Rp${option.priceDelta.toLocaleString('id-ID')})` : ''}
                  {option.isDefault ? ' · default' : ''}
                </Text>
                <View style={styles.groupHeaderActions}>
                  <Pressable onPress={() => startEditOption(option)}>
                    <Text style={styles.editLinkSmall}>Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => handleDeleteOption(option)}>
                    <Text style={styles.deleteLinkSmall}>Hapus</Text>
                  </Pressable>
                </View>
              </View>
            )
          )}

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
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  title: { fontSize: 18, fontFamily: fonts.semiBold, color: colors.textPrimary, marginBottom: 16 },
  emptyHint: { color: colors.textMuted, fontSize: 13, marginBottom: 16, fontFamily: fonts.regular },
  groupBlock: { marginBottom: 20, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12 },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  groupHeaderActions: { flexDirection: 'row', gap: 12 },
  groupName: { fontSize: 16, fontFamily: fonts.semiBold, color: colors.textPrimary },
  groupMeta: { fontSize: 12, fontFamily: fonts.regular, color: colors.textMuted },
  editLink: { color: colors.primary, fontSize: 13, fontFamily: fonts.regular },
  editLinkSmall: { color: colors.primary, fontSize: 12, fontFamily: fonts.regular },
  deleteLink: { color: colors.destructive, fontSize: 13, fontFamily: fonts.regular },
  deleteLinkSmall: { color: colors.destructive, fontSize: 12, fontFamily: fonts.regular },
  editBlock: { gap: 8, marginBottom: 8 },
  editOptionBlock: {
    gap: 8,
    paddingLeft: 8,
    paddingVertical: 6,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.sm,
    marginBottom: 4,
  },
  editActionRow: { flexDirection: 'row', gap: 8 },
  saveButtonSmall: { backgroundColor: colors.primary, paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.sm },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: { color: colors.textSecondary, fontFamily: fonts.semiBold, fontSize: 13 },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, paddingLeft: 8 },
  optionText: { fontSize: 14, color: colors.textSecondary, fontFamily: fonts.regular },
  addOptionRow: { flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' },
  optionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: 8,
    fontSize: 14,
    backgroundColor: colors.card,
  },
  priceInput: {
    width: 90,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: 8,
    fontSize: 14,
    backgroundColor: colors.card,
  },
  addOptionButton: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addOptionButtonText: { color: colors.onPrimary, fontSize: 18, fontFamily: fonts.semiBold },
  newGroupBlock: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16, marginTop: 8, marginBottom: 32, gap: 10 },
  newGroupTitle: { fontSize: 15, fontFamily: fonts.semiBold, color: colors.textPrimary },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.card,
  },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  saveButton: { backgroundColor: colors.primary, padding: 14, borderRadius: radius.sm, alignItems: 'center', marginTop: 4 },
  saveButtonText: { color: colors.onPrimary, fontFamily: fonts.semiBold },
});
