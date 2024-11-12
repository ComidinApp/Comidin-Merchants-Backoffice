import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Collapse from '@mui/material/Collapse';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import { useBoolean } from 'src/hooks/use-boolean';

import { fCurrency } from 'src/utils/format-number';
import { fDate, fTime } from 'src/utils/format-time';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import CustomPopover, { usePopover } from 'src/components/custom-popover';
import { _mock } from '../../_mock';

// ----------------------------------------------------------------------

export default function OrderTableRow({ row, selected, onViewRow, onSelectRow, onDeleteRow }) {
  const { order_details, status, id, commerce, created_at, user, items_quantity, total_amount } =
    row;

  const authUser = useAuthContext();

  const confirm = useBoolean();

  const collapse = useBoolean();

  const popover = usePopover();

  function stringToNumber(input) {
    let sum = 0;
    for (let i = 0; i < input.length; i += 1) {
      sum += input.charCodeAt(i);
    }

    return (sum % 24) + 1;
  }

  const randomAvatar = _mock.image.avatar(stringToNumber(user.email));

  const renderPrimary = (
    <TableRow hover selected={selected}>
      <TableCell padding="checkbox">
        <Checkbox checked={selected} onClick={onSelectRow} />
      </TableCell>

      <TableCell>
        <Box
          onClick={onViewRow}
          sx={{
            cursor: 'pointer',
            '&:hover': {
              textDecoration: 'underline',
            },
          }}
        >
          {id.toString().padStart(4, '0')}
        </Box>
      </TableCell>

      {authUser.user.role_id === 1 && (
        <TableCell>{commerce.name ? commerce.name : 'N/A'}</TableCell>
      )}

      <TableCell sx={{ display: 'flex', alignItems: 'center' }}>
        <Avatar alt={user.first_name} src={randomAvatar} sx={{ mr: 2 }} />

        <ListItemText
          primary={`${user.first_name} ${user.last_name}`}
          secondary={user.email}
          primaryTypographyProps={{ typography: 'body2' }}
          secondaryTypographyProps={{
            component: 'span',
            color: 'text.disabled',
          }}
        />
      </TableCell>

      <TableCell>
        <ListItemText
          primary={fDate(created_at)}
          secondary={fTime(created_at)}
          primaryTypographyProps={{ typography: 'body2', noWrap: true }}
          secondaryTypographyProps={{
            mt: 0.5,
            component: 'span',
            typography: 'caption',
          }}
        />
      </TableCell>

      <TableCell align="center"> {items_quantity} </TableCell>

      <TableCell> {fCurrency(total_amount)} </TableCell>

      <TableCell>
        <Label
          variant="soft"
          color={
            (status === 'completed' && 'success') ||
            (status === 'pending' && 'warning') ||
            (status === 'confirmed' && 'info') ||
            (status === 'cancelled' && 'error') ||
            'default'
          }
        >
          {(() => {
            if (status === 'pending') return 'Pendiente';
            if (status === 'completed') return 'Completado';
            if (status === 'confirmed') return 'Confirmado';
            if (status === 'refunded') return 'Devuelto';
            if (status === 'cancelled') return 'Cancelado';
            return status;
          })()}
        </Label>
      </TableCell>

      <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
        <IconButton
          color={collapse.value ? 'inherit' : 'default'}
          onClick={collapse.onToggle}
          sx={{
            ...(collapse.value && {
              bgcolor: 'action.hover',
            }),
          }}
        >
          <Iconify icon="eva:arrow-ios-downward-fill" />
        </IconButton>

        <Button
          onClick={() => {
            onViewRow();
            popover.onClose();
          }}
          startIcon={<Iconify icon="solar:eye-bold" />}
          sx={{ minWidth: 0, padding: '8px 16px' }} // Ajusta el estilo según lo necesites
        >
          {/* Detalle */}
        </Button>
      </TableCell>
    </TableRow>
  );

  const renderSecondary = (
    <TableRow>
      <TableCell sx={{ p: 0, border: 'none' }} colSpan={8}>
        <Collapse
          in={collapse.value}
          timeout="auto"
          unmountOnExit
          sx={{ bgcolor: 'background.neutral' }}
        >
          <Stack component={Paper} sx={{ m: 1.5 }}>
            {order_details.map((item) => (
              <Stack
                key={item.id}
                direction="row"
                alignItems="center"
                sx={{
                  p: (theme) => theme.spacing(1.5, 2, 1.5, 1.5),
                  '&:not(:last-of-type)': {
                    borderBottom: (theme) => `solid 2px ${theme.palette.background.neutral}`,
                  },
                }}
              >
                <Avatar
                  src={item.publication.product.image_url}
                  variant="rounded"
                  sx={{ width: 48, height: 48, mr: 2 }}
                />

                <ListItemText
                  primary={item.publication.product.name}
                  secondary={`$${item.publication.discounted_price}`}
                  primaryTypographyProps={{
                    typography: 'body2',
                  }}
                  secondaryTypographyProps={{
                    component: 'span',
                    color: 'text.disabled',
                    mt: 0.5,
                  }}
                />

                <Box>x{item.quantity}</Box>

                <Box sx={{ width: 110, textAlign: 'right' }}>{fCurrency(item.price)}</Box>
              </Stack>
            ))}
          </Stack>
        </Collapse>
      </TableCell>
    </TableRow>
  );

  return (
    <>
      {renderPrimary}

      {renderSecondary}

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        arrow="right-top"
        sx={{ width: 140 }}
      >
        {/* <MenuItem
          onClick={() => {
            confirm.onTrue();
            popover.onClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          Delete
        </MenuItem> */}

        <MenuItem
          onClick={() => {
            onViewRow();
            popover.onClose();
          }}
        >
          <Iconify icon="solar:eye-bold" />
          Detalles
        </MenuItem>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content="Are you sure want to delete?"
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            Delete
          </Button>
        }
      />
    </>
  );
}

OrderTableRow.propTypes = {
  row: PropTypes.object,
  selected: PropTypes.bool,
  onViewRow: PropTypes.func,
  onDeleteRow: PropTypes.func,
  onSelectRow: PropTypes.func,
};
