import { v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY } from './constants';

export const CloudinaryProvider = {
  provide: CLOUDINARY,
  useFactory: () => {
    cloudinary.config({
      cloud_name: 'dsriwu6yn',
      api_key: '715814567355674',
      api_secret: '-KbZfjHulejXEtPBMCATurHUSGw',
    });
    return cloudinary;
  },
};


// CLOUDINARY_CLOUD_NAME=dsriwu6yn
// CLOUDINARY_API_KEY=715814567355674
// CLOUDINARY_API_SECRET=-KbZfjHulejXEtPBMCATurHUSGw

