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
  args: {},
  render: (args) => ({
    props: {
      ...args,
      rowCount: 10000,
    } as any,
    template: `<app-benchmark-wrapper [rowCount]="10000" />`,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Benchmark with ~10,000 rows. Quick sanity check for virtual scrolling and canvas rendering.',
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
        story:
          'Benchmark with ~100,000 rows. Tests virtual scrolling performance with a large dataset.',
      },
    },
  },
};

export const Benchmark500K: Story = {
  args: {},
  render: (args) => ({
    props: {
      ...args,
      rowCount: 500000,
    } as any,
    template: `<app-benchmark-wrapper [rowCount]="500000" />`,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Benchmark with ~500,000 rows. Heavy stress test for virtual scrolling and canvas rendering.',
      },
    },
  },
};

export const Benchmark1M: Story = {
  args: {},
  render: (args) => ({
    props: {
      ...args,
      rowCount: 1000000,
    } as any,
    template: `<app-benchmark-wrapper [rowCount]="1000000" />`,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Benchmark with ~1,000,000 rows. Extreme stress test. Validates canvas renderer at maximum scale.',
      },
    },
  },
};
