import { createTheme, type MantineColorsTuple } from '@mantine/core';

// Sapphire — xanh ngân hàng/sổ sách, tạo cảm giác tin cậy
const iris: MantineColorsTuple = [
  '#eef4ff', '#dbe6fe', '#bfd3fe', '#93b4fd', '#6090fa',
  '#3b6ef6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a',
];
// Amber — điểm nhấn (ưu đãi, cảnh báo nhẹ, đầu ra)
const volt: MantineColorsTuple = [
  '#fffbeb', '#fef3c7', '#fde68a', '#fcd34d', '#fbbf24',
  '#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f',
];
const dark: MantineColorsTuple = [
  '#d4d6e2', '#a9adc0', '#80859c', '#5d6278', '#41455a',
  '#2c2f42', '#1d2031', '#151725', '#0f111b', '#0a0b12',
];

export const theme = createTheme({
  primaryColor: 'iris',
  primaryShade: { light: 7, dark: 5 },
  colors: { iris, volt, dark },
  fontFamily: '"Be Vietnam Pro", system-ui, -apple-system, sans-serif',
  fontFamilyMonospace: '"JetBrains Mono", ui-monospace, monospace',
  headings: {
    fontFamily: '"Be Vietnam Pro", system-ui, sans-serif',
    fontWeight: '700',
  },
  defaultRadius: 'md',
  cursorType: 'pointer',
  components: {
    Card: { defaultProps: { radius: 'lg', withBorder: true } },
    Paper: { defaultProps: { radius: 'lg' } },
    Button: { defaultProps: { radius: 'md' } },
    Badge: { defaultProps: { radius: 'sm', variant: 'light' } },
    Modal: { defaultProps: { radius: 'lg', centered: true, overlayProps: { blur: 6, backgroundOpacity: 0.35 } } },
    Drawer: { defaultProps: { overlayProps: { blur: 4, backgroundOpacity: 0.5 } } },
    TextInput: { defaultProps: { radius: 'md' } },
    PasswordInput: { defaultProps: { radius: 'md' } },
    Select: { defaultProps: { radius: 'md' } },
    MultiSelect: { defaultProps: { radius: 'md' } },
  },
});
