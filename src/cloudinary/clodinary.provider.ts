import { v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY } from './constants';

export const CloudinaryProvider = {
  provide: CLOUDINARY,
  useFactory: () => {
    const config = {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    };

    // Debug logging (remove in production)
    console.log('🔧 Cloudinary Configuration:', {
      cloud_name: config.cloud_name ? '✅ Set' : '❌ Missing',
      api_key: config.api_key ? '✅ Set' : '❌ Missing',
      api_secret: config.api_secret ? '✅ Set' : '❌ Missing',
    });

    if (!config.cloud_name || !config.api_key || !config.api_secret) {
      console.error('❌ CLOUDINARY CREDENTIALS MISSING! Check your .env file');
      throw new Error('Cloudinary configuration is incomplete');
    }

    cloudinary.config(config);
    console.log('✅ Cloudinary configured successfully');
    return cloudinary;
  },
};





