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
}