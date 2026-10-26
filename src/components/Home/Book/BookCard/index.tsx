import React from 'react';
import {
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Typography,
  Button,
  Box
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

interface Book {
  title: string;
  authors: string;
  description: string;
  imageUrl?: string;
  amazonLink: string;
}

interface BookCardProps {
  book: Book;
}

const BookCard: React.FC<BookCardProps> = ({ book }) => {

  const { title, authors, description, imageUrl, amazonLink } = book;

  return (
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardActionArea
            href={amazonLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${title} on Amazon`}
            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2, bgcolor: 'action.hover' }}
        >
          <CardMedia
              component="img"
              sx={{
                height: 220,
                width: 150,
                objectFit: 'contain', // Or 'cover' if you prefer
                borderRadius: '4px'
              }}
              image={imageUrl || 'https://via.placeholder.com/150x220.png?text=Book+Cover'}
              alt={title}
          />
        </CardActionArea>
        <CardContent sx={{flexGrow: 1, textAlign: 'center'}}>
          <Typography
              gutterBottom
              variant="h6"
              component="div"
              sx={{
                fontSize: '1.0625rem',
                minHeight: '3.2em', // Approx 2 lines with some buffer
                lineHeight: '1.4em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
          >
            {title}
          </Typography>
          <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                minHeight: '2.8em', // Approx 2 lines
                lineHeight: '1.4em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                mb: 1
              }}
          >
            By: {authors}
          </Typography>
          <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                minHeight: '4em', // Approx 3 lines
                lineHeight: '1.33em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                mb: 2
              }}
          >
            {description}
          </Typography>
        </CardContent>
        <Box sx={{ px: 2, pb: 2, textAlign: 'center' }}>
          <Button
              size="small"
              variant="outlined"
              href={amazonLink}
              target="_blank"
              rel="noopener noreferrer"
              endIcon={<OpenInNewIcon/>}

          >
            View on Amazon
          </Button>
        </Box>
      </Card>
  );
};

export default BookCard;