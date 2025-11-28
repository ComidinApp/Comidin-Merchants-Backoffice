// src/sections/publication/view/publication-list-view.jsx
import isEqual from 'lodash/isEqual';
import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

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

import { useGetPublications, deletePublication } from 'src/api/publication';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import EmptyContent from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

const defaultFilters = {
  // si más adelante agregás filtros, usás este objeto
};

const HIDE_COLUMNS = {
  // ejemplo: ocultar categoría por defecto
  // category: false,
};

const HIDE_COLUMNS_TOGGLABLE = ['actions'];

// ----------------------------------------------------------------------

export default function PublicationListView() {
  const { enqueueSnackbar } = useSnackbar();

  const confirmRows = useBoolean();

  const router = useRouter();

  const settings = useSettingsContext();

  // Trae todas las publicaciones (si querés por comercio, pasás commerceId)
  const { publications, publicationsLoading } = useGetPublications();

  const [tableData, setTableData] = useState([]);

  const [filters, setFilters] = useState(defaultFilters);

  const [selectedRowIds, setSelectedRowIds] = useState([]);

  const [columnVisibilityModel, setColumnVisibilityModel] = useState(HIDE_COLUMNS);

  useEffect(() => {
    if (publications?.length) {
      setTableData(publications);
    } else {
      setTableData([]);
    }
  }, [publications]);

  const dataFiltered = applyFilter({
    inputData: tableData,
    filters,
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
  // BORRADO – individual
  // ----------------------------------------------------------------------
  const handleDeleteRow = useCallback(
    async (id) => {
      try {
        await deletePublication(id);

        setTableData((prev) => prev.filter((row) => row.id !== id));

        enqueueSnackbar('¡Publicación eliminada con éxito!', { variant: 'success' });
      } catch (error) {
        console.error('Error al eliminar la publicación:', error);
        enqueueSnackbar('No se pudo eliminar la publicación.', { variant: 'error' });
      }
    },
    [enqueueSnackbar]
  );

  // ----------------------------------------------------------------------
  // BORRADO – múltiple (las seleccionadas)
  // ----------------------------------------------------------------------
  const handleDeleteRows = useCallback(async () => {
    if (!selectedRowIds.length) return;

    try {
      // Ejecuta los DELETE en paralelo
      await Promise.all(selectedRowIds.map((id) => deletePublication(id)));

      setTableData((prev) => prev.filter((row) => !selectedRowIds.includes(row.id)));

      enqueueSnackbar('¡Publicaciones eliminadas con éxito!', { variant: 'success' });
      setSelectedRowIds([]);
    } catch (error) {
      console.error('Error al eliminar publicaciones:', error);
      enqueueSnackbar('No se pudieron eliminar las publicaciones seleccionadas.', {
        variant: 'error',
      });
    }
  }, [enqueueSnackbar, selectedRowIds]);

  const handleEditRow = useCallback(
    (id) => {
      router.push(paths.dashboard.publication.edit(id));
    },
    [router]
  );

  const handleViewRow = useCallback(
    (id) => {
      router.push(paths.dashboard.publication.details(id));
    },
    [router]
  );

  // ----------------------------------------------------------------------
  // Columnas de la grilla
  // Ajustalas según los campos reales de tu modelo de publicación
  // ----------------------------------------------------------------------

  const columns = [
    {
      field: 'name',
      headerName: 'Publicación',
      flex: 1,
      minWidth: 260,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} alignItems="center">
          {/* Si querés mostrar imagen: */}
          {/* <Avatar src={params.row.image_url} alt={params.row.name} /> */}
          <Box>
            <Typography variant="subtitle2">{params.row.name}</Typography>
            {params.row.subDescription && (
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary', whiteSpace: 'normal', lineHeight: 1.3 }}
              >
                {params.row.subDescription}
              </Typography>
            )}
          </Box>
        </Stack>
      ),
    },
    {
      field: 'price',
      headerName: 'Precio',
      width: 120,
      valueFormatter: (params) =>
        params.value != null ? `$ ${Number(params.value).toFixed(2)}` : '-',
    },
    {
      field: 'discount_percentaje',
      headerName: 'Descuento (%)',
      width: 130,
      valueFormatter: (params) =>
        params.value != null ? `${Number(params.value).toFixed(0)} %` : '0 %',
    },
    {
      field: 'discounted_price',
      headerName: 'Precio con descuento',
      width: 160,
      valueFormatter: (params) =>
        params.value != null ? `$ ${Number(params.value).toFixed(2)}` : '-',
    },
    {
      field: 'available_stock',
      headerName: 'Stock',
      width: 100,
    },
    {
      field: 'is_active',
      headerName: 'Estado',
      width: 120,
      valueFormatter: (params) => (params.value === 'active' ? 'Activo' : 'Inactivo'),
    },
    {
      field: 'expiration_date',
      headerName: 'Vence',
      width: 180,
      valueFormatter: (params) => {
        if (!params.value) return '-';
        const d = new Date(params.value);
        if (Number.isNaN(d.getTime())) return '-';
        return d.toLocaleString('es-AR');
      },
    },
    {
      type: 'actions',
      field: 'actions',
      headerName: ' ',
      align: 'right',
      headerAlign: 'right',
      width: 60,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      getActions: (params) => [
        /* Si querés ver detalles
        <GridActionsCellItem
          showInMenu
          icon={<Iconify icon="solar:eye-bold" />}
          label="Ver"
          onClick={() => handleViewRow(params.row.id)}
        />,
        */
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
          onClick={() => handleDeleteRow(params.row.id)}
          sx={{ color: 'error.main' }}
        />,
      ],
    },
  ];

  const getTogglableColumns = () =>
    columns
      .filter((column) => !HIDE_COLUMNS_TOGGLABLE.includes(column.field))
      .map((column) => column.field);

  // ----------------------------------------------------------------------

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
          links={[
            {
              name: '',
            },
          ]}
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
            slots={{
              toolbar: () => (
                <>
                  <GridToolbarContainer>
                    {/* Si después agregás filtros avanzados, podés meter acá un PublicationTableToolbar */}

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
                    // si más adelante tenés filtros, esto se puede reutilizar
                    <Box sx={{ p: 2.5, pt: 0 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Resultados: {dataFiltered.length}
                      </Typography>
                    </Box>
                  )}
                </>
              ),
              noRowsOverlay: () => <EmptyContent title="Sin publicaciones" />,
              noResultsOverlay: () => <EmptyContent title="No se encontraron publicaciones" />,
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

function applyFilter({ inputData, filters }) {
  // Por ahora no hay filtros; devolvemos lo que hay
  // Si después agregás filtros por estado, stock, etc., los aplicás acá
  return inputData;
}
