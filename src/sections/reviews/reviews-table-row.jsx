import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import Rating from '@mui/material/Rating';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useBoolean } from 'src/hooks/use-boolean';

import Iconify from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

// ----------------------------------------------------------------------

export default function ReviewsTableRow({ row, selected, onSelectRow, onDeleteRow }) {
  const confirm = useBoolean();

  const { id, commerce_id, product_id, rate_order, comment } = row;

  return (
    <>
      <TableRow hover selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox checked={selected} onClick={onSelectRow} />
        </TableCell>

        <TableCell>
          <Typography variant="body2" noWrap>
            #{id}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2" noWrap>
            {commerce_id}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2" noWrap>
            {product_id}
          </Typography>
        </TableCell>

        <TableCell>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Rating value={Number(rate_order)} readOnly precision={0.5} size="small" />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              ({rate_order})
            </Typography>
          </Stack>
        </TableCell>

        <TableCell>
          <Tooltip title={comment} placement="top-start">
            <Typography
              variant="body2"
              sx={{
                maxWidth: 300,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {comment || <em style={{ color: '#919EAB' }}>Sin comentario</em>}
            </Typography>
          </Tooltip>
        </TableCell>

        <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
          <Tooltip title="Eliminar reseña">
            <IconButton color="error" onClick={confirm.onTrue}>
              <Iconify icon="solar:trash-bin-trash-bold" />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Eliminar reseña"
        content={
          <>
            ¿Estás seguro de que querés eliminar la reseña <strong>#{id}</strong>?
            <br />
            Esta acción no se puede deshacer.
          </>
        }
        action={
          <button
            type="button"
            onClick={() => {
              onDeleteRow();
              confirm.onFalse();
            }}
            style={{
              backgroundColor: '#FF5630',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Eliminar
          </button>
        }
      />
    </>
  );
}

ReviewsTableRow.propTypes = {
  row: PropTypes.object.isRequired,
  selected: PropTypes.bool,
  onSelectRow: PropTypes.func,
  onDeleteRow: PropTypes.func,
};
