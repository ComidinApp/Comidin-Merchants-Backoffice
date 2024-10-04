import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Pagination, { paginationClasses } from '@mui/material/Pagination';

import CommerceItem from './commerce-item';
import { CommerceItemSkeleton } from './commerce-skeleton';

// ----------------------------------------------------------------------

export default function CommerceList({ commerces, loading, ...other }) {
  const renderSkeleton = (
    <>
      {[...Array(16)].map((_, index) => (
        <CommerceItemSkeleton key={index} />
      ))}
    </>
  );

  const renderList = (
    <>
      {commerces.map((commerce) => (
        <CommerceItem key={commerce.id} commerce={commerce} />
      ))}
    </>
  );

  return (
    <>
      <Box
        gap={3}
        display="grid"
        gridTemplateColumns={{
          xs: 'repeat(1, 1fr)',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(4, 1fr)',
        }}
        {...other}
      >
        {loading ? renderSkeleton : renderList}
      </Box>

      {commerces.length > 8 && (
        <Pagination
          count={8}
          sx={{
            mt: 8,
            [`& .${paginationClasses.ul}`]: {
              justifyContent: 'center',
            },
          }}
        />
      )}
    </>
  );
}

CommerceList.propTypes = {
  loading: PropTypes.bool,
  commerces: PropTypes.array,
};
