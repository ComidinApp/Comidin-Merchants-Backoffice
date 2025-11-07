import PropTypes from 'prop-types';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Rating from '@mui/material/Rating';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';


export default function GoogleReviewCard({ review }) {
const { authorName, authorPhotoUrl, rating, text, relativeTime } = review;
return (
    <Card elevation={1} sx={{ p: 3, borderRadius: 3 }}>
    <Stack alignItems="center" spacing={2}>
    <Avatar src={authorPhotoUrl} sx={{ width: 72, height: 72}} />
    <Stack spacing={0.5} alignItems="center">
    <Typography variant="h6">{authorName}</Typography>
    <Rating value={Number(rating)} readOnly precision={0.5} />
    <Typography variant="caption" color="text.secondary">{relativeTime}</Typography>
    </Stack>
    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
    {text}
    </Typography>
    <Box component="img" src="/logo/logo_comidin.svg" alt="Google" sx={{ width: 40, opacity: 0.7 }} />
    </Stack>
    </Card>
    );
}


GoogleReviewCard.propTypes = {
review: PropTypes.object.isRequired,
};