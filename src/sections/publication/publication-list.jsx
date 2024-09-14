import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Pagination, { paginationClasses } from '@mui/material/Pagination';

import PublicationItem from './publication-item';
import { PublicationItemSkeleton } from './publication-skeleton';

// ----------------------------------------------------------------------

export default function PublicationList({ publications, loading, ...other }) {
  const renderSkeleton = (
    <>
      {[...Array(16)].map((_, index) => (
        <PublicationItemSkeleton key={index} />
      ))}
    </>
  );

  const renderList = (
    <>
      {publications.map((publication) => (
        <PublicationItem key={publication.id} publication={publication} />
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

      {publications.length > 8 && (
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

PublicationList.propTypes = {
  loading: PropTypes.bool,
  publications: PropTypes.array,
};
