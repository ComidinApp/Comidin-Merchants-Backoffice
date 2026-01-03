import PropTypes from 'prop-types';
import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

// Mapeo de valores a etiquetas
const STOCK_LABELS = {
  in_stock: 'En stock',
  low_stock: 'Bajo stock',
  out_of_stock: 'Sin stock',
};

const PUBLISH_LABELS = {
  active: 'Activo',
  inactive: 'Inactivo',
};

export default function PublicationTableFiltersResult({
  filters,
  onFilters,
  //
  onResetFilters,
  //
  results,
  ...other
}) {
  const handleRemoveStock = useCallback(
    (inputValue) => {
      const newValue = filters.stock.filter((item) => item !== inputValue);

      onFilters('stock', newValue);
    },
    [filters.stock, onFilters]
  );

  const handleRemovePublish = useCallback(
    (inputValue) => {
      const newValue = filters.publish.filter((item) => item !== inputValue);

      onFilters('publish', newValue);
    },
    [filters.publish, onFilters]
  );

  return (
    <Stack spacing={1.5} {...other}>
      <Box sx={{ typography: 'body2' }}>
        <strong>{results}</strong>
        <Box component="span" sx={{ color: 'text.secondary', ml: 0.25 }}>
          resultados encontrados
        </Box>
      </Box>

      <Stack flexGrow={1} spacing={1} direction="row" flexWrap="wrap" alignItems="center">
        {!!filters.stock.length && (
          <Block label="Stock:">
            {filters.stock.map((item) => (
              <Chip
                key={item}
                label={STOCK_LABELS[item] || item}
                size="small"
                onDelete={() => handleRemoveStock(item)}
              />
            ))}
          </Block>
        )}

        {!!filters.publish.length && (
          <Block label="Estado:">
            {filters.publish.map((item) => (
              <Chip
                key={item}
                label={PUBLISH_LABELS[item] || item}
                size="small"
                onDelete={() => handleRemovePublish(item)}
              />
            ))}
          </Block>
        )}

        <Button
          color="error"
          onClick={onResetFilters}
          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
        >
          Limpiar
        </Button>
      </Stack>
    </Stack>
  );
}

PublicationTableFiltersResult.propTypes = {
  filters: PropTypes.object,
  onFilters: PropTypes.func,
  results: PropTypes.number,
  onResetFilters: PropTypes.func,
};

// ----------------------------------------------------------------------

function Block({ label, children, sx, ...other }) {
  return (
    <Stack
      component={Paper}
      variant="outlined"
      spacing={1}
      direction="row"
      sx={{
        p: 1,
        borderRadius: 1,
        overflow: 'hidden',
        borderStyle: 'dashed',
        ...sx,
      }}
      {...other}
    >
      <Box component="span" sx={{ typography: 'subtitle2' }}>
        {label}
      </Box>

      <Stack spacing={1} direction="row" flexWrap="wrap">
        {children}
      </Stack>
    </Stack>
  );
}

Block.propTypes = {
  children: PropTypes.node,
  label: PropTypes.string,
  sx: PropTypes.object,
};
