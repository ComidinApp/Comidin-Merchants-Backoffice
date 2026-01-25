import { useState, useEffect, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import { alpha, useTheme } from '@mui/material/styles';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';
import Stack from '@mui/material/Stack';
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useBoolean } from 'src/hooks/use-boolean';
import Box from '@mui/material/Box';
import { isAfter, isBetween } from 'src/utils/format-time';

import { useGetOrders } from 'src/api/orders';
import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { useSnackbar } from 'src/components/snackbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import {
  ORDER_STATUS_OPTIONS,
  getOrderStatusLabel,
  normalizeOrderStatus,
  getOrderStatusColor
} from "src/constants/order-status";
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

import OrderTableRow from '../order-table-row';
import OrderTableToolbar from '../order-table-toolbar';
import OrderTableFiltersResult from '../order-table-filters-result';


// ----------------------------------------------------------------------

const STATUS_TABS = [
  { value: "all", label: "Todos" },
  ...ORDER_STATUS_OPTIONS.map((st) => ({ value: st, label: getOrderStatusLabel(st) })),
];

const defaultFilters = {
  name: '',
  status: 'all',
  startDate: null,
  endDate: null,
};

// ----------------------------------------------------------------------

export default function OrderListView() {
  const authUser = useAuthContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const TABLE_HEAD = [
    { id: 'order_id', label: 'Nro Pedido', width: 150 },
    ...(authUser.user.role_id === 1 ? [{ id: 'company', label: 'Comercio', width: 220 }] : []),
    { id: 'name', label: 'Usuario' },
    { id: 'createdAt', label: 'Fecha', width: 140 },
    { id: 'totalQuantity', label: 'Items', width: 120, align: 'center' },
    { id: 'totalAmount', label: 'Precio', width: 140 },
    { id: 'status', label: 'Estado', width: 110 },
    { id: '', width: 88 },
  ];

  const { enqueueSnackbar } = useSnackbar();

  const table = useTable({ defaultOrderBy: 'order_id', defaultOrder: 'desc' });

  const settings = useSettingsContext();

  const router = useRouter();

  const confirm = useBoolean();

  const commerceId = authUser.user.role_id === 1 ? null : authUser.user.commerce.id;
  const { orders } = useGetOrders(commerceId);

  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    if (orders) {
      setTableData(orders);
    }
  }, [orders]);

  const [filters, setFilters] = useState(defaultFilters);

  const dateError = isAfter(filters.startDate, filters.endDate);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters,
    dateError,
  });

  const dataInPage = dataFiltered.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  const denseHeight = table.dense ? 56 : 56 + 20;

  const canReset =
    !!filters.name || filters.status !== 'all' || (!!filters.startDate && !!filters.endDate);

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

  const handleResetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const handleDeleteRow = useCallback(
    (id) => {
      const deleteRow = tableData.filter((row) => row.id !== id);

      enqueueSnackbar('¡Eliminado con éxito!');

      setTableData(deleteRow);

      table.onUpdatePageDeleteRow(dataInPage.length);
    },
    [dataInPage.length, enqueueSnackbar, table, tableData]
  );

  const handleDeleteRows = useCallback(() => {
    const deleteRows = tableData.filter((row) => !table.selected.includes(row.id));

    enqueueSnackbar('Eliminado exitosamente!');

    setTableData(deleteRows);

    table.onUpdatePageDeleteRows({
      totalRowsInPage: dataInPage.length,
      totalRowsFiltered: dataFiltered.length,
    });
  }, [dataFiltered.length, dataInPage.length, enqueueSnackbar, table, tableData]);

  const handleViewRow = useCallback(
    (id) => {
      router.push(paths.dashboard.order.details(id));
    },
    [router]
  );

  const handleFilterStatus = useCallback(
    (event, newValue) => {
      const next = newValue === 'all' ? 'all' : normalizeOrderStatus(newValue);
      handleFilters('status', next);
    },
    [handleFilters]
  );

  return (
    <>
      <Container maxWidth={settings.themeStretch ? false : 'lg'}>
        <CustomBreadcrumbs
          heading="Lista de Pedidos"
          links={[
            {
              name: '',
              href: paths.dashboard.root,
            },
          ]}
          sx={{
            mb: { xs: 3, md: 5 },
          }}
        />

        <Card sx={{ borderColor: 'common.orangeDark', borderWidth: 2, borderStyle: 'solid', borderRadius: 2 }}>
          <Tabs
            value={filters.status}
            onChange={handleFilterStatus}
            variant={isMobile ? 'scrollable' : 'fullWidth'}
            scrollButtons={isMobile ? 'auto' : false}
            allowScrollButtonsMobile
            sx={{
              px: isMobile ? 0 : 2,
              '& .MuiTabs-flexContainer': {
                justifyContent: isMobile ? 'flex-start' : 'space-between',
              },
              '& .MuiTab-root': {
                minHeight: 48,
                textTransform: 'none',
                px: 1.5,
                minWidth: isMobile ? 140 : 0,
              },
            }}
          >
            {STATUS_TABS.map((tab) => {
              const count =
                tab.value === 'all'
                  ? tableData.length
                  : tableData.filter(
                      (o) => normalizeOrderStatus(o.status) === normalizeOrderStatus(tab.value)
                    ).length;

              return (
                <Tab
                  key={tab.value}
                  value={tab.value}
                  label={
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ pr: 0.5 }}>
                      <Box component="span" sx={{ whiteSpace: 'nowrap' }}>
                        {tab.label}
                      </Box>
                      <Label
                        variant={filters.status === tab.value ? 'filled' : 'soft'}
                        color={tab.value === 'all' ? 'default' : getOrderStatusColor(tab.value)}
                      >
                        {count}
                      </Label>
                    </Stack>
                  }
                />
              );
            })}
          </Tabs>

          <OrderTableToolbar filters={filters} onFilters={handleFilters} dateError={dateError} />

          {canReset && (
            <OrderTableFiltersResult
              filters={filters}
              onFilters={handleFilters}
              onResetFilters={handleResetFilters}
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
                      <OrderTableRow
                        key={row.id}
                        row={row}
                        selected={table.selected.includes(row.id)}
                        onSelectRow={() => table.onSelectRow(row.id)}
                        onDeleteRow={() => handleDeleteRow(row.id)}
                        onViewRow={() => handleViewRow(row.id)}
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
            dense={table.dense}
            onChangeDense={table.onChangeDense}
          />
        </Card>
      </Container>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Eliminar pedidos"
        content={
          <>
            ¿Estás seguro de que querés eliminar <strong>{table.selected.length}</strong>{' '}
            {table.selected.length === 1 ? 'pedido?' : 'pedidos?'}
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

function applyFilter({ inputData, comparator, filters, dateError }) {
  const { status, name, startDate, endDate } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  // Filtrar por nombre de cliente, email o número de pedido
  if (name) {
    const searchLower = name.toLowerCase();
    inputData = inputData.filter((order) => {
      const orderId = order.id?.toString() || '';
      const orderIdFormatted = order.id?.toString().padStart(4, '0') || '';
      const userName = `${order.user?.first_name || ''} ${order.user?.last_name || ''}`.toLowerCase();
      const userEmail = order.user?.email?.toLowerCase() || '';
      const commerceName = order.commerce?.name?.toLowerCase() || '';

      return (
        orderId.includes(searchLower) ||
        orderIdFormatted.includes(searchLower) ||
        userName.includes(searchLower) ||
        userEmail.includes(searchLower) ||
        commerceName.includes(searchLower)
      );
    });
  }

  // Filtrar por estado (robusto ante mayúsculas/minúsculas)
  if (status !== 'all') {
    inputData = inputData.filter(
      (order) => normalizeOrderStatus(order?.status) === normalizeOrderStatus(status)
    );
  }

  // Filtrar por rango de fechas
  if (!dateError && startDate && endDate) {
    inputData = inputData.filter((order) => {
      const orderDate = order.created_at;
      return orderDate ? isBetween(orderDate, startDate, endDate) : false;
    });
  }

  return inputData;
}
