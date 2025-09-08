import { v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY } from './constants';

export const CloudinaryProvider = {
  provide: CLOUDINARY,
  useFactory: () => {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    return cloudinary;
  },
};


// CLOUDINARY_CLOUD_NAME=dsriwu6yn
// CLOUDINARY_API_KEY=715814567355674
// CLOUDINARY_API_SECRET=-KbZfjHulejXEtPBMCATurHUSGw




