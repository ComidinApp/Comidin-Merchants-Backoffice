import axios from 'axios';


export async function getGoogleReviews(placeId) {
  console.log("⏳ MOCK: Fetching reviews for", placeId);

  // Simulación de delay de red
  await new Promise((res) => setTimeout(res, 600));

  return {
    placeId,
    rating: 4.9,
    totalReviews: 59,
    reviews: [
      {
        id: "1",
        authorName: "Provath Ghosh",
        authorPhotoUrl: "https://randomuser.me/api/portraits/men/32.jpg",
        rating: 3,
        text: "Loving this place, highly recommended!",
        relativeTime: "2 months ago",
      },
      {
        id: "2",
        authorName: "MD Kamrul Alam",
        authorPhotoUrl: "https://randomuser.me/api/portraits/men/45.jpg",
        rating: 5,
        text: "Well decorated and comfortable environment.",
        relativeTime: "4 months ago",
      },
      {
        id: "3",
        authorName: "Rubel Mahmud",
        authorPhotoUrl: "https://randomuser.me/api/portraits/men/22.jpg",
        rating: 5,
        text: "Good software company with great people.",
        relativeTime: "5 months ago",
      },
      {
        id: "4",
        authorName: "Ashik Elahi",
        authorPhotoUrl: "https://randomuser.me/api/portraits/men/14.jpg",
        rating: 5,
        text: "Nice workstation with amazing people.",
        relativeTime: "6 months ago",
      },
      {
        id: "5",
        authorName: "Rubel Miah",
        authorPhotoUrl: "https://randomuser.me/api/portraits/men/18.jpg",
        rating: 5,
        text: "Very nice environment and professional team!",
        relativeTime: "7 months ago",
      },
      {
        id: "6",
        authorName: "Nishat Shahriyar",
        authorPhotoUrl: "https://randomuser.me/api/portraits/men/29.jpg",
        rating: 5,
        text: "Wonderful place, awesome company culture. Recommended!",
        relativeTime: "7 months ago",
      },
      {
        id: "7",
        authorName: "Flor raviol",
        authorPhotoUrl: "https://randomuser.me/api/portraits/women/32.jpg",
        rating: 3,
        text: "uwu",
        relativeTime: "2 months ago",
      },
    ],
  };
}