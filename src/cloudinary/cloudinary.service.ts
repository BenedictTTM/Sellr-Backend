import { Injectable } from '@nestjs/common';
import { UploadApiErrorResponse, UploadApiResponse, v2 } from 'cloudinary';
import toStream = require('buffer-to-stream');

@Injectable()
export class CloudinaryService {
  async uploadImage(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    
    console.log('🚀 CloudinaryService.uploadImage called');
    console.log('📁 File details:', {
      originalname: file?.originalname,
      mimetype: file?.mimetype,
      size: file?.size,
      bufferLength: file?.buffer?.length
    });
    
    return new Promise((resolve, reject) => {
      console.log('📤 Starting Cloudinary upload stream...');
      
      const upload = v2.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: 'products' // Optional: organize uploads in folders
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            return reject(error);
          }
          
          if (result) {
            console.log('✅ Cloudinary upload successful:', {
              public_id: result.public_id,
              secure_url: result.secure_url,
              format: result.format,
              bytes: result.bytes
            });
            resolve(result);
          } else {
            console.error('❌ Upload failed - no result returned');
            reject(new Error('Upload failed - no result returned'));
          }
        }
      );

      console.log('🔄 Piping file buffer to upload stream...');
      toStream(file.buffer).pipe(upload);
      
      console.log('⏳ Upload stream created and file piped...');
    });
  }

  /**
   * Upload profile picture with optimized settings
   * Professional approach: Separate folder, auto-crop to square, optimize quality
   */
  async uploadProfilePicture(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    
    console.log('🚀 CloudinaryService.uploadProfilePicture called');
    console.log('📁 File details:', {
      originalname: file?.originalname,
      mimetype: file?.mimetype,
      size: file?.size,
      bufferExists: !!file?.buffer,
      bufferLength: file?.buffer?.length,
    });

    if (!file || !file.buffer) {
      throw new Error('Invalid file: No file buffer provided');
    }
    
    return new Promise((resolve, reject) => {
      // Set a timeout for the upload (60 seconds)
      const uploadTimeout = setTimeout(() => {
        console.error('❌ Upload timeout after 60 seconds');
        reject(new Error('Upload timeout - Please check your internet connection'));
      }, 60000);

      const upload = v2.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'profile_pictures', // Separate folder for profile pics
          transformation: [
            {
              width: 400,
              height: 400,
              crop: 'fill', // Auto-crop to square
              gravity: 'face', // Focus on face if detected
              quality: 'auto', // Auto-optimize quality
              fetch_format: 'auto', // Auto-select best format (WebP, etc.)
            }
          ],
          allowed_formats: ['jpg', 'png', 'jpeg', 'webp'], // Restrict to image formats
          timeout: 60000, // 60 second timeout
        },
        (error, result) => {
          clearTimeout(uploadTimeout); // Clear the timeout if we get a response
          
          if (error) {
            console.error('❌ Profile picture upload error:', {
              message: error.message,
              http_code: error.http_code,
              name: error.name,
            });
            return reject(error);
          }
          
          if (result) {
            console.log('✅ Profile picture upload successful:', {
              public_id: result.public_id,
              secure_url: result.secure_url,
              format: result.format,
              bytes: result.bytes,
            });
            resolve(result);
          } else {
            console.error('❌ Upload failed - no result returned');
            reject(new Error('Profile picture upload failed - no result'));
          }
        }
      );

      console.log('🔄 Piping file buffer to Cloudinary upload stream...');
      toStream(file.buffer).pipe(upload);
    });
  }
}