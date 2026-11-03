import { createTheme, type MantineColorsTuple } from '@mantine/core';

const iris: MantineColorsTuple = [
  '#f1eeff', '#ded7ff', '#bbadff', '#967fff', '#7758ff',
  '#6440ff', '#5933ff', '#4926e4', '#3e20cc', '#3217b4',
];
const volt: MantineColorsTuple = [
  '#fbffe1', '#f4ffcb', '#e9ff9a', '#ddff64', '#d3ff38',
  '#ccff1c', '#c8ff08', '#afe300', '#9aca00', '#82ae00',
];
const dark: MantineColorsTuple = [
  '#d4d6e2', '#a9adc0', '#80859c', '#5d6278', '#41455a',
  '#2c2f42', '#1d2031', '#151725', '#0f111b', '#0a0b12',
];

export const theme = createTheme({
  primaryColor: 'iris',
  primaryShade: { light: 6, dark: 4 },
  colors: { iris, volt, dark },
  fontFamily: '"Be Vietnam Pro", system-ui, -apple-system, sans-serif',
  fontFamilyMonospace: '"JetBrains Mono", ui-monospace, monospace',
  headings: {
    fontFamily: '"Be Vietnam Pro", system-ui, sans-serif',
    fontWeight: '800',
  },
  defaultRadius: 'lg',
  cursorType: 'pointer',
  components: {
    Card: { defaultProps: { radius: 'xl', withBorder: true } },
    Paper: { defaultProps: { radius: 'xl' } },
    Button: { defaultProps: { radius: 'xl' } },
    Badge: { defaultProps: { radius: 'sm', variant: 'light' } },
    Modal: { defaultProps: { radius: 'xl', centered: true, overlayProps: { blur: 6, backgroundOpacity: 0.55 } } },
    Drawer: { defaultProps: { overlayProps: { blur: 4, backgroundOpacity: 0.5 } } },
    TextInput: { defaultProps: { radius: 'md' } },
    PasswordInput: { defaultProps: { radius: 'md' } },
    Select: { defaultProps: { radius: 'md' } },
    MultiSelect: { defaultProps: { radius: 'md' } },
  },
});
