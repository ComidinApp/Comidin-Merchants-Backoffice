/**
 * Traducciones en español para MUI X DataGrid v6
 * 
 * Uso:
 * import { esES_DataGrid } from 'src/locales/data-grid-es';
 * 
 * <DataGrid localeText={esES_DataGrid} ... />
 */

export const esES_DataGrid = {
  // Root
  noRowsLabel: 'Sin filas',
  noResultsOverlayLabel: 'No se encontraron resultados.',
  
  // Density selector toolbar button text
  toolbarDensity: 'Densidad',
  toolbarDensityLabel: 'Densidad',
  toolbarDensityCompact: 'Compacta',
  toolbarDensityStandard: 'Estándar',
  toolbarDensityComfortable: 'Cómoda',
  
  // Columns selector toolbar button text
  toolbarColumns: 'Columnas',
  toolbarColumnsLabel: 'Seleccionar columnas',
  
  // Filters toolbar button text
  toolbarFilters: 'Filtros',
  toolbarFiltersLabel: 'Mostrar filtros',
  toolbarFiltersTooltipHide: 'Ocultar filtros',
  toolbarFiltersTooltipShow: 'Mostrar filtros',
  toolbarFiltersTooltipActive: (count) =>
    count !== 1 ? `${count} filtros activos` : `${count} filtro activo`,
  
  // Quick filter toolbar field
  toolbarQuickFilterPlaceholder: 'Buscar...',
  toolbarQuickFilterLabel: 'Buscar',
  toolbarQuickFilterDeleteIconLabel: 'Limpiar',
  
  // Export selector toolbar button text
  toolbarExport: 'Exportar',
  toolbarExportLabel: 'Exportar',
  toolbarExportCSV: 'Descargar como CSV',
  toolbarExportPrint: 'Imprimir',
  toolbarExportExcel: 'Descargar como Excel',
  
  // Columns panel text
  columnsPanelTextFieldLabel: 'Buscar columna',
  columnsPanelTextFieldPlaceholder: 'Título de columna',
  columnsPanelDragIconLabel: 'Reordenar columna',
  columnsPanelShowAllButton: 'Mostrar todo',
  columnsPanelHideAllButton: 'Ocultar todo',
  
  // Filter panel text
  filterPanelAddFilter: 'Agregar filtro',
  filterPanelRemoveAll: 'Eliminar todos',
  filterPanelDeleteIconLabel: 'Eliminar',
  filterPanelLogicOperator: 'Operador lógico',
  filterPanelOperator: 'Operador',
  filterPanelOperatorAnd: 'Y',
  filterPanelOperatorOr: 'O',
  filterPanelColumns: 'Columnas',
  filterPanelInputLabel: 'Valor',
  filterPanelInputPlaceholder: 'Valor del filtro',
  
  // Filter operators text
  filterOperatorContains: 'contiene',
  filterOperatorEquals: 'es igual a',
  filterOperatorStartsWith: 'comienza con',
  filterOperatorEndsWith: 'termina con',
  filterOperatorIs: 'es',
  filterOperatorNot: 'no es',
  filterOperatorAfter: 'es posterior a',
  filterOperatorOnOrAfter: 'es en o posterior a',
  filterOperatorBefore: 'es anterior a',
  filterOperatorOnOrBefore: 'es en o anterior a',
  filterOperatorIsEmpty: 'está vacío',
  filterOperatorIsNotEmpty: 'no está vacío',
  filterOperatorIsAnyOf: 'es cualquiera de',
  'filterOperator=': '=',
  'filterOperator!=': '!=',
  'filterOperator>': '>',
  'filterOperator>=': '>=',
  'filterOperator<': '<',
  'filterOperator<=': '<=',
  
  // Header filter operators text
  headerFilterOperatorContains: 'Contiene',
  headerFilterOperatorEquals: 'Igual a',
  headerFilterOperatorStartsWith: 'Comienza con',
  headerFilterOperatorEndsWith: 'Termina con',
  headerFilterOperatorIs: 'Es',
  headerFilterOperatorNot: 'No es',
  headerFilterOperatorAfter: 'Es posterior a',
  headerFilterOperatorOnOrAfter: 'Es en o posterior a',
  headerFilterOperatorBefore: 'Es anterior a',
  headerFilterOperatorOnOrBefore: 'Es en o anterior a',
  headerFilterOperatorIsEmpty: 'Está vacío',
  headerFilterOperatorIsNotEmpty: 'No está vacío',
  headerFilterOperatorIsAnyOf: 'Es cualquiera de',
  'headerFilterOperator=': 'Igual a',
  'headerFilterOperator!=': 'Distinto de',
  'headerFilterOperator>': 'Mayor que',
  'headerFilterOperator>=': 'Mayor o igual que',
  'headerFilterOperator<': 'Menor que',
  'headerFilterOperator<=': 'Menor o igual que',
  
  // Filter values text
  filterValueAny: 'cualquiera',
  filterValueTrue: 'verdadero',
  filterValueFalse: 'falso',
  
  // Column menu text
  columnMenuLabel: 'Menú',
  columnMenuShowColumns: 'Mostrar columnas',
  columnMenuManageColumns: 'Administrar columnas',
  columnMenuFilter: 'Filtrar',
  columnMenuHideColumn: 'Ocultar columna',
  columnMenuUnsort: 'Quitar orden',
  columnMenuSortAsc: 'Ordenar ascendente',
  columnMenuSortDesc: 'Ordenar descendente',
  
  // Column header text
  columnHeaderFiltersTooltipActive: (count) =>
    count !== 1 ? `${count} filtros activos` : `${count} filtro activo`,
  columnHeaderFiltersLabel: 'Mostrar filtros',
  columnHeaderSortIconLabel: 'Ordenar',
  
  // Rows selected footer text
  footerRowSelected: (count) =>
    count !== 1
      ? `${count.toLocaleString()} filas seleccionadas`
      : `${count.toLocaleString()} fila seleccionada`,
  
  // Total row amount footer text
  footerTotalRows: 'Total de filas:',
  
  // Total visible row amount footer text
  footerTotalVisibleRows: (visibleCount, totalCount) =>
    `${visibleCount.toLocaleString()} de ${totalCount.toLocaleString()}`,
  
  // Checkbox selection text
  checkboxSelectionHeaderName: 'Selección',
  checkboxSelectionSelectAllRows: 'Seleccionar todas las filas',
  checkboxSelectionUnselectAllRows: 'Deseleccionar todas las filas',
  checkboxSelectionSelectRow: 'Seleccionar fila',
  checkboxSelectionUnselectRow: 'Deseleccionar fila',
  
  // Boolean cell text
  booleanCellTrueLabel: 'sí',
  booleanCellFalseLabel: 'no',
  
  // Actions cell more text
  actionsCellMore: 'más',
  
  // Column pinning text
  pinToLeft: 'Fijar a la izquierda',
  pinToRight: 'Fijar a la derecha',
  unpin: 'Desfijar',
  
  // Tree Data
  treeDataGroupingHeaderName: 'Grupo',
  treeDataExpand: 'ver hijos',
  treeDataCollapse: 'ocultar hijos',
  
  // Grouping columns
  groupingColumnHeaderName: 'Grupo',
  groupColumn: (name) => `Agrupar por ${name}`,
  unGroupColumn: (name) => `Dejar de agrupar por ${name}`,
  
  // Master/detail
  detailPanelToggle: 'Alternar panel de detalles',
  expandDetailPanel: 'Expandir',
  collapseDetailPanel: 'Contraer',
  
  // Row reordering text
  rowReorderingHeaderName: 'Reordenar filas',
  
  // Aggregation
  aggregationMenuItemHeader: 'Agregación',
  aggregationFunctionLabelSum: 'suma',
  aggregationFunctionLabelAvg: 'promedio',
  aggregationFunctionLabelMin: 'mín',
  aggregationFunctionLabelMax: 'máx',
  aggregationFunctionLabelSize: 'cantidad',

  // Pagination
  MuiTablePagination: {
    labelRowsPerPage: 'Filas por página:',
    labelDisplayedRows: ({ from, to, count }) =>
      `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`,
  },
};

export default esES_DataGrid;

