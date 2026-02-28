/**
 * ArgentGrid - AG Grid Compatible Type Definitions
 * A free, high-performance alternative to AG Grid Enterprise
 * 
 * This file provides 1:1 TypeScript definitions compatible with AG Grid API
 * to ensure users can switch to ArgentGrid by simply changing their import.
 */

// ============================================================================
// CORE INTERFACES - GRID OPTIONS
// ============================================================================

export interface GridOptions<TData = any> {
  // === COLUMN DEFINITIONS ===
  columnDefs?: (ColDef<TData> | ColGroupDef<TData>)[] | null;
  defaultColDef?: ColDef<TData>;
  defaultColGroupDef?: Partial<ColGroupDef<TData>>;
  columnTypes?: { [key: string]: ColDef<TData> };
  dataTypeDefinitions?: DataTypeDefinitions<TData>;
  maintainColumnOrder?: boolean;
  enableStrictPivotColumnOrder?: boolean;
  suppressFieldDotNotation?: boolean;

  // === ROW DATA ===
  rowData?: TData[] | null;
  rowModelType?: RowModelType;
  getRowId?: GetRowIdFunc<TData>;

  // === RENDERING ===
  animateRows?: boolean;
  cellFlashDuration?: number;
  cellFadeDuration?: number;
  domLayout?: DomLayoutType;
  rowHeight?: number;
  getRowHeight?: (params: RowHeightParams) => number | null | undefined;
  rowStyle?: RowStyle;
  getRowStyle?: (params: RowClassParams) => RowStyle | undefined;
  rowClass?: string | string[];
  getRowClass?: (params: RowClassParams) => string | string[] | undefined;
  rowClassRules?: RowClassRules<TData>;
  suppressRowHoverHighlight?: boolean;
  columnHoverHighlight?: boolean;

  // === SELECTION ===
  rowSelection?: RowSelectionOptions | 'single' | 'multiple';
  cellSelection?: boolean | CellSelectionOptions;
  enableRangeSelection?: boolean;
  selectionColumnDef?: SelectionColumnDef;
  suppressCellFocus?: boolean;
  suppressHeaderFocus?: boolean;
  enableCellTextSelection?: boolean;

  // === SORTING ===
  accentedSort?: boolean;
  suppressMultiSort?: boolean;
  alwaysMultiSort?: boolean;
  multiSortKey?: 'ctrl';
  suppressMaintainUnsortedOrder?: boolean;
  postSortRows?: (params: PostSortRowsParams<TData>) => void;
  deltaSort?: boolean;

  // === FILTERING ===
  quickFilterText?: string;
  cacheQuickFilter?: boolean;
  includeHiddenColumnsInQuickFilter?: boolean;
  isExternalFilterPresent?: () => boolean;
  doesExternalFilterPass?: (node: IRowNode<TData>) => boolean;
  excludeChildrenWhenTreeDataFiltering?: boolean;
  enableAdvancedFilter?: boolean;
  floatingFilter?: boolean;

  // === SCROLLING ===
  alwaysShowHorizontalScroll?: boolean;
  alwaysShowVerticalScroll?: boolean;
  suppressHorizontalScroll?: boolean;
  scrollbarWidth?: number;

  // === EDITING ===
  editType?: 'fullRow' | undefined;
  singleClickEdit?: boolean;
  suppressClickEdit?: boolean;
  stopEditingWhenCellsLoseFocus?: boolean;
  enterNavigatesVertically?: boolean;
  enterNavigatesVerticallyAfterEdit?: boolean;
  undoRedoCellEditing?: boolean;
  undoRedoCellEditingLimit?: number;

  // === PAGINATION ===
  pagination?: boolean;
  paginationPageSize?: number;
  paginationPageSizeSelector?: number[] | boolean;
  paginationAutoPageSize?: boolean;

  // === COLUMN SIZING ===
  colResizeDefault?: 'shift';
  suppressAutoSize?: boolean;
  autoSizePadding?: number;
  animateColumnResizing?: boolean;

  // === COLUMN MOVING ===
  suppressMovableColumns?: boolean;
  suppressColumnMoveAnimation?: boolean;

  // === ROW GROUPING ===
  groupDisplayType?: RowGroupingDisplayType;
  autoGroupColumnDef?: AutoGroupColumnDef<TData>;
  groupRowRenderer?: any;
  groupRowRendererParams?: any;
  groupHideOpenParents?: boolean;
  groupDefaultExpanded?: number;
  rowGroupPanelShow?: 'always' | 'onlyWhenGrouping' | 'never';

  // === TREE DATA ===
  treeData?: boolean;
  getDataPath?: (data: TData) => string[];
  treeDataChildrenField?: string;
  treeDataParentIdField?: string;

  // === MASTER DETAIL ===
  masterDetail?: boolean;
  isRowMaster?: (data: TData) => boolean;
  detailCellRenderer?: any;
  detailCellRendererParams?: any;
  detailRowHeight?: number;

  // === PINNING ===
  enableRowPinning?: boolean | 'top' | 'bottom';
  pinnedTopRowData?: any[];
  pinnedBottomRowData?: any[];

  // === PIVOTING ===
  pivotMode?: boolean;
  pivotPanelShow?: 'always' | 'onlyWhenPivoting' | 'never';

  // === STYLING ===
  icons?: Icons;
  theme?: Theme | 'legacy';
  sideBar?: any;
  overlayComponent?: any;
  loading?: boolean;

  // === CONTEXT ===
  context?: any;
  gridId?: string;
  debug?: boolean;

  // === CALLBACKS ===
  processCellForClipboard?: (params: ProcessCellForClipboardParams<TData>) => any;
  processCellFromClipboard?: (params: ProcessCellFromClipboardParams<TData>) => any;
  getContextMenuItems?: (params: GetContextMenuItemsParams<TData>) => (DefaultMenuItem | MenuItemDef)[];
  getMainMenuItems?: (params: GetMainMenuItemsParams<TData>) => (DefaultMenuItem | MenuItemDef)[];
}

// ============================================================================
// COLUMN DEFINITIONS
// ============================================================================

export interface ColDef<TData = any, TValue = any> {
  // === COLUMNS ===
  field?: keyof TData | string;
  colId?: string;
  type?: string | string[];
  cellDataType?: boolean | string;
  valueGetter?: string | ValueGetterFunc<TData, TValue>;
  valueFormatter?: string | ValueFormatterFunc<TData, TValue>;
  refData?: { [key: string]: any };
  keyCreator?: KeyCreatorFunc<TValue>;
  equals?: EqualsFunc<TValue>;
  toolPanelClass?: string | string[];
  suppressColumnsToolPanel?: boolean;
  columnGroupShow?: 'open' | 'closed' | 'all';
  icons?: Icons;
  suppressNavigable?: boolean | ((params: IsRowNavigableParams<TData>) => boolean);
  suppressKeyboardEvent?: (params: SuppressKeyboardEventParams<TData>) => boolean;
  suppressPaste?: boolean | ((params: SuppressPasteParams<TData>) => boolean);
  suppressFillHandle?: boolean;
  contextMenuItems?: (DefaultMenuItem | MenuItemDef)[] | ((params: any) => (DefaultMenuItem | MenuItemDef)[]);
  context?: any;

  // === SELECTION ===
  checkboxSelection?: boolean;
  headerCheckboxSelection?: boolean;
  headerCheckboxSelectionFilteredOnly?: boolean;

  // === ACCESSIBILITY ===
  cellAriaRole?: string;

  // === AGGREGATION ===
  aggFunc?: string | IAggFunc<TData> | null;
  initialAggFunc?: string | IAggFunc<TData>;
  enableValue?: boolean;
  allowedAggFuncs?: string[];
  defaultAggFunc?: string;

  // === DISPLAY ===
  hide?: boolean | null;
  initialHide?: boolean;
  lockVisible?: boolean;
  lockPosition?: boolean | 'left' | 'right';
  suppressMovable?: boolean;
  useValueFormatterForExport?: boolean;

  // === EDITING ===
  editable?: boolean | ((params: EditableCallbackParams<TData>) => boolean);
  valueSetter?: string | ValueSetterFunc<TData, TValue>;
  valueParser?: string | ValueParserFunc<TData, TValue>;
  cellEditor?: any;
  cellEditorParams?: any;
  cellEditorSelector?: (params: any) => any;
  cellEditorPopup?: boolean;
  cellEditorPopupPosition?: 'over' | 'under';
  singleClickEdit?: boolean;
  useValueParserForImport?: boolean;

  // === EVENTS ===
  onCellValueChanged?: (params: NewValueParams<TData>) => void;
  onCellClicked?: (params: CellClickedEvent<TData>) => void;
  onCellDoubleClicked?: (params: CellDoubleClickedEvent<TData>) => void;
  onCellContextMenu?: (params: CellContextMenuEvent<TData>) => void;

  // === FILTER ===
  filter?: any;
  filterParams?: any;
  filterValueGetter?: string | ValueGetterFunc<TData, any>;
  getQuickFilterText?: (params: GetQuickFilterTextParams<TData>) => string;
  floatingFilter?: boolean;
  floatingFilterComponent?: any;
  floatingFilterComponentParams?: any;
  suppressFiltersToolPanel?: boolean;

  // === HEADER ===
  headerName?: string;
  headerValueGetter?: string | HeaderValueGetterFunc<TData>;
  headerTooltip?: string;
  headerStyle?: { [key: string]: any } | ((params: any) => { [key: string]: any });
  headerClass?: string | string[] | ((params: any) => string | string[]);
  headerComponent?: any;
  headerComponentParams?: any;
  wrapHeaderText?: boolean;
  autoHeaderHeight?: boolean;
  menuTabs?: ColumnMenuTab[];
  suppressHeaderMenuButton?: boolean;
  suppressHeaderFilterButton?: boolean;
  suppressHeaderContextMenu?: boolean;

  // === PINNED ===
  pinned?: boolean | 'left' | 'right' | null;
  initialPinned?: boolean | 'left' | 'right';
  lockPinned?: boolean;

  // === PIVOTING ===
  pivot?: boolean | null;
  initialPivot?: boolean;
  pivotIndex?: number | null;
  enablePivot?: boolean;

  // === RENDERING AND STYLING ===
  cellStyle?: { [key: string]: any } | ((params: CellStyleParams<TData, TValue>) => { [key: string]: any });
  cellClass?: string | string[] | ((params: CellClassParams<TData, TValue>) => string | string[]);
  cellClassRules?: { [key: string]: (params: CellClassParams<TData, TValue>) => boolean };
  cellRenderer?: any;
  cellRendererParams?: any;
  cellRendererSelector?: (params: any) => any;
  autoHeight?: boolean;
  wrapText?: boolean;
  enableCellChangeFlash?: boolean;

  // === ROW DRAGGING ===
  rowDrag?: boolean | ((params: RowDragCallbackParams<TData>) => boolean);
  rowDragText?: (params: any) => string;
  dndSource?: boolean | ((params: any) => boolean);

  // === SPARKLINE ===
  sparklineOptions?: SparklineOptions;

  // === ROW GROUPING ===
  rowGroup?: boolean | null;
  initialRowGroup?: boolean;
  rowGroupIndex?: number | null;
  enableRowGroup?: boolean;
  showRowGroup?: string | boolean;

  // === SORT ===
  sortable?: boolean;
  sort?: SortDirection | SortDef;
  initialSort?: SortDirection | SortDef;
  sortIndex?: number | null;
  sortingOrder?: (SortDirection | SortDef)[];
  comparator?: SortComparatorFn<TValue>;
  unSortIcon?: boolean;

  // === SPANNING ===
  colSpan?: (params: ColSpanParams<TData>) => number;
  spanRows?: boolean | ((params: any) => boolean);

  // === TOOLTIPS ===
  tooltipField?: keyof TData | string;
  tooltipValueGetter?: (params: TooltipValueGetterParams<TData>) => string;
  tooltipComponent?: any;
  tooltipComponentParams?: any;

  // === WIDTH ===
  width?: number;
  initialWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  flex?: number | null;
  initialFlex?: number;
  resizable?: boolean;
  suppressSizeToFit?: boolean;
  suppressAutoSize?: boolean;
}

export interface ColGroupDef<TData = any> {
  // === GROUPS (required) ===
  children: (ColDef<TData> | ColGroupDef<TData>)[];
  groupId?: string;
  marryChildren?: boolean;
  openByDefault?: boolean;
  columnGroupShow?: 'open' | 'closed' | 'all';
  toolPanelClass?: string | string[];
  suppressColumnsToolPanel?: boolean;
  suppressFiltersToolPanel?: boolean;

  // === HEADER ===
  headerName?: string;
  headerClass?: string | string[] | ((params: any) => string | string[]);
  headerTooltip?: string;
  autoHeaderHeight?: boolean;
  headerGroupComponent?: any;
  headerGroupComponentParams?: any;
  suppressStickyLabel?: boolean;
}

// ============================================================================
// GRID API
// ============================================================================

export interface GridApi<TData = any> {
  // === COLUMN API ===
  getColumnDefs(): (ColDef<TData> | ColGroupDef<TData>)[] | null;
  setColumnDefs(colDefs: (ColDef<TData> | ColGroupDef<TData>)[]): void;
  getColumn(key: string | Column): Column | null;
  getAllColumns(): Column[];
  getDisplayedRowAtIndex(index: number): IRowNode<TData> | null;

  // === ROW DATA API ===
  getRowData(): TData[];
  setRowData(rowData: TData[]): void;
  applyTransaction(transaction: RowDataTransaction<TData>): RowDataTransactionResult | null;
  getDisplayedRowCount(): number;
  getRowY(index: number): number;
  getAggregations(): { [field: string]: any };
  getRowNode(id: string): IRowNode<TData> | null;

  // === SELECTION API ===
  getSelectedRows(): IRowNode<TData>[];
  getSelectedNodes(): IRowNode<TData>[];
  selectAll(): void;
  deselectAll(): void;

  // === FILTER API ===
  setFilterModel(model: FilterModel): void;
  getFilterModel(): FilterModel;
  onFilterChanged(): void;
  isFilterPresent(): boolean;

  // === SORT API ===
  setSortModel(model: SortModelItem[]): void;
  getSortModel(): SortModelItem[];
  onSortChanged(): void;

  // === PAGINATION API ===
  paginationGetPageSize(): number;
  paginationSetPageSize(size: number): void;
  paginationGetCurrentPage(): number;
  paginationGetTotalPages(): number;
  paginationGoToFirstPage(): void;
  paginationGoToLastPage(): void;
  paginationGoToNextPage(): void;
  paginationGoToPreviousPage(): void;

  // === EXPORT API ===
  exportDataAsCsv(params?: CsvExportParams): void;
  exportDataAsExcel(params?: ExcelExportParams): void;

  // === CLIPBOARD API ===
  copyToClipboard(): void;
  cutToClipboard(): void;
  pasteFromClipboard(): void;

  // === GRID STATE API ===
  getState(): GridState;
  applyState(state: GridState): void;

  // === FOCUS API ===
  setFocusedCell(rowIndex: number, colKey: string): void;
  getFocusedCell(): CellPosition | null;

  // === REFRESH API ===
  refreshCells(params?: RefreshCellsParams): void;
  refreshRows(params?: RefreshRowsParams): void;
  refreshHeader(): void;

  // === SCROLL API ===
  ensureIndexVisible(index: number, position?: 'top' | 'bottom' | 'auto'): void;
  ensureColumnVisible(key: string): void;

  // === DESTROY API ===
  destroy(): void;

  // === GRID INFORMATION ===
  getGridId(): string;
  getGridOption<K extends keyof GridOptions<TData>>(key: K): GridOptions<TData>[K];
  setGridOption<K extends keyof GridOptions<TData>>(key: K, value: GridOptions<TData>[K]): void;

  // === GROUP EXPANSION ===
  setRowNodeExpanded(node: IRowNode<TData>, expanded: boolean): void;

  // === ROW HEIGHT API ===
  getRowY(index: number): number;
  getRowAtY(y: number): number;
  getTotalHeight(): number;

  // === PIVOT API ===
  setPivotMode(pivotMode: boolean): void;
  isPivotMode(): boolean;

  // === RANGE SELECTION ===
  getCellRanges(): CellRange[] | null;
  addCellRange(params: CellRange): void;
  clearRangeSelection(): void;
}

// ============================================================================
// SUPPORTING TYPES AND INTERFACES
// ============================================================================

export interface Column {
  colId: string;
  field?: string;
  headerName?: string;
  width: number;
  minWidth?: number;
  maxWidth?: number;
  pinned: 'left' | 'right' | false;
  visible: boolean;
  sort?: SortDirection;
  sortIndex?: number;
  aggFunc?: string | null;
}

export interface IRowNode<TData = any> {
  id: string | null;
  data: TData;
  rowPinned: 'top' | 'bottom' | false;
  rowHeight: number | null;
  displayed: boolean;
  selected: boolean;
  expanded: boolean;
  group: boolean;
  master?: boolean;
  detail?: boolean;
  masterRowNode?: IRowNode<TData>;
  level: number;
  parent?: IRowNode<TData>;
  children?: IRowNode<TData>[];
  childrenAfterFilter?: IRowNode<TData>[];
  childrenAfterSort?: IRowNode<TData>[];
  allLeafChildren?: IRowNode<TData>[];
  firstChild: boolean;
  lastChild: boolean;
  rowIndex: number | null;
  displayedRowIndex: number;
}

export interface GroupRowNode<TData = any> {
  id: string;
  groupKey: any;
  groupField: string;
  level: number;
  children: (TData | GroupRowNode<TData>)[];
  expanded: boolean;
  aggregation?: { [field: string]: any };
  pivotData?: { [pivotKey: string]: { [field: string]: any } };
}

export interface FilterModel {
  [key: string]: FilterModelItem | null;
}

export interface FilterModelItem {
  filterType: 'text' | 'number' | 'date' | 'boolean' | 'set' | 'multiFilter';
  type?: string;
  filter?: any;
  filterTo?: any;
  values?: any[];
}

export interface SortModelItem {
  colId: string;
  sort: 'asc' | 'desc' | null;
  sortIndex?: number;
}

export interface GridState {
  columnOrder?: ColumnState[];
  columnVisibility?: ColumnVisibilityState;
  columnPinning?: ColumnPinningState;
  columnSize?: ColumnSizeState;
  filter?: FilterState;
  sort?: SortState;
  rowGrouping?: RowGroupingState;
  pivot?: PivotState;
  pagination?: PaginationState;
  rowSelection?: RowSelectionState;
}

export interface ColumnState {
  colId: string;
  width: number;
  hide: boolean;
  pinned: 'left' | 'right' | false;
  sort?: 'asc' | 'desc' | null;
  sortIndex?: number;
  rowGroupIndex?: number;
  pivotIndex?: number;
}

export interface ColumnVisibilityState {
  [colId: string]: boolean;
}

export interface ColumnPinningState {
  left: string[];
  right: string[];
}

export interface ColumnSizeState {
  [colId: string]: number;
}

export interface FilterState {
  [colId: string]: FilterModelItem;
}

export interface SortState {
  sortModel: SortModelItem[];
}

export interface RowGroupingState {
  rowGroupCols: string[];
  valueCols: string[];
  pivotCols: string[];
  isPivotMode: boolean;
}

export interface PivotState {
  pivotCols: string[];
  valueCols: string[];
  pivotMode: boolean;
}

export interface PaginationState {
  pageSize: number;
  pageNumber: number;
}

export interface RowSelectionState {
  rowKeys: string[];
}

export interface CellRange {
  startRow: number;
  endRow: number;
  startColumn: string; // colId
  endColumn: string;   // colId
  columns: Column[];
}

export interface RowDataTransaction<TData = any> {
  add?: TData[];
  update?: TData[];
  remove?: TData[];
  addIndex?: number;
}

export interface RowDataTransactionResult {
  add: IRowNode[];
  update: IRowNode[];
  remove: IRowNode[];
}

export interface SparklineOptions {
  type?: 'line' | 'area' | 'column' | 'bar';
  line?: {
    stroke?: string;
    strokeWidth?: number;
  };
  area?: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  };
  column?: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    padding?: number;
  };
  padding?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  axis?: {
    stroke?: string;
    strokeWidth?: number;
  };
}

export interface CsvExportParams {
  fileName?: string;
  delimiter?: string;
  processCellCallback?: (params: any) => string;
  processHeaderCallback?: (params: any) => string;
  skipHeader?: boolean;
  skipFooters?: boolean;
  skipGroups?: boolean;
  allColumns?: boolean;
  columnKeys?: string[];
}

export interface ExcelExportParams {
  fileName?: string;
  sheetName?: string;
  processCellCallback?: (params: any) => string;
  processHeaderCallback?: (params: any) => string;
  skipHeader?: boolean;
  skipFooters?: boolean;
  skipGroups?: boolean;
  allColumns?: boolean;
  columnKeys?: string[];
}

export interface RowSelectionOptions {
  mode: 'singleRow' | 'multiRow';
  checkboxes?: boolean;
  headerCheckbox?: boolean;
  enableSelectionWithoutKeys?: boolean;
}

export interface CellSelectionOptions {
  // Cell selection configuration
}

export interface SelectionColumnDef {
  headerCheckbox?: boolean;
  checkboxes?: boolean;
}

export interface AutoGroupColumnDef<TData = any> extends ColDef<TData> {
  headerName?: string;
  cellRenderer?: any;
  cellRendererParams?: any;
}

export interface Icons {
  [key: string]: any;
}

export interface Theme {
  name: string;
  // Theme configuration
}

export interface RowStyle {
  [key: string]: any;
}

export interface RowClassRules<TData = any> {
  [className: string]: (params: RowClassParams<TData>) => boolean;
}

export interface RowClassParams<TData = any> {
  data: TData;
  node: IRowNode<TData>;
  rowIndex: number;
  yIndex: number;
  api: GridApi<TData>;
}

export interface RowHeightParams {
  data: any;
  node: IRowNode;
  rowIndex: number;
}

export interface CellPosition {
  rowIndex: number;
  rowPinned?: 'top' | 'bottom';
  column?: Column;
}

export interface HeaderPosition {
  columnHeader: Column;
  headerRowIndex: number;
}

export interface RefreshCellsParams {
  force?: boolean;
  rowNodes?: IRowNode[];
  columns?: (string | Column)[];
}

export interface RefreshRowsParams {
  rowNodes: IRowNode[];
  force?: boolean;
}

export interface PostSortRowsParams<TData = any> {
  api: GridApi<TData>;
  nodes: IRowNode<TData>[];
  column: Column;
}

export interface ProcessCellForClipboardParams<TData = any> {
  value: any;
  node: IRowNode<TData>;
  column: Column;
  api: GridApi<TData>;
  rowPinned?: 'top' | 'bottom';
}

export interface ProcessCellFromClipboardParams<TData = any> {
  value: any;
  node: IRowNode<TData>;
  column: Column;
  api: GridApi<TData>;
}

export interface GetContextMenuItemsParams<TData = any> {
  node: IRowNode<TData>;
  column: Column;
  api: GridApi<TData>;
  type: string;
  event: MouseEvent;
}

export interface GetMainMenuItemsParams<TData = any> {
  column: Column;
  api: GridApi<TData>;
}

export interface EditableCallbackParams<TData = any> {
  node: IRowNode<TData>;
  column: Column;
  data: TData;
  value: any;
}

export interface CellStyleParams<TData = any, TValue = any> {
  value: TValue;
  data: TData;
  node: IRowNode<TData>;
  column: Column;
  api: GridApi<TData>;
}

export interface CellClassParams<TData = any, TValue = any> {
  value: TValue;
  data: TData;
  node: IRowNode<TData>;
  column: Column;
  api: GridApi<TData>;
}

export interface NewValueParams<TData = any> {
  newValue: any;
  oldValue: any;
  data: TData;
  node: IRowNode<TData>;
  column: Column;
}

export interface CellClickedEvent<TData = any> {
  event: MouseEvent;
  data: TData;
  node: IRowNode<TData>;
  column: Column;
  api: GridApi<TData>;
  value: any;
}

export interface CellDoubleClickedEvent<TData = any> {
  event: MouseEvent;
  data: TData;
  node: IRowNode<TData>;
  column: Column;
  api: GridApi<TData>;
  value: any;
}

export interface CellContextMenuEvent<TData = any> {
  event: MouseEvent;
  data: TData;
  node: IRowNode<TData>;
  column: Column;
  api: GridApi<TData>;
  value: any;
}

export interface IsRowNavigableParams<TData = any> {
  node: IRowNode<TData>;
  column: Column;
  data: TData;
}

export interface SuppressKeyboardEventParams<TData = any> {
  event: KeyboardEvent;
  node: IRowNode<TData>;
  data: TData;
  column: Column;
}

export interface SuppressPasteParams<TData = any> {
  node: IRowNode<TData>;
  column: Column;
  data: TData;
  value: any;
}

export interface GetQuickFilterTextParams<TData = any> {
  value: any;
  node: IRowNode<TData>;
  column: Column;
}

export interface ColSpanParams<TData = any> {
  node: IRowNode<TData>;
  data: TData;
  column: Column;
  api: GridApi<TData>;
}

export interface TooltipValueGetterParams<TData = any> {
  value: any;
  data: TData;
  node: IRowNode<TData>;
  column: Column;
}

export interface RowDragCallbackParams<TData = any> {
  node: IRowNode<TData>;
  data: TData;
}

// ============================================================================
// TYPE ALIASES AND ENUMS
// ============================================================================

export interface SortDef {
  sort: SortDirection;
  sortIndex?: number;
}

export type RowModelType = 'clientSide' | 'infinite' | 'serverSide' | 'viewport';
export type DomLayoutType = 'normal' | 'autoHeight' | 'print';
export type SortDirection = 'asc' | 'desc' | null;
export type RowGroupingDisplayType = 'singleColumn' | 'multipleColumns' | 'groupRows' | 'custom';
export type ColumnMenuTab = 'filterMenu' | 'mainMenu' | 'columnsMenu' | 'chartMenu';
export type DefaultMenuItem = 'pinMenu' | 'valueMenu' | 'columnMenu' | 'expandable' | 'separator' | 'copy' | 'copyWithHeaders' | 'copyWithGroupHeaders' | 'cut' | 'paste' | 'export' | 'chartRange' | 'pivot' | 'resetColumns' | 'deselectAll' | 'selectAll' | 'selectAllOtherColumns' | 'autoSizeAll' | 'autoSizeThisColumn' | 'resetColumns' | 'expandAll' | 'collapseAll' | 'rowGroupingGroup' | 'rowGroupingUnGroup' | 'pivotMenu' | 'aggFuncMenu' | 'sideBar';

export interface MenuItemDef {
  name: string;
  action: () => void;
  icon?: string | HTMLElement;
  disabled?: boolean;
  separator?: boolean;
  subMenu?: MenuItemDef[];
  cssClasses?: string[];
}

// ============================================================================
// FUNCTION TYPE DEFINITIONS
// ============================================================================

export type ValueGetterFunc<TData = any, TValue = any> = (params: ValueGetterParams<TData>) => TValue;
export type ValueFormatterFunc<TData = any, TValue = any> = (params: ValueFormatterParams<TData, TValue>) => string;
export type ValueSetterFunc<TData = any, TValue = any> = (params: ValueSetterParams<TData, TValue>) => boolean;
export type ValueParserFunc<TData = any, TValue = any> = (params: ValueParserParams<TData, TValue>) => TValue;
export type KeyCreatorFunc<TValue = any> = (params: KeyCreatorParams<TValue>) => string;
export type EqualsFunc<TValue = any> = (params: EqualsParams<TValue>) => boolean;
export type HeaderValueGetterFunc<TData = any> = (params: HeaderValueGetterParams<TData>) => string;
export type SortComparatorFn<TValue = any> = (valueA: TValue, valueB: TValue, nodeA: IRowNode, nodeB: IRowNode, isDescending: boolean) => number;
export type GetRowIdFunc<TData = any> = (params: GetRowIdParams<TData>) => string;
export type IAggFunc<TData = any> = (params: IAggFuncParams<TData>) => any;

export interface ValueGetterParams<TData = any> {
  data: TData;
  node: IRowNode<TData>;
  colDef: ColDef<TData>;
  api: GridApi<TData>;
}

export interface ValueFormatterParams<TData = any, TValue = any> {
  value: TValue;
  data: TData;
  node: IRowNode<TData>;
  colDef: ColDef<TData>;
  api: GridApi<TData>;
}

export interface ValueSetterParams<TData = any, TValue = any> {
  data: TData;
  value: TValue;
  newValue: TValue;
  node: IRowNode<TData>;
  colDef: ColDef<TData>;
  api: GridApi<TData>;
}

export interface ValueParserParams<TData = any, TValue = any> {
  data: TData;
  value: TValue;
  newValue: TValue;
  node: IRowNode<TData>;
  colDef: ColDef<TData>;
  api: GridApi<TData>;
}

export interface KeyCreatorParams<TValue = any> {
  value: TValue;
}

export interface EqualsParams<TValue = any> {
  valueA: TValue;
  valueB: TValue;
}

export interface HeaderValueGetterParams<TData = any> {
  colDef: ColDef<TData>;
  api: GridApi<TData>;
}

export interface GetRowIdParams<TData = any> {
  data: TData;
}

export interface IAggFuncParams<TData = any> {
  values: any[];
  data: TData[];
}

// ============================================================================
// DATA TYPE DEFINITIONS
// ============================================================================

export interface DataTypeDefinitions<TData = any> {
  [dataType: string]: DataTypeDefinition<TData>;
}

export interface DataTypeDefinition<TData = any> {
  baseDataType?: string;
  extendsDataType?: string;
  valueFormatter?: ValueFormatterFunc<TData, any>;
  valueParser?: ValueParserFunc<TData, any>;
  cellEditor?: any;
  cellEditorParams?: any;
}
