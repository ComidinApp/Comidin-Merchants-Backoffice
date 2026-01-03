import isEqual from 'lodash/isEqual';
import { useState, useEffect, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import { alpha } from '@mui/material/styles';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { useSnackbar } from 'src/components/snackbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import axios from '../../../utils/axios';
import UserTableRow from '../user-table-row';
import UserTableToolbar from '../user-table-toolbar';
import UserTableFiltersResult from '../user-table-filters-result';

// ----------------------------------------------------------------------
const { VITE_API_COMIDIN } = import.meta.env;

// Opciones de estado en ESPAÑOL y alineadas a los valores del backend
const STATUS_OPTIONS = [
  { value: 'all',     label: 'Todos' },
  { value: 'active',  label: 'Activos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'banned',  label: 'Bloqueados' },
];

const defaultFilters = {
  name: '',
  role: [],
  status: 'all',
};

// ----------------------------------------------------------------------

export default function UserListView() {
  const { enqueueSnackbar } = useSnackbar();

  const authUser = useAuthContext();

  const TABLE_HEAD = [
    { id: 'name', label: 'Nombre' },
    { id: 'phoneNumber', label: 'Teléfono', width: 180 },
    ...(authUser.user.role_id === 1 ? [{ id: 'company', label: 'Comercio', width: 220 }] : []),
    { id: 'role', label: 'Rol', width: 180 },
    { id: 'status', label: 'Estado', width: 100 },
    { id: '', width: 88 },
  ];

  const table = useTable();

  const settings = useSettingsContext();

  const router = useRouter();

  const confirm = useBoolean();

  const [tableData, setTableData] = useState([]);

  const [_loading, setLoading] = useState(false);

  const [filters, setFilters] = useState(defaultFilters);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters,
  });

  const dataInPage = dataFiltered.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  const denseHeight = table.dense ? 56 : 56 + 20;

  const canReset = !isEqual(defaultFilters, filters);

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleFilters = useCallback(
    (name, value) => {
      table.onResetPage();
      setFilters((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    },
    [table]
  );

  const [roles, setRoles] = useState([]);

  // RUTAS BACKEND: usamos /api/role
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch(`${VITE_API_COMIDIN}/api/role`);
        const data = await response.json();
        setRoles(data || []);
      } catch (error) {
        console.error('Error al obtener los roles:', error);
      }
    };

    fetchRoles();
  }, []);

  const roleNames = roles.map((role) => role.name);

  // RUTAS BACKEND: usamos /api/employee y /api/employee/commerce/:id
  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);

      let url = `${VITE_API_COMIDIN}/api/employee`;

      // Si NO es admin global, trae solo empleados de su comercio
      if (authUser.user.role_id !== 1) {
        url = `${VITE_API_COMIDIN}/api/employee/commerce/${authUser.user.commerce.id}`;
      }

      const response = await axios.get(url);
      setTableData(Array.isArray(response?.data) ? response.data : []);

      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error('Error al obtener los usuarios:', error);
      enqueueSnackbar('Error al obtener los usuarios', { variant: 'error' });
    }
  }, [authUser, enqueueSnackbar, setLoading]);

  const handleResetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const handleDeleteRow = useCallback(
    async (id) => {
      try {
        // Eliminar en backend
        await axios.delete(`${VITE_API_COMIDIN}/api/employee/${id}`);

        // Actualizar estado local
        const deleteRow = tableData.filter((row) => row.id !== id);
        setTableData(deleteRow);

        enqueueSnackbar('Usuario eliminado con éxito', { variant: 'success' });
      } catch (error) {
        console.error('Error al eliminar el usuario:', error);
        enqueueSnackbar('Error al eliminar el usuario', { variant: 'error' });
      }

      table.onUpdatePageDeleteRow(dataInPage.length);
    },
    [dataInPage.length, enqueueSnackbar, table, tableData]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      const selectedIds = table.selected;

      await Promise.all(
        selectedIds.map((id) => axios.delete(`${VITE_API_COMIDIN}/api/employee/${id}`))
      );

      const deleteRows = tableData.filter((row) => !selectedIds.includes(row.id));
      setTableData(deleteRows);

      enqueueSnackbar('Usuarios eliminados con éxito', { variant: 'success' });
    } catch (error) {
      console.error('Error al eliminar los usuarios:', error);
      enqueueSnackbar('Error al eliminar los usuarios', { variant: 'error' });
    }

    table.onUpdatePageDeleteRows({
      totalRowsInPage: dataInPage.length,
      totalRowsFiltered: dataFiltered.length,
    });
  }, [dataFiltered.length, dataInPage.length, enqueueSnackbar, table, tableData]);

  const handleEditRow = useCallback(
    (id) => {
      router.push(paths.dashboard.user.edit(id));
    },
    [router]
  );

  const handleFilterStatus = useCallback(
    (event, newValue) => {
      handleFilters('status', newValue);
    },
    [handleFilters]
  );

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  return (
    <>
      <Container maxWidth={settings.themeStretch ? false : 'lg'}>
        <CustomBreadcrumbs
          heading="Lista de usuarios"
          links={[{ name: '' }]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.user.new}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              Agregar usuario
            </Button>
          }
          sx={{
            mb: { xs: 3, md: 5 },
          }}
        />

        <Card>
          <Tabs
            value={filters.status}
            onChange={handleFilterStatus}
            sx={{
              px: 2.5,
              boxShadow: (theme) => `inset 0 -2px 0 0 ${alpha(theme.palette.grey[500], 0.08)}`,
            }}
          >
            {STATUS_OPTIONS.map((tab) => (
              <Tab
                key={tab.value}
                iconPosition="end"
                value={tab.value}
                label={tab.label}
                icon={
                  <Label
                    variant={
                      ((tab.value === 'all' || tab.value === filters.status) && 'filled') || 'soft'
                    }
                    color={
                      (tab.value === 'active' && 'success') ||
                      (tab.value === 'pending' && 'warning') ||
                      (tab.value === 'banned' && 'error') ||
                      'default'
                    }
                  >
                    {['active', 'pending', 'banned'].includes(tab.value)
                      ? tableData.filter((user) => user.status === tab.value).length
                      : tableData.length}
                  </Label>
                }
              />
            ))}
          </Tabs>

          <UserTableToolbar filters={filters} onFilters={handleFilters} roleOptions={roleNames} />

          {canReset && (
            <UserTableFiltersResult
              filters={filters}
              onFilters={handleFilters}
              //
              onResetFilters={handleResetFilters}
              //
              results={dataFiltered.length}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.length}
              rowCount={dataFiltered.length}
              onSelectAllRows={(checked) =>
                table.onSelectAllRows(
                  checked,
                  dataFiltered.map((row) => row.id)
                )
              }
              action={
                <Tooltip title="Eliminar">
                  <IconButton color="primary" onClick={confirm.onTrue}>
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                </Tooltip>
              }
            />

            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headLabel={TABLE_HEAD}
                  rowCount={dataFiltered.length}
                  numSelected={table.selected.length}
                  onSort={table.onSort}
                  onSelectAllRows={(checked) =>
                    table.onSelectAllRows(
                      checked,
                      dataFiltered.map((row) => row.id)
                    )
                  }
                />

                <TableBody>
                  {dataFiltered
                    .slice(
                      table.page * table.rowsPerPage,
                      table.page * table.rowsPerPage + table.rowsPerPage
                    )
                    .map((row) => (
                      <UserTableRow
                        key={row.id}
                        row={row}
                        refetch={fetchUserData}
                        selected={table.selected.includes(row.id)}
                        onSelectRow={() => table.onSelectRow(row.id)}
                        onDeleteRow={() => handleDeleteRow(row.id)}
                        onEditRow={() => handleEditRow(row.id)}
                      />
                    ))}
                  <TableEmptyRows
                    height={denseHeight}
                    emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                  />
                  <TableNoData notFound={notFound} />
                </TableBody>
              </Table>
            </Scrollbar>
          </TableContainer>

          <TablePaginationCustom
            count={dataFiltered.length}
            page={table.page}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onRowsPerPageChange={table.onChangeRowsPerPage}
            //
            dense={table.dense}
            onChangeDense={table.onChangeDense}
          />
        </Card>
      </Container>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Eliminar usuarios"
        content={
          <>
            ¿Estás seguro de que querés eliminar{' '}
            <strong>{table.selected.length}</strong>{' '}
            {table.selected.length === 1 ? 'usuario' : 'usuarios'}?
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              handleDeleteRows();
              confirm.onFalse();
            }}
          >
            Eliminar
          </Button>
        }
      />
    </>
  );
}

// ----------------------------------------------------------------------

function applyFilter({ inputData, comparator, filters }) {
  const { name, status, role } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter(
      (user) =>
        user.first_name.toLowerCase().includes(name.toLowerCase()) ||
        user.last_name.toLowerCase().includes(name.toLowerCase()) ||
        user.email.toLowerCase().includes(name.toLowerCase()) ||
        user.commerce.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  if (status !== 'all') {
    inputData = inputData.filter((user) => user.status === status);
  }

  if (role.length) {
    inputData = inputData.filter((user) => role.includes(user.role.name));
  }

  return inputData;
}
