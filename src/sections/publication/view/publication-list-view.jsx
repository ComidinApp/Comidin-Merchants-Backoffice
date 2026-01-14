import isEqual from 'lodash/isEqual';
import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import {
  DataGrid,
  GridToolbarExport,
  GridActionsCellItem,
  GridToolbarContainer,
  GridToolbarQuickFilter,
  GridToolbarFilterButton,
  GridToolbarColumnsButton,
} from '@mui/x-data-grid';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';

import { esES_DataGrid } from 'src/locales/data-grid-es';
import { useAuthContext } from 'src/auth/hooks/use-auth-context';
import {
  deletePublication,
  useGetPublications,
} from 'src/api/publications';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import EmptyContent from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import PublicationTableToolbar from '../publication-table-toolbar';
import PublicationTableFiltersResult from '../publication-table-filters-result';
import {
  RenderCellStock,
  RenderCellPrice,
  RenderCellCommerce,
  RenderCellDiscount,
  RenderCellCreatedAt,
  RenderCellPublication,
  RenderCellDiscountedPrice,
} from '../publication-table-row';

// ----------------------------------------------------------------------

// Opciones de estado
const PUBLISH_OPTIONS = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
];

// Helper para normalizar el estado de is_active (puede venir como boolean, number, string)
const getPublishStatus = (isActive) => {
  // Maneja: true, 1, "1", "true", "active"
  if (isActive === true || isActive === 1 || isActive === '1' || isActive === 'true' || isActive === 'active') {
    return 'active';
  }
  return 'inactive';
};

// Opciones de stock basadas en cantidad
const STOCK_OPTIONS = [
  { value: 'in_stock', label: 'En stock' },
  { value: 'low_stock', label: 'Bajo stock' },
  { value: 'out_of_stock', label: 'Sin stock' },
];

// Helper para determinar el estado del stock
const getStockStatus = (availableStock) => {
  if (availableStock === '0') {
    console.log('sin stock');
    return 'out_of_stock';
  }
  if (availableStock <= 5) return 'low_stock';
  return 'in_stock';
};

const defaultFilters = {
  publish: [],
  stock: [],
};

const HIDE_COLUMNS = {
  category: false,
};

const HIDE_COLUMNS_TOGGLABLE = ['category', 'actions'];

// ----------------------------------------------------------------------

export default function PublicationListView() {
  const { enqueueSnackbar } = useSnackbar();

  const authUser = useAuthContext();

  const confirmRows = useBoolean();

  const router = useRouter();

  const settings = useSettingsContext();

  const commerceId = authUser.user.role_id === 1 ? null : authUser.user.commerce.id;

  const {
    publications,
    publicationsLoading,
    mutatePublications,
  } = useGetPublications(commerceId);

  const [tableData, setTableData] = useState([]);

  const [filters, setFilters] = useState(defaultFilters);

  const [selectedRowIds, setSelectedRowIds] = useState([]);

  const [columnVisibilityModel, setColumnVisibilityModel] = useState(HIDE_COLUMNS);

  useEffect(() => {
    if (Array.isArray(publications) && publications.length) {
      setTableData(publications);
    } else {
      setTableData([]);
    }
  }, [publications]);

  const dataFiltered = applyFilter({
    inputData: tableData,
    filters,
    getStockStatusFn: getStockStatus,
    getPublishStatusFn: getPublishStatus,
  });

  const canReset = !isEqual(defaultFilters, filters);

  const handleFilters = useCallback((name, value) => {
    setFilters((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  // ----------------------------------------------------------------------
  // BORRADO INDIVIDUAL
  // ----------------------------------------------------------------------

  const handleDeleteRow = useCallback(
    async (id) => {
      try {
        await deletePublication(id);

        // 1) Actualizamos la tabla local
        setTableData((prev) => prev.filter((row) => row.id !== id));

        // 2) Actualizamos también la caché de SWR
        if (typeof mutatePublications === 'function') {
          mutatePublications(
            (current) => (current || []).filter((row) => row.id !== id),
            { revalidate: false }
          );
        }

        enqueueSnackbar('¡Publicación eliminada con éxito!', { variant: 'success' });
      } catch (error) {
        console.error('Error al eliminar la publicación:', error);
        enqueueSnackbar('No se pudo eliminar la publicación.', { variant: 'error' });
      }
    },
    [enqueueSnackbar, mutatePublications]
  );

  // ----------------------------------------------------------------------
  // BORRADO MÚLTIPLE
  // ----------------------------------------------------------------------

  const handleDeleteRows = useCallback(async () => {
    if (!selectedRowIds.length) return;

    try {
      await Promise.all(selectedRowIds.map((id) => deletePublication(id)));

      // 1) Actualizamos tabla local
      setTableData((prev) => prev.filter((row) => !selectedRowIds.includes(row.id)));

      // 2) Actualizamos caché de SWR
      if (typeof mutatePublications === 'function') {
        mutatePublications(
          (current) =>
            (current || []).filter((row) => !selectedRowIds.includes(row.id)),
          { revalidate: false }
        );
      }

      enqueueSnackbar('¡Publicaciones eliminadas con éxito!', { variant: 'success' });
      setSelectedRowIds([]);
    } catch (error) {
      console.error('Error al eliminar publicaciones seleccionadas:', error);
      enqueueSnackbar(
        'No se pudieron eliminar las publicaciones seleccionadas.',
        { variant: 'error' }
      );
    }
  }, [enqueueSnackbar, selectedRowIds, mutatePublications]);

  const handleEditRow = useCallback(
    (id) => {
      router.push(paths.dashboard.publication.edit(id));
    },
    [router]
  );

  // const handleViewRow = useCallback(
  //   (id) => {
  //     router.push(paths.dashboard.publication.details(id));
  //   },
  //   [router]
  // );

  const columns = [
    {
      field: 'category',
      headerName: 'Categoría',
      filterable: false,
    },
    {
      field: 'name',
      headerName: 'Publicación',
      flex: 1,
      minWidth: 360,
      hideable: false,
      // valueGetter permite que el quick filter y filtros funcionen
      valueGetter: (params) => params.row.product?.name || '',
      renderCell: (params) => <RenderCellPublication params={params} />,
    },
    ...(authUser.user.role_id === 1
      ? [
          {
            field: 'commerce',
            headerName: 'Comercio',
            width: 140,
            editable: false,
            valueGetter: (params) => params.row.commerce?.name || '',
            renderCell: (params) => <RenderCellCommerce params={params} />,
          },
        ]
      : []),
    {
      field: 'expiration_date',
      headerName: 'Fecha de vencimiento',
      width: 160,
      type: 'date',
      valueGetter: (params) => params.row.expiration_date ? new Date(params.row.expiration_date) : null,
      renderCell: (params) => <RenderCellCreatedAt params={params} />,
    },
    {
      field: 'available_stock',
      headerName: 'Stock',
      width: 120,
      type: 'number',
      valueGetter: (params) => params.row.available_stock ?? 0,
      renderCell: (params) => <RenderCellStock params={params} />,
    },
    {
      field: 'stock_status',
      headerName: 'Estado Stock',
      width: 140,
      type: 'singleSelect',
      valueOptions: STOCK_OPTIONS,
      valueGetter: (params) => getStockStatus(params.row.available_stock ?? 0),
      renderCell: (params) => {
        const status = getStockStatus(params.row.available_stock ?? 0);
        const option = STOCK_OPTIONS.find((opt) => opt.value === status);
        return (
          <Label
            variant="soft"
            color={
              (status === 'in_stock' && 'success') ||
              (status === 'low_stock' && 'warning') ||
              'error'
            }
          >
            {option?.label || status}
          </Label>
        );
      },
    },
    {
      field: 'price',
      headerName: 'Precio',
      width: 140,
      type: 'number',
      valueGetter: (params) => params.row.price ?? 0,
      renderCell: (params) => <RenderCellPrice params={params} />,
    },
    {
      field: 'discount_percentaje',
      headerName: 'Descuento',
      width: 140,
      type: 'number',
      valueGetter: (params) => params.row.discount_percentaje ?? 0,
      renderCell: (params) => <RenderCellDiscount params={params} />,
    },
    {
      field: 'discounted_price',
      headerName: 'Precio con descuento',
      width: 160,
      type: 'number',
      valueGetter: (params) => params.row.discounted_price ?? 0,
      renderCell: (params) => <RenderCellDiscountedPrice params={params} />,
    },
    {
      field: 'is_active',
      headerName: 'Estado',
      width: 110,
      type: 'singleSelect',
      valueOptions: PUBLISH_OPTIONS,
      valueGetter: (params) => getPublishStatus(params.row.is_active),
      renderCell: (params) => {
        const status = getPublishStatus(params.row.is_active);
        return (
          <Label variant="soft" color={status === 'active' ? 'success' : 'default'}>
            {status === 'active' ? 'Activo' : 'Inactivo'}
          </Label>
        );
      },
    },
    {
      type: 'actions',
      field: 'actions',
      headerName: ' ',
      align: 'right',
      headerAlign: 'right',
      width: 80,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      getActions: (params) => [
        // <GridActionsCellItem
        //  showInMenu
        //  icon={<Iconify icon="solar:eye-bold" />}
        //  label="Ver"
        //  onClick={() => handleViewRow(params.row.id)}
        // />,
        <GridActionsCellItem
          showInMenu
          icon={<Iconify icon="solar:pen-bold" />}
          label="Editar"
          onClick={() => handleEditRow(params.row.id)}
        />,
        <GridActionsCellItem
          showInMenu
          icon={<Iconify icon="solar:trash-bin-trash-bold" />}
          label="Eliminar"
          onClick={() => {
            handleDeleteRow(params.row.id);
          }}
          sx={{ color: 'error.main' }}
        />,
      ],
    },
  ];

  const getTogglableColumns = () =>
    columns
      .filter((column) => !HIDE_COLUMNS_TOGGLABLE.includes(column.field))
      .map((column) => column.field);

  return (
    <>
      <Container
        maxWidth={settings.themeStretch ? false : 'lg'}
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <CustomBreadcrumbs
          heading="Listado de Publicaciones"
          links={[{ name: '' }]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.publication.new}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              Agregar Publicación
            </Button>
          }
          sx={{
            mb: {
              xs: 3,
              md: 5,
            },
          }}
        />

        <Card
          sx={{
            height: { xs: 800, md: 2 },
            flexGrow: { md: 1 },
            display: { md: 'flex' },
            flexDirection: { md: 'column' },
          }}
        >
          <DataGrid
            sx={{ borderColor: 'common.orangeDark', borderWidth: 2, borderStyle: 'solid', borderRadius: 2 }}
            checkboxSelection
            disableRowSelectionOnClick
            rows={dataFiltered}
            columns={columns}
            loading={publicationsLoading}
            getRowHeight={() => 'auto'}
            pageSizeOptions={[5, 10, 25]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10 },
              },
            }}
            onRowSelectionModelChange={(newSelectionModel) => {
              setSelectedRowIds(newSelectionModel);
            }}
            columnVisibilityModel={columnVisibilityModel}
            onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
            localeText={esES_DataGrid}
            slots={{
              toolbar: () => (
                <>
                  <GridToolbarContainer>
                    <PublicationTableToolbar
                      filters={filters}
                      onFilters={handleFilters}
                      stockOptions={STOCK_OPTIONS}
                      publishOptions={PUBLISH_OPTIONS}
                    />

                    <GridToolbarQuickFilter />

                    <Stack
                      spacing={1}
                      flexGrow={1}
                      direction="row"
                      alignItems="center"
                      justifyContent="flex-end"
                    >
                      {!!selectedRowIds.length && (
                        <Button
                          size="small"
                          color="error"
                          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                          onClick={confirmRows.onTrue}
                        >
                          Borrar ({selectedRowIds.length})
                        </Button>
                      )}

                    <GridToolbarColumnsButton />
                    <GridToolbarFilterButton />
                    <GridToolbarExport />
                    </Stack>
                  </GridToolbarContainer>

                  {canReset && (
                    <PublicationTableFiltersResult
                      filters={filters}
                      onFilters={handleFilters}
                      onResetFilters={handleResetFilters}
                      results={dataFiltered.length}
                      sx={{ p: 2.5, pt: 0 }}
                    />
                  )}
                </>
              ),
              noRowsOverlay: () => <EmptyContent title="Sin datos" />,
              noResultsOverlay: () => (
                <EmptyContent title="No se encontraron resultados" />
              ),
            }}
            slotProps={{
              columnsPanel: {
                getTogglableColumns,
              },
            }}
          />
        </Card>
      </Container>

      <ConfirmDialog
        open={confirmRows.value}
        onClose={confirmRows.onFalse}
        title="Eliminar publicaciones"
        content={
          <>
            ¿Estás seguro de que querés eliminar{' '}
            <strong>{selectedRowIds.length}</strong>{' '}
            {selectedRowIds.length === 1 ? 'publicación?' : 'publicaciones?'}
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              await handleDeleteRows();
              confirmRows.onFalse();
            }}
          >
            Borrar
          </Button>
        }
      />
    </>
  );
}

// ----------------------------------------------------------------------

function applyFilter({ inputData, filters, getStockStatusFn, getPublishStatusFn }) {
  const { stock, publish } = filters;

  // Filtrar por estado de stock
  if (stock.length) {
    inputData = inputData.filter((publication) => {
      const stockStatus = getStockStatusFn(publication.available_stock ?? 0);
      return stock.includes(stockStatus);
    });
  }

  // Filtrar por estado activo/inactivo
  if (publish.length) {
    inputData = inputData.filter((publication) => {
      const publishStatus = getPublishStatusFn(publication.is_active);
      return publish.includes(publishStatus);
    });
  }

  return inputData;
}
