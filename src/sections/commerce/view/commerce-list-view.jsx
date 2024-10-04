import isEqual from 'lodash/isEqual';
import { useState, useEffect, useCallback } from 'react';
import Switch from '@mui/material/Switch';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import FormControlLabel from '@mui/material/FormControlLabel';
import { MenuItem, Select, FormControl } from '@mui/material';

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

import { useGetCommerces, activateCommerce, changeCommerceStatus } from 'src/api/commerce';
import { COMMERCE_STOCK_OPTIONS } from 'src/_mock/_commerce';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import EmptyContent from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import CommerceTableToolbar from '../commerce-table-toolbar';
import CommerceTableFiltersResult from '../commerce-table-filters-result';
import {
  RenderCellStock,
  RenderCellPrice,
  RenderCellCommerceCategory,
  RenderCellNationalCommerceId,
  RenderCellStatus,
  RenderCellCommerce,
  RenderCellAddress,
  RenderCellCreatedAt,
} from '../commerce-table-row';

// ----------------------------------------------------------------------

const PUBLISH_OPTIONS = [
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
];

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
        enqueueSnackbar('Comercio activado/desactivado con exito', { variant: 'success' });
      } catch (error) {
        console.error('Error activating commerce:', error);
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

      enqueueSnackbar('Delete success!');

      setTableData(deleteRow);
    },
    [enqueueSnackbar, tableData]
  );

  const handleDeleteRows = useCallback(() => {
    const deleteRows = tableData.filter((row) => !selectedRowIds.includes(row.id));

    enqueueSnackbar('Delete success!');

    setTableData(deleteRows);
  }, [enqueueSnackbar, selectedRowIds, tableData]);

  const handleEditRow = useCallback(
    (id) => {
      router.push(paths.dashboard.commerce.edit(id));
    },
    [router]
  );

  const handleViewRow = useCallback(
    (id) => {
      router.push(paths.dashboard.commerce.details(id));
    },
    [router]
  );

  const columns = [
    {
      field: 'category',
      headerName: 'Category',
      filterable: false,
    },
    {
      field: 'name',
      headerName: 'Commerce',
      flex: 1,
      minWidth: 360,
      hideable: false,
      renderCell: (params) => <RenderCellCommerce params={params} />,
    },
    /* {
      field: 'createdAt',
      headerName: 'Create at',
      width: 160,
      renderCell: (params) => <RenderCellCreatedAt params={params} />,
    }, */
    {
      field: 'address',
      headerName: 'Direccion',
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
      headerName: 'Categoria',
      width: 140,
      editable: false,
      renderCell: (params) => <RenderCellCommerceCategory params={params} />,
    },
    {
      field: 'status',
      headerName: 'Estado',
      width: 160, // Aumenta el ancho aquí según sea necesario
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
    /* {
      field: 'commerce',
      headerName: 'Comercio',
      width: 140,
      editable: true,
      renderCell: (params) => <RenderCellCommerce params={params} />,
    }, */
    /* {
      field: 'inventoryType',
      headerName: 'Stock',
      width: 160,
      type: 'singleSelect',
      valueOptions: COMMERCE_STOCK_OPTIONS,
      renderCell: (params) => <RenderCellStock params={params} />,
    },
    {
      field: 'price',
      headerName: 'Price',
      width: 140,
      editable: true,
      renderCell: (params) => <RenderCellPrice params={params} />,
    },
    {
      field: 'publish',
      headerName: 'Publish',
      width: 110,
      type: 'singleSelect',
      editable: true,
      valueOptions: PUBLISH_OPTIONS,
      renderCell: (params) => <RenderCellPublish params={params} />,
    }, */
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
          label="View"
          onClick={() => handleViewRow(params.row.id)}
        />, */
        <GridActionsCellItem
          showInMenu
          icon={<Iconify icon="solar:pen-bold" />}
          label="Edit"
          onClick={() => handleEditRow(params.row.id)}
        />,
        <GridActionsCellItem
          showInMenu
          icon={<Iconify icon="solar:trash-bin-trash-bold" />}
          label="Delete"
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
            slots={{
              toolbar: () => (
                <>
                  <GridToolbarContainer>
                    {/* <CommerceTableToolbar
                      filters={filters}
                      onFilters={handleFilters}
                      stockOptions={COMMERCE_STOCK_OPTIONS}
                      publishOptions={PUBLISH_OPTIONS}
                    /> */}

                    <GridToolbarQuickFilter style={{ width: '700px', height: '50px' }} />

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
              noRowsOverlay: () => <EmptyContent title="No Data" />,
              noResultsOverlay: () => <EmptyContent title="No results found" />,
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
        title="Delete"
        content={
          <>
            Are you sure want to delete <strong> {selectedRowIds.length} </strong> items?
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
