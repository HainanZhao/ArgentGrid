import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { StreamingWrapperComponent } from './streaming-wrapper.component';

const meta: Meta<StreamingWrapperComponent> = {
  title: 'Features/Streaming',
  component: StreamingWrapperComponent,
  decorators: [
    moduleMetadata({
      imports: [StreamingWrapperComponent],
    }),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<StreamingWrapperComponent>;

export const LiveStockFeed: Story = {
  args: {
    updateFrequency: 200,
    batchSize: 5,
    renderThrottleMs: 100, // 10fps for data updates
  },
  render: (args) => ({
    props: args,
    template: `<app-streaming-wrapper [updateFrequency]="updateFrequency" [batchSize]="batchSize" [renderThrottleMs]="renderThrottleMs" />`,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Simulates a live stock market feed with 5 updates per second. Demonstrates high-performance row updates and real-time sparkline rendering using the canvas engine.',
      },
    },
  },
};

export const HighFrequencyStream: Story = {
  args: {
    updateFrequency: 50,
    batchSize: 10,
    renderThrottleMs: 32, // ~30fps for high frequency
  },
  render: (args) => ({
    props: args,
    template: `<app-streaming-wrapper [updateFrequency]="updateFrequency" [batchSize]="batchSize" [renderThrottleMs]="renderThrottleMs" />`,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Stresses the grid with 20 updates per second (10 rows each), totaling 200 row updates per second. Shows the efficiency of the transaction API and canvas renderer.',
      },
    },
  },
};
