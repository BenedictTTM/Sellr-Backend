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
    });
    
    return new Promise((resolve, reject) => {
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
        },
        (error, result) => {
          if (error) {
            console.error('❌ Profile picture upload error:', error);
            return reject(error);
          }
          
          if (result) {
            console.log('✅ Profile picture upload successful:', {
              public_id: result.public_id,
              secure_url: result.secure_url,
            });
            resolve(result);
          } else {
            reject(new Error('Profile picture upload failed'));
          }
        }
      );

      toStream(file.buffer).pipe(upload);
    });
  }
}