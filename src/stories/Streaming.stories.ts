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
    updateFrequency: 100,
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
          'Simulates a live stock market feed. Updates are buffered and applied via applyTransaction at most twice per second (500ms throttle) for efficient rendering. Demonstrates high-performance row updates with the canvas engine.',
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
          'Stresses the grid with 20 updates per second (10 rows each), totaling 200 row updates per second. All updates are buffered and applied in batched transactions every 500ms. Shows the efficiency of the transaction API and canvas renderer.',
      },
    },
  },
};
