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
  /** Array of Column or Column Group definitions. */
  columnDefs?: (ColDef<TData> | ColGroupDef<TData>)[] | null;
  /** A default column definition of all columns in the grid. */
  defaultColDef?: ColDef<TData>;
  /** A default column group definition for all column groups in the grid. */
  defaultColGroupDef?: Partial<ColGroupDef<TData>>;
  /** A map of column types to column definitions. */
  columnTypes?: { [key: string]: ColDef<TData> };
  /** Definitions for custom data types. */
  dataTypeDefinitions?: DataTypeDefinitions<TData>;
  /** If true, the grid will maintain the order of columns as they are provided in the `columnDefs`. */
  maintainColumnOrder?: boolean;
  /** If true, pivot column order will be strictly maintained. */
  enableStrictPivotColumnOrder?: boolean;
  /** If true, the grid will not use dot notation for field names. */
  suppressFieldDotNotation?: boolean;

  // === ROW DATA ===
  /** Data to be displayed in the grid. */
  rowData?: TData[] | null;
  /** The type of row model to use. Defaults to 'clientSide'. */
  rowModelType?: RowModelType;
  /** Callback to get the ID for a row. */
  getRowId?: GetRowIdFunc<TData>;

  // === RENDERING ===
  /** If true, rows will animate when their position changes. */
  animateRows?: boolean;
  /** Duration in milliseconds for cell flashing. */
  cellFlashDuration?: number;
  /** Duration in milliseconds for cell fading. */
  cellFadeDuration?: number;
  /** Set the layout for the grid. Defaults to 'normal'. */
  domLayout?: DomLayoutType;
  /** Default height in pixels for each row. */
  rowHeight?: number;
  /** Default height in pixels for each header row. */
  headerHeight?: number;
  /** Callback to get the height for a row. */
  getRowHeight?: (params: RowHeightParams) => number | null | undefined;
  /** CSS style to apply to all rows. */
  rowStyle?: RowStyle;
  /** Callback to get the style for a row. */
  getRowStyle?: (params: RowClassParams) => RowStyle | undefined;
  /** CSS class to apply to all rows. */
  rowClass?: string | string[];
  /** Callback to get the class for a row. */
  getRowClass?: (params: RowClassParams) => string | string[] | undefined;
  /** Rules for applying CSS classes to rows based on data. */
  rowClassRules?: RowClassRules<TData>;
  /** If true, row hover highlight will be suppressed. */
  suppressRowHoverHighlight?: boolean;
  /** If true, column hover highlight will be enabled. */
  columnHoverHighlight?: boolean;

  // === SELECTION ===
  /** Row selection options. Can be 'single', 'multiple', or an options object. */
  rowSelection?: RowSelectionOptions | 'single' | 'multiple';
  /** Enable cell selection. */
  cellSelection?: boolean | CellSelectionOptions;
  /** Enable range selection. */
  enableRangeSelection?: boolean;
  /** Options for the selection column. */
  selectionColumnDef?: SelectionColumnDef;
  /** If true, cell focus will be suppressed. */
  suppressCellFocus?: boolean;
  /** If true, header focus will be suppressed. */
  suppressHeaderFocus?: boolean;
  /** If true, cell text selection will be enabled. */
  enableCellTextSelection?: boolean;

  // === SORTING ===
  /** If true, accented characters will be treated as their unaccented equivalents for sorting. */
  accentedSort?: boolean;
  /** If true, multi-column sorting will be suppressed. */
  suppressMultiSort?: boolean;
  /** If true, multi-column sorting will always be enabled. */
  alwaysMultiSort?: boolean;
  /** The key used for multi-column sorting. Defaults to 'ctrl'. */
  multiSortKey?: 'ctrl';
  /** If true, the grid will not maintain the unsorted order of rows. */
  suppressMaintainUnsortedOrder?: boolean;
  /** Callback called after rows are sorted. */
  postSortRows?: (params: PostSortRowsParams<TData>) => void;
  /** If true, delta sorting will be enabled. */
  deltaSort?: boolean;

  // === FILTERING ===
  /** Text to use for quick filtering. */
  quickFilterText?: string;
  /** If true, quick filter results will be cached. */
  cacheQuickFilter?: boolean;
  /** If true, hidden columns will be included in the quick filter. */
  includeHiddenColumnsInQuickFilter?: boolean;
  /** Callback to check if an external filter is present. */
  isExternalFilterPresent?: () => boolean;
  /** Callback to check if a row passes the external filter. */
  doesExternalFilterPass?: (node: IRowNode<TData>) => boolean;
  /** If true, children will be excluded when filtering tree data. */
  excludeChildrenWhenTreeDataFiltering?: boolean;
  /** Enable advanced filtering. */
  enableAdvancedFilter?: boolean;
  /** Enable floating filters. */
  floatingFilter?: boolean;

  // === SCROLLING ===
  /** Always show horizontal scrollbar. */
  alwaysShowHorizontalScroll?: boolean;
  /** Always show vertical scrollbar. */
  alwaysShowVerticalScroll?: boolean;
  /** Suppress horizontal scrollbar. */
  suppressHorizontalScroll?: boolean;
  /** Width of the scrollbar in pixels. */
  scrollbarWidth?: number;

  // === EDITING ===
  /** The type of editing to use. 'fullRow' or undefined. */
  editType?: 'fullRow' | undefined;
  /** If true, cells will start editing on a single click. */
  singleClickEdit?: boolean;
  /** If true, click editing will be suppressed. */
  suppressClickEdit?: boolean;
  /** If true, editing will stop when cells lose focus. */
  stopEditingWhenCellsLoseFocus?: boolean;
  /** If true, pressing Enter will navigate vertically. */
  enterNavigatesVertically?: boolean;
  /** If true, pressing Enter will navigate vertically after editing. */
  enterNavigatesVerticallyAfterEdit?: boolean;
  /** Enable undo/redo for cell editing. */
  undoRedoCellEditing?: boolean;
  /** The limit for undo/redo steps. */
  undoRedoCellEditingLimit?: number;
  /** How to handle invalid cell edits. */
  invalidEditValueMode?: 'legacy' | 'topScroll' | 'none';

  // === PAGINATION ===
  /** Enable pagination. */
  pagination?: boolean;
  /** The number of rows per page. */
  paginationPageSize?: number;
  /** Options for the page size selector. */
  paginationPageSizeSelector?: number[] | boolean;
  /** Automatically set the page size based on the grid height. */
  paginationAutoPageSize?: boolean;

  // === COLUMN SIZING ===
  /** Default column resize behavior. */
  colResizeDefault?: 'shift';
  /** If true, auto-sizing will be suppressed. */
  suppressAutoSize?: boolean;
  /** Padding in pixels to add when auto-sizing columns. */
  autoSizePadding?: number;
  /** If true, column resizing will be animated. */
  animateColumnResizing?: boolean;

  // === COLUMN MOVING ===
  /** If true, columns cannot be moved. */
  suppressMovableColumns?: boolean;
  /** If true, column move animation will be suppressed. */
  suppressColumnMoveAnimation?: boolean;

  // === ROW GROUPING ===
  /** The display type for row grouping. */
  groupDisplayType?: RowGroupingDisplayType;
  /** Definition for the auto-group column. */
  autoGroupColumnDef?: AutoGroupColumnDef<TData>;
  /** Renderer for group rows. */
  groupRowRenderer?: any;
  /** Parameters for the group row renderer. */
  groupRowRendererParams?: any;
  /** If true, open parents will be hidden in groups. */
  groupHideOpenParents?: boolean;
  /** The default level to expand groups to. */
  groupDefaultExpanded?: number;
  /** When to show the row group panel. */
  rowGroupPanelShow?: 'always' | 'onlyWhenGrouping' | 'never';

  // === TREE DATA ===
  /** Enable tree data. */
  treeData?: boolean;
  /** Callback to get the path for a row in tree data. */
  getDataPath?: (data: TData) => string[];
  /** Field to use for children in tree data. */
  treeDataChildrenField?: string;
  /** Field to use for parent ID in tree data. */
  treeDataParentIdField?: string;

  // === MASTER DETAIL ===
  /** Enable master-detail. */
  masterDetail?: boolean;
  /** Callback to check if a row is a master row. */
  isRowMaster?: (data: TData) => boolean;
  /** Renderer for the detail cell. */
  detailCellRenderer?: any;
  /** Parameters for the detail cell renderer. */
  detailCellRendererParams?: any;
  /** Height in pixels for the detail row. */
  detailRowHeight?: number;

  // === PINNING ===
  /** Enable row pinning. */
  enableRowPinning?: boolean | 'top' | 'bottom';
  /** Data for rows pinned to the top. */
  pinnedTopRowData?: any[];
  /** Data for rows pinned to the bottom. */
  pinnedBottomRowData?: any[];

  // === PIVOTING ===
  /** Enable pivot mode. */
  pivotMode?: boolean;
  /** When to show the pivot panel. */
  pivotPanelShow?: 'always' | 'onlyWhenPivoting' | 'never';

  // === STYLING ===
  /** Custom icons for the grid. */
  icons?: Icons;
  /** Theme for the grid. */
  theme?: Theme | 'legacy';
  /** Configuration for the side bar. */
  sideBar?: any;

  // === OVERLAYS ===
  /** Component to use for the loading overlay. */
  loadingOverlayComponent?: any;
  /** Parameters to pass to the loading overlay component. */
  loadingOverlayComponentParams?: any;
  /** Component to use for the no rows overlay. */
  noRowsOverlayComponent?: any;
  /** Parameters to pass to the no rows overlay component. */
  noRowsOverlayComponentParams?: any;
  /** Set to true to suppress the loading overlay. */
  suppressLoadingOverlay?: boolean;
  /** Set to true to suppress the no rows overlay. */
  suppressNoRowsOverlay?: boolean;
  /** Show loading overlay. */
  loading?: boolean;

  // === CONTEXT ===
  /** Custom context object available in callbacks. */
  context?: any;
  /** Unique ID for the grid. */
  gridId?: string;
  /** Enable debug logging. */
  debug?: boolean;

  // === CALLBACKS ===
  /** Callback to process a cell value before it's copied to the clipboard. */
  processCellForClipboard?: (params: ProcessCellForClipboardParams<TData>) => any;
  /** Callback to process a cell value after it's pasted from the clipboard. */
  processCellFromClipboard?: (params: ProcessCellFromClipboardParams<TData>) => any;
  /** Callback to get context menu items. */
  getContextMenuItems?: (
    params: GetContextMenuItemsParams<TData>
  ) => (DefaultMenuItem | MenuItemDef)[];
  /** Callback to get main menu items. */
  getMainMenuItems?: (params: GetMainMenuItemsParams<TData>) => (DefaultMenuItem | MenuItemDef)[];
}

// ============================================================================
// COLUMN DEFINITIONS
// ============================================================================

export interface ColDef<TData = any, TValue = any> {
  // === COLUMNS ===
  /** The field of the row object to get the cell's data from. */
  field?: keyof TData | string;
  /** The unique ID for the column. */
  colId?: string;
  /** Column type or types. */
  type?: string | string[];
  /** The data type for the cell. */
  cellDataType?: boolean | string;
  /** Callback or string expression to get the cell value. */
  valueGetter?: string | ValueGetterFunc<TData, TValue>;
  /** Callback or string expression to format the cell value for display. */
  valueFormatter?: string | ValueFormatterFunc<TData, TValue>;
  /** Reference data for the column. */
  refData?: { [key: string]: any };
  /** Callback to create a key for the cell value. */
  keyCreator?: KeyCreatorFunc<TValue>;
  /** Callback to check if two values are equal. */
  equals?: EqualsFunc<TValue>;
  /** CSS class to apply to the tool panel for this column. */
  toolPanelClass?: string | string[];
  /** If true, this column will not be shown in the columns tool panel. */
  suppressColumnsToolPanel?: boolean;
  /** Whether to show the column when the group is open or closed. */
  columnGroupShow?: 'open' | 'closed' | 'all';
  /** Custom icons for the column. */
  icons?: Icons;
  /** If true, this column will not be navigable using the keyboard. */
  suppressNavigable?: boolean | ((params: IsRowNavigableParams<TData>) => boolean);
  /** Callback to suppress keyboard events for this column. */
  suppressKeyboardEvent?: (params: SuppressKeyboardEventParams<TData>) => boolean;
  /** If true, pasting into this column will be suppressed. */
  suppressPaste?: boolean | ((params: SuppressPasteParams<TData>) => boolean);
  /** If true, the fill handle will be suppressed for this column. */
  suppressFillHandle?: boolean;
  /** Context menu items for this column. */
  contextMenuItems?:
    | (DefaultMenuItem | MenuItemDef)[]
    | ((params: any) => (DefaultMenuItem | MenuItemDef)[]);
  /** Custom context object available in callbacks. */
  context?: any;

  // === SELECTION ===
  /** If true, show a checkbox for row selection in this column. */
  checkboxSelection?: boolean;
  /** If true, show a checkbox in the header for selecting all rows. */
  headerCheckboxSelection?: boolean;
  /** If true, only filtered rows will be selected when the header checkbox is clicked. */
  headerCheckboxSelectionFilteredOnly?: boolean;

  // === ACCESSIBILITY ===
  /** ARIA role for the cell. */
  cellAriaRole?: string;

  // === AGGREGATION ===
  /** Aggregation function for the column. */
  aggFunc?: string | IAggFunc<TData> | null;
  /** Initial aggregation function for the column. */
  initialAggFunc?: string | IAggFunc<TData>;
  /** If true, enable value aggregation for this column. */
  enableValue?: boolean;
  /** Allowed aggregation functions for this column. */
  allowedAggFuncs?: string[];
  /** Default aggregation function for this column. */
  defaultAggFunc?: string;

  // === DISPLAY ===
  /** If true, the column is hidden. */
  hide?: boolean | null;
  /** If true, the column is initially hidden. */
  initialHide?: boolean;
  /** If true, the column's visibility cannot be changed. */
  lockVisible?: boolean;
  /** If true, the column's position is locked. */
  lockPosition?: boolean | 'left' | 'right';
  /** If true, the column cannot be moved. */
  suppressMovable?: boolean;
  /** If true, the value formatter will be used for export. */
  useValueFormatterForExport?: boolean;

  // === EDITING ===
  /** If true, the cell is editable. */
  editable?: boolean | ((params: EditableCallbackParams<TData>) => boolean);
  /** Callback or string expression to set the cell value. */
  valueSetter?: string | ValueSetterFunc<TData, TValue>;
  /** Callback or string expression to parse the cell value after editing. */
  valueParser?: string | ValueParserFunc<TData, TValue>;
  /** Cell editor component. */
  cellEditor?: any;
  /** Parameters for the cell editor. */
  cellEditorParams?: any;
  /** Selector for the cell editor. */
  cellEditorSelector?: (params: any) => any;
  /** If true, the cell editor will be shown in a popup. */
  cellEditorPopup?: boolean;
  /** The position of the cell editor popup. */
  cellEditorPopupPosition?: 'over' | 'under';
  /** If true, start editing on a single click. */
  singleClickEdit?: boolean;
  /** If true, the value parser will be used for import. */
  useValueParserForImport?: boolean;
  /** Callback to get validation errors for the cell. */
  getValidationErrors?: (params: GetValidationErrorsParams<TData>) => string[] | null;

  // === EVENTS ===
  /** Callback called when a cell value changes. */
  onCellValueChanged?: (params: NewValueParams<TData>) => void;
  /** Callback called when a cell is clicked. */
  onCellClicked?: (params: CellClickedEvent<TData>) => void;
  /** Callback called when a cell is double clicked. */
  onCellDoubleClicked?: (params: CellDoubleClickedEvent<TData>) => void;
  /** Callback called when a cell context menu is triggered. */
  onCellContextMenu?: (params: CellContextMenuEvent<TData>) => void;

  // === FILTER ===
  /** Filter component to use for this column. */
  filter?: any;
  /** Parameters for the filter. */
  filterParams?: any;
  /** Callback or string expression to get the value for filtering. */
  filterValueGetter?: string | ValueGetterFunc<TData, any>;
  /** Callback to get the text for quick filtering. */
  getQuickFilterText?: (params: GetQuickFilterTextParams<TData>) => string;
  /** If true, show a floating filter for this column. */
  floatingFilter?: boolean;
  /** Floating filter component. */
  floatingFilterComponent?: any;
  /** Parameters for the floating filter component. */
  floatingFilterComponentParams?: any;
  /** If true, this column will not be shown in the filters tool panel. */
  suppressFiltersToolPanel?: boolean;

  // === HEADER ===
  /** The name of the header. */
  headerName?: string;
  /** Callback or string expression to get the header name. */
  headerValueGetter?: string | HeaderValueGetterFunc<TData>;
  /** Tooltip for the header. */
  headerTooltip?: string;
  /** CSS style for the header. */
  headerStyle?: { [key: string]: any } | ((params: any) => { [key: string]: any });
  /** CSS class for the header. */
  headerClass?: string | string[] | ((params: any) => string | string[]);
  /** Header component. */
  headerComponent?: any;
  /** Parameters for the header component. */
  headerComponentParams?: any;
  /** If true, wrap header text. */
  wrapHeaderText?: boolean;
  /** If true, automatically set header height. */
  autoHeaderHeight?: boolean;
  /** Menu tabs to show in the column menu. */
  menuTabs?: ColumnMenuTab[];
  /** If true, suppress the header menu button. */
  suppressHeaderMenuButton?: boolean;
  /** If true, suppress the header filter button. */
  suppressHeaderFilterButton?: boolean;
  /** If true, suppress the header context menu. */
  suppressHeaderContextMenu?: boolean;

  // === PINNED ===
  /** Pin the column to 'left' or 'right'. */
  pinned?: boolean | 'left' | 'right' | null;
  /** Initial pinned state. */
  initialPinned?: boolean | 'left' | 'right';
  /** If true, the pinned state is locked. */
  lockPinned?: boolean;

  // === PIVOTING ===
  /** If true, the column is a pivot column. */
  pivot?: boolean | null;
  /** Initial pivot state. */
  initialPivot?: boolean;
  /** Initial pivot index. */
  pivotIndex?: number | null;
  /** If true, enable pivoting for this column. */
  enablePivot?: boolean;

  // === RENDERING AND STYLING ===
  /** CSS style for the cell. */
  cellStyle?:
    | { [key: string]: any }
    | ((params: CellStyleParams<TData, TValue>) => { [key: string]: any });
  /** CSS class for the cell. */
  cellClass?: string | string[] | ((params: CellClassParams<TData, TValue>) => string | string[]);
  /** Rules for applying CSS classes to cells based on data. */
  cellClassRules?: { [key: string]: (params: CellClassParams<TData, TValue>) => boolean };
  /** If true, the cell will not show an ellipsis if the text overflows. */
  suppressEllipsis?: boolean;
  /** Cell renderer component. */
  cellRenderer?: any;
  /** Parameters for the cell renderer. */
  cellRendererParams?: any;
  /** Selector for the cell renderer. */
  cellRendererSelector?: (params: any) => any;
  /** If true, automatically set row height based on cell content. */
  autoHeight?: boolean;
  /** If true, wrap cell text. */
  wrapText?: boolean;
  /** If true, enable cell change flashing. */
  enableCellChangeFlash?: boolean;

  // === ROW DRAGGING ===
  /** If true, enable row dragging for this column. */
  rowDrag?: boolean | ((params: RowDragCallbackParams<TData>) => boolean);
  /** Callback to get the text for row dragging. */
  rowDragText?: (params: any) => string;
  /** If true, this column is a drag and drop source. */
  dndSource?: boolean | ((params: any) => boolean);

  // === SPARKLINE ===
  /** Options for sparkline rendering. */
  sparklineOptions?: SparklineOptions;

  // === PROGRESS BAR ===
  /** Options for progress bar rendering. */
  progressOptions?: ProgressOptions;

  // === BADGE ===
  /** Options for badge rendering. */
  badgeOptions?: BadgeOptions;

  // === BUTTON ===
  /** Options for button rendering. */
  buttonOptions?: ButtonOptions<TData>;

  /** Options for rating (star) rendering. */
  ratingOptions?: RatingOptions;

  // === ROW GROUPING ===
  /** If true, the column is a row group column. */
  rowGroup?: boolean | null;
  /** Initial row group state. */
  initialRowGroup?: boolean;
  /** Initial row group index. */
  rowGroupIndex?: number | null;
  /** If true, enable row grouping for this column. */
  enableRowGroup?: boolean;
  /** Field or boolean to show row group. */
  showRowGroup?: string | boolean;

  // === SORT ===
  /** If true, the column is sortable. */
  sortable?: boolean;
  /** Initial sort direction or definition. */
  sort?: SortDirection | SortDef;
  /** Initial sort direction or definition. */
  initialSort?: SortDirection | SortDef;
  /** Initial sort index. */
  sortIndex?: number | null;
  /** Allowed sorting orders for this column. */
  sortingOrder?: (SortDirection | SortDef)[];
  /** Custom comparator for sorting. */
  comparator?: SortComparatorFn<TValue>;
  /** If true, show the unsort icon. */
  unSortIcon?: boolean;

  // === SPANNING ===
  /** Callback to get the column span. */
  colSpan?: (params: ColSpanParams<TData>) => number;
  /** Whether to span rows. */
  spanRows?: boolean | ((params: any) => boolean);

  // === TOOLTIPS ===
  /** The field to use for the tooltip. */
  tooltipField?: keyof TData | string;
  /** Callback to get the tooltip value. */
  tooltipValueGetter?: (params: TooltipValueGetterParams<TData>) => string;
  /** Tooltip component. */
  tooltipComponent?: any;
  /** Parameters for the tooltip component. */
  tooltipComponentParams?: any;

  // === WIDTH ===
  /** The width of the column in pixels. */
  width?: number;
  /** Initial width of the column in pixels. */
  initialWidth?: number;
  /** Minimum width of the column in pixels. */
  minWidth?: number;
  /** Maximum width of the column in pixels. */
  maxWidth?: number;
  /** The flex factor for the column. */
  flex?: number | null;
  /** Initial flex factor for the column. */
  initialFlex?: number;
  /** If true, the column is resizable. */
  resizable?: boolean;
  /** If true, this column will be suppressed from size-to-fit. */
  suppressSizeToFit?: boolean;
  /** If true, this column will be suppressed from auto-sizing. */
  suppressAutoSize?: boolean;
}

export interface ColGroupDef<TData = any> {
  // === GROUPS (required) ===
  /** The columns or column groups within this group. */
  children: (ColDef<TData> | ColGroupDef<TData>)[];
  /** The unique ID for the column group. */
  groupId?: string;
  /** If true, the children will be 'married' and move together. */
  marryChildren?: boolean;
  /** If true, the group will be open by default. */
  openByDefault?: boolean;
  /** Whether to show the column when the group is open or closed. */
  columnGroupShow?: 'open' | 'closed' | 'all';
  /** CSS class to apply to the tool panel for this group. */
  toolPanelClass?: string | string[];
  /** If true, this group will not be shown in the columns tool panel. */
  suppressColumnsToolPanel?: boolean;
  /** If true, this group will not be shown in the filters tool panel. */
  suppressFiltersToolPanel?: boolean;

  // === HEADER ===
  /** The name of the group header. */
  headerName?: string;
  /** CSS class for the group header. */
  headerClass?: string | string[] | ((params: any) => string | string[]);
  /** Tooltip for the group header. */
  headerTooltip?: string;
  /** If true, automatically set header height. */
  autoHeaderHeight?: boolean;
  /** Header group component. */
  headerGroupComponent?: any;
  /** Parameters for the header group component. */
  headerGroupComponentParams?: any;
  /** If true, suppress the sticky label for this group. */
  suppressStickyLabel?: boolean;
}

// ============================================================================
// GRID API
// ============================================================================

export interface GridApi<TData = any> {
  // === COLUMN API ===
  /** Returns the current column definitions. */
  getColumnDefs(): (ColDef<TData> | ColGroupDef<TData>)[] | null;
  /** Sets the column definitions. */
  setColumnDefs(colDefs: (ColDef<TData> | ColGroupDef<TData>)[]): void;
  /** Returns the column with the given key. */
  getColumn(key: string | Column): Column | null;
  /** Returns all columns. */
  getAllColumns(): Column[];
  /** Returns the row node at the given index. */
  getDisplayedRowAtIndex(index: number): IRowNode<TData> | null;
  /** Returns the header rows. */
  getHeaderRows(): (Column | ColumnGroup)[][];
  /** Returns the depth of the header. */
  getHeaderDepth(): number;
  /** Returns the height of the header. */
  getHeaderHeight(): number;
  /** Toggles the expansion state of a column group. */
  toggleColumnGroup(groupId: string, expanded: boolean): void;
  /** Adds a column to the row grouping. */
  addRowGroupColumn(colId: string): void;
  /** Removes a column from the row grouping. */
  removeRowGroupColumn(colId: string): void;
  /** Sets the columns to use for row grouping. */
  setRowGroupColumns(colIds: string[]): void;
  /** Returns the columns used for row grouping. */
  getRowGroupColumns(): string[];
  /** Sets the pinned state of a column. */
  setColumnPinned(col: string | Column, pinned: 'left' | 'right' | boolean): void;
  /** Moves a column to a new index. */
  moveColumn(col: string | Column, toIndex: number): void;
  /** Sets the visibility of a column. */
  setColumnVisible(col: string | Column, visible: boolean): void;
  /** Sets the width of a column. */
  setColumnWidth(col: string | Column, width: number): void;
  /** Sets the sort of a column. */
  setColumnSort(col: string | Column, sort: SortDirection, multiSort?: boolean): void;
  /** Notifies the grid that the sort has changed. */
  onSortChanged(): void;

  // === ROW DATA API ===
  /** Returns all row data in the grid. */
  getRowData(): TData[];
  /** Sets the row data. */
  setRowData(rowData: TData[]): void;
  /** Applies a transaction to the row data. */
  applyTransaction(transaction: RowDataTransaction<TData>): RowDataTransactionResult | null;
  /** Returns the number of displayed rows. */
  getDisplayedRowCount(): number;
  /** Returns the Y position of the row at the given index. */
  getRowY(index: number): number;
  /** Returns the current aggregations. */
  getAggregations(): { [field: string]: any };
  /** Returns the row node with the given ID. */
  getRowNode(id: string): IRowNode<TData> | null;

  // === SELECTION API ===
  /** Returns the data for the selected rows. */
  getSelectedRows(): IRowNode<TData>[];
  /** Returns the selected row nodes. */
  getSelectedNodes(): IRowNode<TData>[];
  /** Selects all rows. */
  selectAll(): void;
  /** Deselects all rows. */
  deselectAll(): void;

  // === FILTER API ===
  /** Sets the filter model. */
  setFilterModel(model: FilterModel): void;
  /** Returns the filter model. */
  getFilterModel(): FilterModel;
  /** Notifies the grid that the filter has changed. */
  onFilterChanged(): void;
  /** Returns true if any filter is present. */
  isFilterPresent(): boolean;
  /** Sets the quick filter text. */
  setQuickFilter(text: string): void;

  // === SORT API ===
  /** Sets the sort model. */
  setSortModel(model: SortModelItem[]): void;
  /** Returns the sort model. */
  getSortModel(): SortModelItem[];
  /** Notifies the grid that the sort has changed. */
  onSortChanged(): void;

  // === PAGINATION API ===
  /** Returns the current page size. */
  paginationGetPageSize(): number;
  /** Sets the page size. */
  paginationSetPageSize(size: number): void;
  /** Returns the current page index. */
  paginationGetCurrentPage(): number;
  /** Returns the total number of pages. */
  paginationGetTotalPages(): number;
  /** Goes to the first page. */
  paginationGoToFirstPage(): void;
  /** Goes to the last page. */
  paginationGoToLastPage(): void;
  /** Goes to the next page. */
  paginationGoToNextPage(): void;
  /** Goes to the previous page. */
  paginationGoToPreviousPage(): void;
  /** Returns the total number of rows across all pages. */
  getPaginationTotalRows(): number;

  // === EXPORT API ===
  /** Exports the grid data as CSV. */
  exportDataAsCsv(params?: CsvExportParams): void;
  /** Exports the grid data as Excel. */
  exportDataAsExcel(params?: ExcelExportParams): void;

  // === CLIPBOARD API ===
  /** Copies the selected cells to the clipboard. */
  copyToClipboard(): void;
  /** Cuts the selected cells to the clipboard. */
  cutToClipboard(): void;

  // === STATE PERSISTENCE API ===
  /** Returns the current grid state. */
  getState(): GridState;
  /** Sets the grid state. */
  setState(state: GridState): void;
  /** Saves the grid state. */
  saveState(key?: string): void;
  /** Restores the grid state. */
  restoreState(key?: string): boolean;
  /** Clears the grid state. */
  clearState(key?: string): void;
  /** Returns true if the grid has a saved state. */
  hasState(key?: string): boolean;
  /** Returns unique values for a field. */
  getUniqueValues(field: string): any[];
  /** Pastes from the clipboard. */
  pasteFromClipboard(): void;

  // === GRID STATE API ===
  /** Returns the current grid state. */
  getState(): GridState;
  /** Applies a grid state. */
  applyState(state: GridState): void;

  // === FOCUS API ===
  /** Sets the focus to the cell at the given row and column. */
  setFocusedCell(rowIndex: number, colKey: string): void;
  /** Returns the currently focused cell position. */
  getFocusedCell(): CellPosition | null;

  // === REFRESH API ===
  /** Refreshes the given cells. */
  refreshCells(params?: RefreshCellsParams): void;
  /** Refreshes the given rows. */
  refreshRows(params?: RefreshRowsParams): void;
  /** Refreshes the header. */
  refreshHeader(): void;

  // === SCROLL API ===
  /** Ensures the row at the given index is visible. */
  ensureIndexVisible(index: number, position?: 'top' | 'bottom' | 'auto'): void;
  /** Ensures the column with the given key is visible. */
  ensureColumnVisible(key: string): void;

  // === DESTROY API ===
  /** Destroys the grid. */
  destroy(): void;

  // === GRID INFORMATION ===
  /** Returns the grid ID. */
  getGridId(): string;
  /** Returns a grid option value. */
  getGridOption<K extends keyof GridOptions<TData>>(key: K): GridOptions<TData>[K];
  /** Sets a grid option value. */
  setGridOption<K extends keyof GridOptions<TData>>(key: K, value: GridOptions<TData>[K]): void;

  // === GROUP EXPANSION ===
  /** Sets the expansion state of a row node. */
  setRowNodeExpanded(node: IRowNode<TData>, expanded: boolean): void;

  // === ROW HEIGHT API ===
  /** Returns the Y position of the row at the given index. */
  getRowY(index: number): number;
  /** Returns the row index at the given Y position. */
  getRowAtY(y: number): number;
  /** Returns the total height of all rows. */
  getTotalHeight(): number;

  // === PIVOT API ===
  /** Sets pivot mode. */
  setPivotMode(pivotMode: boolean): void;
  /** Returns true if pivot mode is enabled. */
  isPivotMode(): boolean;

  // === RANGE SELECTION ===
  /** Returns the current cell ranges. */
  getCellRanges(): CellRange[] | null;
  /** Adds a cell range. */
  addCellRange(params: CellRange): void;
  /** Clears the range selection. */
  clearRangeSelection(): void;

  // === OVERLAY API ===
  /** Shows the loading overlay. */
  showLoadingOverlay(): void;
  /** Shows the no rows overlay. */
  showNoRowsOverlay(): void;
  /** Hides the currently showing overlay. */
  hideOverlay(): void;
}

// ============================================================================
// SUPPORTING TYPES AND INTERFACES
// ============================================================================

export interface Column {
  /** Unique ID for the column. */
  colId: string;
  /** The field of the row object this column represents. */
  field?: string;
  /** The header name for the column. */
  headerName?: string;
  /** The current width of the column in pixels. */
  width: number;
  /** The minimum width of the column in pixels. */
  minWidth?: number;
  /** The maximum width of the column in pixels. */
  maxWidth?: number;
  /** Pinned state of the column ('left', 'right', or false). */
  pinned: 'left' | 'right' | false;
  /** Visibility state of the column. */
  visible: boolean;
  /** Current sort direction ('asc', 'desc', or null). */
  sort?: SortDirection;
  /** Current sort index for multi-column sorting. */
  sortIndex?: number;
  /** Current aggregation function. */
  aggFunc?: string | null;
  /** True if checkbox selection is enabled for this column. */
  checkboxSelection?: boolean;
  /** True if header checkbox selection is enabled for this column. */
  headerCheckboxSelection?: boolean;
  /** Filter component or definition for this column. */
  filter?: any;
  /** Parent column group. */
  parent?: ColumnGroup;
  /** Whether to show the column when the group is open or closed. */
  columnGroupShow?: 'open' | 'closed' | 'all';
  /** The index of the column in the grid. */
  colIndex?: number;
}

export interface ColumnGroup {
  groupId: string;
  headerName?: string;
  children: (Column | ColumnGroup)[];
  displayedChildren: (Column | ColumnGroup)[];
  visible: boolean;
  expanded: boolean;
  resizable?: boolean;
  parent?: ColumnGroup;
  pinned?: 'left' | 'right' | false;
  level: number;
  columnGroupShow?: 'open' | 'closed' | 'all';
  marryChildren?: boolean;
  colIndex?: number;
}

export interface IRowNode<TData = any> {
  /** Unique ID for the row. */
  id: string | null;
  /** The row data. */
  data: TData;
  /** Pinned state of the row ('top', 'bottom', or false). */
  rowPinned: 'top' | 'bottom' | false;
  /** Height of the row in pixels. */
  rowHeight: number | null;
  /** True if the row is currently displayed. */
  displayed: boolean;
  /** True if the row is selected. */
  selected: boolean;
  /** True if the group row is expanded. */
  expanded: boolean;
  /** True if the row is a group row. */
  group: boolean;
  /** True if the row is a master row. */
  master?: boolean;
  /** True if the row is a detail row. */
  detail?: boolean;
  /** Reference to the master row node if this is a detail row. */
  masterRowNode?: IRowNode<TData>;
  /** The level of the row in grouping/tree data. */
  level: number;
  /** The parent row node. */
  parent?: IRowNode<TData>;
  /** Children row nodes if this is a group/master row. */
  children?: IRowNode<TData>[];
  /** Children row nodes after filtering. */
  childrenAfterFilter?: IRowNode<TData>[];
  /** Children row nodes after sorting. */
  childrenAfterSort?: IRowNode<TData>[];
  /** All leaf children row nodes. */
  allLeafChildren?: IRowNode<TData>[];
  /** True if this is the first child. */
  firstChild: boolean;
  /** True if this is the last child. */
  lastChild: boolean;
  /** The index of the row in the row model. */
  rowIndex: number | null;
  /** The index of the row as displayed. */
  displayedRowIndex: number;
  /** Sets the selection state of the row. */
  setSelected(selected: boolean, clearSelection?: boolean): void;
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
  filterModels?: FilterModelItem[];
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
  endColumn: string; // colId
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

export interface ButtonCellRendererParams<TData = any> {
  /** The raw cell value */
  value: any;
  /** The row data object */
  data: TData;
  /** The row node */
  node: IRowNode<TData>;
  /** The grid API */
  api: GridApi<TData>;
  /** The column definition */
  colDef: ColDef<TData>;
  /** The original mouse event */
  event: MouseEvent;
}

export interface ButtonOptions<TData = any> {
  /**
   * Button label. Can be a string or a function receiving cell params.
   * Compatible with AG Grid's cellRendererParams pattern.
   */
  label: string | ((params: Omit<ButtonCellRendererParams<TData>, 'event'>) => string);
  /**
   * Visual style preset. Defaults to 'primary'.
   * - primary: filled blue
   * - secondary: outlined
   * - danger: filled red
   * - ghost: transparent with hover-style border
   */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  /** Override background fill color */
  fill?: string;
  /** Override text color */
  textColor?: string;
  /** Override border color (secondary/ghost variants) */
  borderColor?: string;
  /** Border radius in px (default: 4) */
  borderRadius?: number;
  /** Font size in px (default: 12) */
  fontSize?: number;
  /** Horizontal padding in px (default: 12) */
  paddingX?: number;
  /**
   * Click handler — receives AG Grid-compatible params.
   * Called instead of the row's onRowClicked event when the button is clicked.
   */
  onClick?: (params: ButtonCellRendererParams<TData>) => void;
}

export interface BadgeOptions {
  /**
   * Map of cell value → { fill, text } colors.
   * Falls back to `defaultColors` if value not found.
   */
  colorMap?: Record<string, { fill: string; text: string }>;
  /** Fallback colors for values not in colorMap */
  defaultColors?: { fill: string; text: string };
  /** Border radius in px (default: 9999 for pill shape) */
  borderRadius?: number;
  /** Horizontal padding in px (default: 8) */
  paddingX?: number;
  /** Font size in px (default: 11) */
  fontSize?: number;
}

export interface ProgressOptions {
  /** Minimum value (default: 0) */
  min?: number;
  /** Maximum value (default: 100) */
  max?: number;
  /** Bar fill color or function returning a color based on value */
  fill?: string | ((value: number) => string);
  /** Track background color (default: '#e5e7eb') */
  trackColor?: string;
  /** Bar height in px (default: 8) */
  barHeight?: number;
  /** Border radius in px (default: 4) */
  borderRadius?: number;
  /** Show text label after the bar (default: true) */
  showLabel?: boolean;
  /** Custom label formatter */
  labelFormatter?: (value: number) => string;
}

export interface RatingOptions {
  /** Maximum number of stars (default: 5) */
  max?: number;
  /** Color of filled stars (default: '#ffb400') */
  color?: string;
  /** Color of empty stars (default: '#e5e7eb') */
  emptyColor?: string;
  /** Size of stars in px (default: 14) */
  size?: number;
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
  bar?: {
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

export type CellSelectionOptions = {};

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
export type DefaultMenuItem =
  | 'pinMenu'
  | 'valueMenu'
  | 'columnMenu'
  | 'expandable'
  | 'separator'
  | 'copy'
  | 'copyWithHeaders'
  | 'copyWithGroupHeaders'
  | 'cut'
  | 'paste'
  | 'export'
  | 'chartRange'
  | 'pivot'
  | 'resetColumns'
  | 'deselectAll'
  | 'selectAll'
  | 'selectAllOtherColumns'
  | 'autoSizeAll'
  | 'autoSizeThisColumn'
  | 'resetColumns'
  | 'expandAll'
  | 'collapseAll'
  | 'rowGroupingGroup'
  | 'rowGroupingUnGroup'
  | 'pivotMenu'
  | 'aggFuncMenu'
  | 'sideBar';

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

export type ValueGetterFunc<TData = any, TValue = any> = (
  params: ValueGetterParams<TData>
) => TValue;
export type ValueFormatterFunc<TData = any, TValue = any> = (
  params: ValueFormatterParams<TData, TValue>
) => string;
export type ValueSetterFunc<TData = any, TValue = any> = (
  params: ValueSetterParams<TData, TValue>
) => boolean;
export type ValueParserFunc<TData = any, TValue = any> = (
  params: ValueParserParams<TData, TValue>
) => TValue;
export type KeyCreatorFunc<TValue = any> = (params: KeyCreatorParams<TValue>) => string;
export type EqualsFunc<TValue = any> = (params: EqualsParams<TValue>) => boolean;
export type HeaderValueGetterFunc<TData = any> = (params: HeaderValueGetterParams<TData>) => string;
export type SortComparatorFn<TValue = any> = (
  valueA: TValue,
  valueB: TValue,
  nodeA: IRowNode,
  nodeB: IRowNode,
  isDescending: boolean
) => number;
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

export interface GetValidationErrorsParams<TData = any> {
  value: any;
  data: TData;
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
