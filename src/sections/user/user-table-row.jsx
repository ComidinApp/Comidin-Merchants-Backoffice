// src/sections/user/user-table-row.jsx
import PropTypes from 'prop-types';
import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';

import { useBoolean } from 'src/hooks/use-boolean';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import CustomPopover, { usePopover } from 'src/components/custom-popover';

import UserQuickEditForm from './user-quick-edit-form';

// ----------------------------------------------------------------------

const STATUS_LABELS = {
  active: 'Activo',
  pending: 'Pendiente',
  banned: 'Bloqueado',
};

export default function UserTableRow({ row, selected, onEditRow, onSelectRow, onDeleteRow }) {
  const { first_name, avatar_url, last_name, commerce, role, status, email, phone_number } = row;

  const confirm = useBoolean();
  const authUser = useAuthContext();
  const quickEdit = useBoolean();
  const popover = usePopover();

  const statusLower = (status || '').toLowerCase();
  const statusLabel = STATUS_LABELS[statusLower] || status || 'Desconocido';

  return (
    <>
      <TableRow hover selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox checked={selected} onClick={onSelectRow} />
        </TableCell>

        <TableCell sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar alt={first_name} src={avatar_url} sx={{ mr: 2 }} />

          <ListItemText
            primary={`${first_name} ${last_name}`}
            secondary={email}
            primaryTypographyProps={{ typography: 'body2' }}
            secondaryTypographyProps={{
              component: 'span',
              color: 'text.disabled',
            }}
          />
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{phone_number}</TableCell>

        {authUser.user.role_id === 1 && (
          <TableCell sx={{ whiteSpace: 'nowrap' }}>{commerce?.name || '-'}</TableCell>
        )}

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{role?.name || '-'}</TableCell>

        <TableCell>
          <Label
            variant="soft"
            color={
              (statusLower === 'active' && 'success') ||
              (statusLower === 'pending' && 'warning') ||
              (statusLower === 'banned' && 'error') ||
              'default'
            }
          >
            {statusLabel}
          </Label>
        </TableCell>

        <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
          <Tooltip title="Edición rápida" placement="top" arrow>
            <IconButton color={quickEdit.value ? 'inherit' : 'default'} onClick={quickEdit.onTrue}>
              <Iconify icon="solar:pen-bold" />
            </IconButton>
          </Tooltip>

          <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      <UserQuickEditForm currentUser={row} open={quickEdit.value} onClose={quickEdit.onFalse} />

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        arrow="right-top"
        sx={{ width: 160 }}
      >
        <MenuItem
          onClick={() => {
            confirm.onTrue();
            popover.onClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          Eliminar
        </MenuItem>

        <MenuItem
          onClick={() => {
            onEditRow();
            popover.onClose();
          }}
        >
          <Iconify icon="solar:pen-bold" />
          Editar
        </MenuItem>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Eliminar usuario"
        content="¿Estás seguro de que querés eliminar este usuario?"
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            Eliminar
          </Button>
        }
      />
    </>
  );
}

UserTableRow.propTypes = {
  onDeleteRow: PropTypes.func,
  onEditRow: PropTypes.func,
  onSelectRow: PropTypes.func,
  row: PropTypes.object,
  selected: PropTypes.bool,
};
