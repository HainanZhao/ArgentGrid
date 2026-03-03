import { BrowserModule } from '@angular/platform-browser';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ArgentGridComponent, ArgentGridModule, themeQuartz } from '../public-api';

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
      imports: [ArgentGridModule, BrowserModule],
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

function generateMatrixData(count: number): MatrixData[] {
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
  args: {
    columnDefs: [
      {
        field: 'id',
        headerName: '#',
        width: 80,
        cellClass: 'matrix-id',
      },
      {
        field: 'character',
        headerName: 'Symbol',
        width: 120,
        cellClass: 'matrix-symbol',
        cellRenderer: 'matrixRain',
        cellRendererParams: {
          color: '#00ff41',
        },
      },
      {
        field: 'binary',
        headerName: 'Binary',
        width: 150,
        cellClass: 'matrix-binary',
      },
      {
        field: 'hex',
        headerName: 'Hex',
        width: 100,
        cellClass: 'matrix-hex',
      },
      {
        field: 'matrixCode',
        headerName: 'Matrix Code',
        width: 200,
        cellClass: 'matrix-code',
      },
    ],
    rowData: generateMatrixData(100),
    height: 'calc(100vh - 60px)',
    width: '100%',
    theme: themeQuartz,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="background: #000; padding: 20px; min-height: 100vh;">
        <h1 style="color: #00ff41; font-family: monospace; margin-bottom: 20px; text-shadow: 0 0 10px #00ff41;">
          🥋 Matrix Rain Demo
        </h1>
        <p style="color: #00ff41; font-family: monospace; opacity: 0.7; margin-bottom: 20px;">
          Wake up, Neo... The grid has you...
        </p>
        <argent-grid [columnDefs]="columnDefs" [rowData]="rowData" [height]="height" [width]="width" [theme]="theme" />
      </div>
    `,
  }),
};

export const Neo: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      {
        field: 'character',
        headerName: 'The One',
        width: 150,
        cellRenderer: 'matrixRain',
      },
      { field: 'binary', headerName: 'Reality', width: 150 },
      { field: 'hex', headerName: 'Code', width: 100 },
      { field: 'matrixCode', headerName: 'Path', width: 200 },
    ],
    rowData: [
      { id: 1, character: '♟', binary: '00000001', hex: '01', matrixCode: 'KNOWLEDGE' },
      { id: 2, character: '♜', binary: '00000010', hex: '02', matrixCode: 'CHOICE' },
      { id: 3, character: '♞', binary: '00000011', hex: '03', matrixCode: 'CHANCE' },
      { id: 4, character: '♝', binary: '00000100', hex: '04', matrixCode: 'FATE' },
      { id: 5, character: '♛', binary: '00000101', hex: '05', matrixCode: 'FREEDOM' },
      { id: 6, character: '♚', binary: '00000110', hex: '06', matrixCode: 'POWER' },
    ],
    height: '400px',
    width: '100%',
    theme: themeQuartz,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="background: linear-gradient(180deg, #000 0%, #0a0a0a 100%); padding: 20px; min-height: 100vh;">
        <h1 style="color: #fff; font-family: 'Courier New', monospace; margin-bottom: 10px;">
          Follow the white rabbit 🐰
        </h1>
        <p style="color: #888; font-family: monospace; margin-bottom: 20px;">
          >>> Enter the Matrix <<<
        </p>
        <argent-grid [columnDefs]="columnDefs" [rowData]="rowData" [height]="height" [width]="width" [theme]="theme" />
      </div>
    `,
  }),
};

export const DigitalRain: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'Stream', width: 100 },
      {
        field: 'matrixCode',
        headerName: 'Digital Rain',
        flex: 1,
        cellStyle: {
          fontFamily: 'monospace',
          letterSpacing: '2px',
        },
      },
    ],
    rowData: Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      character: MATRIX_CHARS[i % MATRIX_CHARS.length],
      binary: i.toString(2).padStart(8, '0'),
      hex: i.toString(16).toUpperCase().padStart(2, '0'),
      matrixCode: Array.from(
        { length: 40 },
        () => MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
      ).join(''),
    })),
    height: 'calc(100vh - 60px)',
    width: '100%',
    theme: themeQuartz,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="background: #000; padding: 20px;">
        <h2 style="color: #00ff41; font-family: monospace; text-align: center; margin-bottom: 20px;">
          ♨ DIGITAL RAIN ♨
        </h2>
        <argent-grid [columnDefs]="columnDefs" [rowData]="rowData" [height]="height" [width]="width" [theme]="theme" />
      </div>
    `,
  }),
};
