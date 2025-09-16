import React from 'react';
import { useParams } from 'react-router-dom';
import GalleryView from '../components/Gallery/GalleryView';

const ShareGalleryPage = () => {
  const { token } = useParams();
  return <GalleryView galleryId={token} isSharedView={true} />;
};

export default ShareGalleryPage;