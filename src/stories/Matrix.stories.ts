import { BrowserModule } from '@angular/platform-browser';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ArgentGridComponent, ArgentGridModule } from '../public-api';
import { MatrixRainComponent } from './matrix-rain.component';

interface MatrixData {
  id: number;
  character: string;
  binary: string;
  hex: string;
  matrixCode: string;
}

const meta: Meta<ArgentGridComponent<MatrixData>> = {
  title: 'EasterEggs/MatrixRain',
  component: ArgentGridComponent,
  decorators: [
    moduleMetadata({
      imports: [ArgentGridModule, BrowserModule, MatrixRainComponent],
    }),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<ArgentGridComponent<MatrixData>>;

// Matrix rain characters
const MATRIX_CHARS =
  'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function _generateMatrixData(count: number): MatrixData[] {
  const chars = MATRIX_CHARS.split('');

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    character: chars[i % chars.length],
    binary: i.toString(2).padStart(8, '0'),
    hex: i.toString(16).toUpperCase().padStart(2, '0'),
    matrixCode: Array.from(
      { length: 10 },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join(''),
  }));
}

export const MatrixRain: Story = {
  render: () => ({
    template: `
      <div style="background: #000; padding: 20px; min-height: 100vh;">
        <p style="color: #00ff41; font-family: monospace; opacity: 0.7; margin-bottom: 20px;">
          Wake up, Neo... The grid has you...
        </p>
        <app-matrix-rain />
      </div>
    `,
  }),
};
