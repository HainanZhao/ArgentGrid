import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { BenchmarkWrapperComponent } from './benchmark-wrapper.component';

const meta: Meta<BenchmarkWrapperComponent> = {
  title: 'Features/Benchmark',
  component: BenchmarkWrapperComponent,
  decorators: [
    moduleMetadata({
      imports: [BenchmarkWrapperComponent],
    }),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<BenchmarkWrapperComponent>;

export const Benchmark10K: Story = {
  args: {
    // Default 10K rows
  },
  render: (args) => ({
    props: args,
    template: `<app-benchmark-wrapper />`,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Benchmark with ~10,000 rows. Click "Run Benchmark" to test selection, grouping, and scroll performance.',
      },
    },
  },
};

export const Benchmark50K: Story = {
  args: {},
  render: (args) => ({
    props: {
      ...args,
      rowCount: 50000,
    } as any,
    template: `<app-benchmark-wrapper [rowCount]="50000" />`,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Benchmark with ~50,000 rows. Stress tests virtual scrolling with large datasets.',
      },
    },
  },
};

export const Benchmark100K: Story = {
  args: {},
  render: (args) => ({
    props: {
      ...args,
      rowCount: 100000,
    } as any,
    template: `<app-benchmark-wrapper [rowCount]="100000" />`,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Benchmark with ~100,000 rows. High-performance stress test. Expect longer initial render but smooth scrolling.',
      },
    },
  },
};