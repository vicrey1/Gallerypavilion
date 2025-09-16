# Gallery Pavilion

A modern, private, premium photography gallery platform.

## Tech Stack

- **Frontend**: React (JavaScript), React Router v7, Tailwind CSS
- **Backend**: Node.js + Express (JavaScript)
- **Authentication**: JWT stored in HttpOnly cookies
- **Storage**: Cloud (S3/R2) with signed URLs
- **Image Processing**: Sharp for watermarked previews and thumbnails
- **Homepage Images**: Unsplash API with fallback

## Project Structure

```
gallery-pavilion/
├── frontend/          # React application
├── backend/           # Node.js/Express API
└── README.md
```

## Getting Started

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Features

- Photographer authentication and approval system
- Private gallery sharing with tokens and passwords
- Image upload with automatic watermarking
- Responsive masonry grid with lightbox
- Admin panel for user management
- Premium homepage with slideshow

## Environment Variables

See backend/.env.example for required environment variables.