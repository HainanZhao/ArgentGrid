import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ArgentGridComponent, ArgentGridModule, themeQuartz, colorSchemeDark, iconSetMaterial } from 'argent-grid';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  rating: number;
}

const meta: Meta<ArgentGridComponent<Product>> = {
  title: 'ArgentGrid/Theming',
  component: ArgentGridComponent,
  decorators: [
    moduleMetadata({
      imports: [ArgentGridModule],
    }),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<ArgentGridComponent<Product>>;

const products: Product[] = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: `Product ${i + 1}`,
  category: ['Electronics', 'Clothing', 'Home', 'Sports'][Math.floor(Math.random() * 4)],
  price: Math.floor(Math.random() * 500) + 50,
  stock: Math.floor(Math.random() * 1000),
  rating: Math.floor(Math.random() * 5) + 1,
}));

export const LightTheme: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200 },
      { field: 'category', headerName: 'Category', width: 150 },
      { field: 'price', headerName: 'Price', width: 100 },
      { field: 'stock', headerName: 'Stock', width: 100 },
      { field: 'rating', headerName: 'Rating', width: 100 },
    ],
    rowData: products,
    height: '500px',
    width: '100%',
    theme: themeQuartz,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default light theme with Quartz design system.',
      },
    },
  },
};

export const DarkTheme: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200 },
      { field: 'category', headerName: 'Category', width: 150 },
      { field: 'price', headerName: 'Price', width: 100 },
      { field: 'stock', headerName: 'Stock', width: 100 },
      { field: 'rating', headerName: 'Rating', width: 100 },
    ],
    rowData: products,
    height: '500px',
    width: '100%',
    theme: themeQuartz.withPart(colorSchemeDark),
  },
  parameters: {
    docs: {
      description: {
        story: 'Dark theme using colorSchemeDark part.',
      },
    },
  },
};

export const CustomTheme: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200 },
      { field: 'category', headerName: 'Category', width: 150 },
      { field: 'price', headerName: 'Price', width: 100 },
      { field: 'stock', headerName: 'Stock', width: 100 },
      { field: 'rating', headerName: 'Rating', width: 100 },
    ],
    rowData: products,
    height: '500px',
    width: '100%',
    theme: themeQuartz.withParams({
      accentColor: '#ff5722',
      spacing: 12,
      rowHeight: 48,
      fontSize: 14,
    }),
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom theme with orange accent color and comfortable spacing.',
      },
    },
  },
};

export const MaterialIcons: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200 },
      { field: 'category', headerName: 'Category', width: 150 },
      { field: 'price', headerName: 'Price', width: 100 },
      { field: 'stock', headerName: 'Stock', width: 100 },
      { field: 'rating', headerName: 'Rating', width: 100 },
    ],
    rowData: products,
    height: '500px',
    width: '100%',
    theme: themeQuartz.withPart(iconSetMaterial),
  },
  parameters: {
    docs: {
      description: {
        story: 'Quartz theme with Material Design icon set.',
      },
    },
  },
};

export const CompactMode: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200 },
      { field: 'category', headerName: 'Category', width: 150 },
      { field: 'price', headerName: 'Price', width: 100 },
      { field: 'stock', headerName: 'Stock', width: 100 },
      { field: 'rating', headerName: 'Rating', width: 100 },
    ],
    rowData: products,
    height: '500px',
    width: '100%',
    theme: themeQuartz.withParams({
      rowHeight: 32,
      fontSize: 12,
      spacing: 4,
      cellPadding: 8,
    }),
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact mode with smaller rows and fonts for dense data display.',
      },
    },
  },
};
