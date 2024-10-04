import PropTypes from 'prop-types';

import Pagination, { paginationClasses } from '@mui/material/Pagination';

import CommerceReviewItem from './commerce-review-item';

// ----------------------------------------------------------------------

export default function CommerceReviewList({ reviews }) {
  return (
    <>
      {reviews.map((review) => (
        <CommerceReviewItem key={review.id} review={review} />
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

CommerceReviewList.propTypes = {
  reviews: PropTypes.array,
};
