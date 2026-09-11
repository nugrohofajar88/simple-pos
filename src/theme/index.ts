// Palet & tipografi "KopiKala" - diturunkan dari kopikala_pos/DESIGN.md (Core Roles + Surface System).

export const colors = {
  primary: '#2C1810', // Deep Roasted Espresso - tombol utama, link, state aktif
  onPrimary: '#FFFFFF',
  secondary: '#D97736', // Terracotta Caramel - highlight sekunder, badge terpilih
  onSecondary: '#FFFFFF',
  success: '#2E7D32', // Fresh Matcha - status positif (sync/printer connected, margin)
  destructive: '#C2410C', // Burned Brick - tombol/teks hapus, void
  warningBg: '#FFDBC9',
  warningText: '#753400',
  background: '#FFF8F5', // Steamed Milk - bg layar
  surfaceContainerLow: '#FDF1EB', // bg section halus
  card: '#FFFFFF',
  border: '#EAE3D9',
  textPrimary: '#201B17',
  textSecondary: '#504440',
  textMuted: '#827470',
} as const;

export const radius = {
  sm: 8, // input, tombol, chip persegi
  md: 16, // kartu/kontainer
  full: 9999, // badge/pill
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
} as const;

export const cardShadow = {
  shadowColor: '#2C1810',
  shadowOpacity: 0.06,
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 1 },
  elevation: 1,
} as const;
