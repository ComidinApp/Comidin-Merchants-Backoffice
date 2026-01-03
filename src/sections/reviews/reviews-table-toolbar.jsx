import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function ReviewsTableToolbar({ searchQuery, onSearch, numResults }) {
  return (
    <Stack
      spacing={2}
      alignItems={{ xs: 'flex-end', md: 'center' }}
      direction={{ xs: 'column', md: 'row' }}
      sx={{ p: 2.5 }}
    >
      <TextField
        fullWidth
        value={searchQuery}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Buscar por ID, comercio, producto o comentario..."
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          ),
        }}
        sx={{ maxWidth: { md: 400 } }}
      />

      <Stack direction="row" alignItems="center" spacing={1} flexGrow={1} justifyContent="flex-end">
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          <strong>{numResults}</strong> reseñas encontradas
        </Typography>
      </Stack>
    </Stack>
  );
}

ReviewsTableToolbar.propTypes = {
  searchQuery: PropTypes.string,
  onSearch: PropTypes.func,
  numResults: PropTypes.number,
};

