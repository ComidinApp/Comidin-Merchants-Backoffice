import isEqual from 'lodash/isEqual';
import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import FormControlLabel from '@mui/material/FormControlLabel';
import { Select, MenuItem, FormControl } from '@mui/material';
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

import { useBoolean } from 'src/hooks/use-boolean';

import { esES_DataGrid } from 'src/locales/data-grid-es';
import { useGetCommerces, activateCommerce, changeCommerceStatus } from 'src/api/commerce';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import EmptyContent from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import CommerceTableFiltersResult from '../commerce-table-filters-result';
import {
  RenderCellAddress,
  RenderCellCommerce,
  RenderCellCommerceCategory,
  RenderCellNationalCommerceId,
} from '../commerce-table-row';

// ----------------------------------------------------------------------

// const PUBLISH_OPTIONS = [
//   { value: 'published', label: 'Publicado' },
//   { value: 'draft', label: 'Borrador' },
// ];

const STATUS_COMMERCE_OPTIONS = [
  { value: 'admitted', label: 'Admitido' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'rejected', label: 'Rechazado' },
];

const defaultFilters = {
  publish: [],
  stock: [],
};

const HIDE_COLUMNS = {
  category: false,
};

const HIDE_COLUMNS_TOGGLABLE = ['category', 'actions'];

// ----------------------------------------------------------------------

export default function CommerceListView() {
  const { enqueueSnackbar } = useSnackbar();

  const confirmRows = useBoolean();

  const router = useRouter();

  const settings = useSettingsContext();

  const { commerces, commercesLoading } = useGetCommerces();

  const [tableData, setTableData] = useState([]);

  const [filters, setFilters] = useState(defaultFilters);

  const [selectedRowIds, setSelectedRowIds] = useState([]);

  const [columnVisibilityModel, setColumnVisibilityModel] = useState(HIDE_COLUMNS);

  useEffect(() => {
    if (commerces.length) {
      setTableData(commerces);
    }
  }, [commerces]);

  const dataFiltered = applyFilter({
    inputData: tableData,
    filters,
  });

  const handleToggleActive = useCallback(
    async (id) => {
      try {
        await activateCommerce(id);

        setTableData((prevData) =>
          prevData.map((commerce) =>
            commerce.id === id ? { ...commerce, is_active: !commerce.is_active } : commerce
          )
        );
        enqueueSnackbar('Comercio activado/desactivado con éxito', { variant: 'success' });
      } catch (error) {
        console.error('Error activando comercio:', error);
        enqueueSnackbar('No se pudo activar/desactivar el comercio', { variant: 'error' });
      }
    },
    [enqueueSnackbar]
  );

  const handleChangeStatus = useCallback(
    async (id, status) => {
      try {
        await changeCommerceStatus(id, status);

        setTableData((prevData) =>
          prevData.map((commerce) => (commerce.id === id ? { ...commerce, status } : commerce))
        );

        enqueueSnackbar('Estado del comercio actualizado con éxito', { variant: 'success' });
      } catch (error) {
        console.error('Error cambiando el estado del comercio:', error);
        enqueueSnackbar('No se pudo actualizar el estado del comercio', { variant: 'error' });
      }
    },
    [enqueueSnackbar]
  );

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

  const handleDeleteRow = useCallback(
    (id) => {
      const deleteRow = tableData.filter((row) => row.id !== id);

      enqueueSnackbar('¡Eliminado con éxito!', { variant: 'success' });

      setTableData(deleteRow);
    },
    [enqueueSnackbar, tableData]
  );

  const handleDeleteRows = useCallback(() => {
    const deleteRows = tableData.filter((row) => !selectedRowIds.includes(row.id));

    enqueueSnackbar('¡Eliminados con éxito!', { variant: 'success' });

    setTableData(deleteRows);
  }, [enqueueSnackbar, selectedRowIds, tableData]);

  const handleEditRow = useCallback(
    (id) => {
      router.push(paths.dashboard.commerce.edit(id));
    },
    [router]
  );

  // const handleViewRow = useCallback(
  //   (id) => {
  //     router.push(paths.dashboard.commerce.details(id));
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
      headerName: 'Comercio',
      flex: 1,
      minWidth: 360,
      hideable: false,
      renderCell: (params) => <RenderCellCommerce params={params} />,
    },
    /* {
      field: 'createdAt',
      headerName: 'Creado el',
      width: 160,
      renderCell: (params) => <RenderCellCreatedAt params={params} />,
    }, */
    {
      field: 'address',
      headerName: 'Dirección',
      width: 140,
      editable: false,
      renderCell: (params) => <RenderCellAddress params={params} />,
    },
    {
      field: 'commerce_national_id',
      headerName: 'CUIT/CUIL',
      width: 140,
      editable: false,
      renderCell: (params) => <RenderCellNationalCommerceId params={params} />,
    },
    {
      field: 'commerce_category',
      headerName: 'Categoría',
      width: 140,
      editable: false,
      renderCell: (params) => <RenderCellCommerceCategory params={params} />,
    },
    {
      field: 'status',
      headerName: 'Estado',
      width: 160,
      editable: true,
      renderCell: (params) => (
        <FormControl fullWidth>
          <Select
            value={params.row.status}
            onChange={(event) => handleChangeStatus(params.row.id, event.target.value)}
            sx={{
              whiteSpace: 'normal',
              overflow: 'visible',
              textAlign: 'center',
            }}
          >
            {STATUS_COMMERCE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ),
    },
    {
      field: 'is_active',
      headerName: 'Activo',
      width: 110,
      renderCell: (params) => (
        <FormControlLabel
          control={
            <Switch
              checked={params.row.is_active}
              onChange={() => handleToggleActive(params.row.id)}
            />
          }
          label={params.row.is_active ? 'Activo' : 'Inactivo'}
        />
      ),
    },
    {
      type: 'actions',
      field: 'actions',
      headerName: ' ',
      align: 'right',
      headerAlign: 'right',
      width: 20,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      getActions: (params) => [
        /*        <GridActionsCellItem
          showInMenu
          icon={<Iconify icon="solar:eye-bold" />}
          label="Ver"
          onClick={() => handleViewRow(params.row.id)}
        />, */
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
          heading="Listado de Comercios"
          links={[
            {
              name: '',
            },
          ]}
          /* action={
            <Button
              component={RouterLink}
              href={paths.dashboard.commerce.new}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              Agregar Comercio
            </Button>
          } */
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
            loading={commercesLoading}
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
                    <GridToolbarQuickFilter sx={{ width: '700px', height: '50px' }} />

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
                    <CommerceTableFiltersResult
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
              noResultsOverlay: () => <EmptyContent title="No se encontraron resultados" />,
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
        title="Eliminar"
        content={
          <>
            ¿Estás seguro de que querés eliminar{' '}
            <strong>{selectedRowIds.length}</strong>{' '}
            {selectedRowIds.length === 1 ? 'ítem?' : 'ítems?'}
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              handleDeleteRows();
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

function applyFilter({ inputData, filters }) {
  const { stock, publish } = filters;

  if (stock.length) {
    inputData = inputData.filter((commerce) => stock.includes(commerce.inventoryType));
  }

  if (publish.length) {
    inputData = inputData.filter((commerce) => publish.includes(commerce.publish));
  }

  return inputData;
}
