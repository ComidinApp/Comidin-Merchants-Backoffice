import PropTypes from 'prop-types';

import Pagination, { paginationClasses } from '@mui/material/Pagination';

import PublicationReviewItem from './publication-review-item';

// ----------------------------------------------------------------------

export default function PublicationReviewList({ reviews }) {
  return (
    <>
      {reviews.map((review) => (
        <PublicationReviewItem key={review.id} review={review} />
      ))}

      <Pagination
        count={10}
        sx={{
          mx: 'auto',
          [`& .${paginationClasses.ul}`]: {
            my: 5,
            mx: 'auto',
            justifyContent: 'center',
          },
        }}
      />
    </>
  );
}

PublicationReviewList.propTypes = {
  reviews: PropTypes.array,
};
