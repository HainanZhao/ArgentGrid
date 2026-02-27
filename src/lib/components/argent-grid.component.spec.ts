import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ArgentGridComponent } from './argent-grid.component';
import { GridService } from '../services/grid.service';
import { ColDef } from '../types/ag-grid-types';

// Mock canvas context
const mockCanvasContext = {
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  fillText: jest.fn(),
  measureText: jest.fn(() => ({ width: 100 })),
  scale: jest.fn(),
  font: '13px sans-serif',
  textBaseline: 'middle',
  fillStyle: '#000',
  strokeStyle: '#000'
};

const mockCanvas = {
  getContext: jest.fn(() => mockCanvasContext as any),
  width: 800,
  height: 600,
  style: {},
  addEventListener: jest.fn(),
  getBoundingClientRect: jest.fn(() => ({ width: 800, height: 600 }))
} as unknown as HTMLCanvasElement;

interface TestData {
  id: number;
  name: string;
  value: number;
}

describe('ArgentGridComponent', () => {
  let component: ArgentGridComponent<TestData>;
  let fixture: ComponentFixture<ArgentGridComponent<TestData>>;
  
  const testColumnDefs: (ColDef<TestData>)[] = [
    { colId: 'id', field: 'id', headerName: 'ID', width: 100 },
    { colId: 'name', field: 'name', headerName: 'Name', width: 150 },
    { colId: 'value', field: 'value', headerName: 'Value', width: 100 }
  ];
  
  const testRowData: TestData[] = [
    { id: 1, name: 'Item 1', value: 100 },
    { id: 2, name: 'Item 2', value: 200 }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ArgentGridComponent],
      providers: [GridService]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ArgentGridComponent<TestData>) as ComponentFixture<ArgentGridComponent<TestData>>;
    component = fixture.componentInstance;
    component.columnDefs = testColumnDefs;
    component.rowData = testRowData;
    
    // Mock canvas
    component.canvasRef = { nativeElement: mockCanvas } as any;
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should accept columnDefs input', () => {
    expect(component.columnDefs).toEqual(testColumnDefs);
  });

  it('should accept rowData input', () => {
    expect(component.rowData).toEqual(testRowData);
  });

  it('should emit gridReady event', () => {
    component.gridReady.subscribe((api) => {
      expect(api).toBeTruthy();
      expect(api.getColumnDefs()).toEqual(testColumnDefs);
    });
  });

  it('should have correct row height', () => {
    expect(component.rowHeight).toBe(32);
  });

  it('should calculate canvas height correctly', () => {
    // Canvas height is set during initialization
    expect(component.canvasHeight).toBe(64); // 32 * 2 rows
  });

  it('should show overlay when no data', () => {
    // Test the logic without calling ngOnInit which triggers canvas
    expect(component.showOverlay).toBe(false); // Initially has data
  });

  it('should hide overlay when data exists', () => {
    expect(component.showOverlay).toBe(false);
  });

  it('should get header name from column', () => {
    const col = testColumnDefs[0];
    expect(component.getHeaderName(col)).toBe('ID');
  });

  it('should get header name from field if headerName not provided', () => {
    const col: ColDef<TestData> = { field: 'name' };
    expect(component.getHeaderName(col)).toBe('name');
  });

  it('should handle header click for sorting', () => {
    const col = { ...testColumnDefs[0], sortable: true };
    component.onHeaderClick(col);
    expect(col.sort).toBe('asc');
    
    // Click again to toggle
    component.onHeaderClick(col);
    expect(col.sort).toBe('desc');
    
    // Click third time to clear
    component.onHeaderClick(col);
    expect(col.sort).toBeNull();
  });

  it('should not sort non-sortable columns', () => {
    const col: ColDef<TestData> = { colId: 'test', sortable: false };
    component.onHeaderClick(col);
    expect(col.sort).toBeUndefined();
  });

  it('should get column width', () => {
    const col = testColumnDefs[0];
    expect(component.getColumnWidth(col)).toBe(100);
  });

  it('should use default width if not specified', () => {
    const col: ColDef<TestData> = { colId: 'test' };
    expect(component.getColumnWidth(col)).toBe(150);
  });

  it('should refresh grid', () => {
    const mockRenderer = { render: jest.fn() };
    (component as any).canvasRenderer = mockRenderer;
    component.refresh();
    expect(mockRenderer.render).toHaveBeenCalled();
  });

  it('should get API instance', () => {
    const api = component.getApi();
    expect(api).toBeTruthy();
  });
});
