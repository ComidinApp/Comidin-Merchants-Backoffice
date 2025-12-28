import { useState } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Rating from '@mui/material/Rating';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

export default function ReviewCard({ review, canDelete, onDelete }) {
  const { product_image_url, product_name, rate_order, comment, user_name } = review;
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDeleteClick = () => {
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    setConfirmOpen(false);
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <>
      <Card elevation={1} sx={{ p: 3, borderRadius: 3, height: '100%', position: 'relative' }}>
        {canDelete && (
          <IconButton
            onClick={handleDeleteClick}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: 'error.main',
              bgcolor: 'error.lighter',
              '&:hover': {
                bgcolor: 'error.light',
              },
            }}
            size="small"
          >
            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
          </IconButton>
        )}

        <Stack alignItems="center" spacing={2} sx={{ height: '100%' }}>
          <Box
            component="img"
            src={product_image_url}
            alt={product_name}
            sx={{
              width: 80,
              height: 80,
              borderRadius: 2,
              objectFit: 'cover',
              bgcolor: 'grey.100',
            }}
          />
          <Stack spacing={0.5} alignItems="center" sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={600} textAlign="center">
              {product_name}
            </Typography>
            {user_name && (
              <Typography variant="caption" color="text.secondary">
                por {user_name}
              </Typography>
            )}
            <Rating value={Number(rate_order)} readOnly precision={0.5} />
          </Stack>
          {comment && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                textAlign: 'center',
                fontStyle: 'italic',
                '&::before': { content: '"«"' },
                '&::after': { content: '"»"' },
              }}
            >
              {comment}
            </Typography>
          )}
          <Box
            component="img"
            src="/logo/logo_comidin.svg"
            alt="Comidin"
            sx={{ width: 40, opacity: 0.7, mt: 'auto' }}
          />
        </Stack>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Eliminar reseña"
        content={
          <>
            ¿Estás seguro de que deseas eliminar esta reseña de <strong>{product_name}</strong>?
            <br />
            Esta acción no se puede deshacer.
          </>
        }
        action={
          <IconButton
            onClick={handleConfirmDelete}
            sx={{
              bgcolor: 'error.main',
              color: 'white',
              '&:hover': { bgcolor: 'error.dark' },
              borderRadius: 1,
              px: 2,
            }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" width={20} sx={{ mr: 1 }} />
            <Typography variant="button">Eliminar</Typography>
          </IconButton>
        }
      />
    </>
  );
}

ReviewCard.propTypes = {
  review: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    product_image_url: PropTypes.string,
    product_name: PropTypes.string,
    rate_order: PropTypes.number,
    comment: PropTypes.string,
    user_name: PropTypes.string,
  }).isRequired,
  canDelete: PropTypes.bool,
  onDelete: PropTypes.func,
};

ReviewCard.defaultProps = {
  canDelete: false,
  onDelete: null,
};
