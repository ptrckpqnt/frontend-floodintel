import React from 'react';

const samplePhotos = import.meta.glob('./sample-photos/*.jpg', { eager: true, query: '?url', import: 'default' });

export default function SampleFloodPhoto({ reportId }) {
  const photo = samplePhotos[`./sample-photos/${reportId}.jpg`];
  return photo
    ? <img className="reporter-detail-photo" src={photo} alt="Illustrative flood photo for this sample report" />
    : <p>No photo attached.</p>;
}
