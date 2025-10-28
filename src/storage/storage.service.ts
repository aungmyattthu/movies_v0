import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileKey: string;
  publicUrl: string;
  expiresIn: number;
}

export class StorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor(private configService: ConfigService) {
  const accessKeyId = process.env.R2_ACCESS_KEY ?? '';
  const secretAccessKey = process.env.R2_SECRET_KEY ?? '';
  const endpoint = process.env.CLOUDFLARE_ENDPOINT ?? '';

  if (!accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error('Missing required S3 credentials or endpoint');
  }

  this.s3Client = new S3Client({
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    region: "auto"
  });

    this.bucketName =  process.env.R2_BUCKET_NAME || 'video-streaming';
    this.publicUrl =  process.env.R2_PUBLIC_URL || '';
  }

  /**
   * Generate presigned URL for uploading files
   */
  async generatePresignedUrl(
    fileType: 'video' | 'trailer' | 'poster',
    contentType: string,
    fileName?: string,
  ): Promise<PresignedUrlResponse> {
    const fileExtension = this.getFileExtension(contentType);
    const uniqueFileName = fileName || `${uuidv4()}${fileExtension}`;
    const fileKey = `${fileType}s/${uniqueFileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, { 
      expiresIn: 3600, // 1 hour
    });

    return {
      uploadUrl,
      fileKey,
      publicUrl: `${this.publicUrl}/${fileKey}`,
      expiresIn: 3600,
    };
  }

  /**
   * Generate multiple presigned URLs for movie upload
   */
  async generateMovieUploadUrls(movieId?: string): Promise<any> {
    const id = movieId || uuidv4();

    const [poster, video, trailer] = await Promise.all([
      this.generatePresignedUrl('poster', 'image/jpeg', `${id}-poster.jpg`),
      this.generatePresignedUrl('video', 'video/mp4', `${id}-video.mp4`),
      this.generatePresignedUrl('trailer', 'video/mp4', `${id}-trailer.mp4`),
    ]);

    return { poster, video, trailer };
  }

  /**
   * Delete file from R2 storage
   */
  async deleteFile(fileKey: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
    });

    await this.s3Client.send(command);
  }

  /**
   * Get file extension from content type
   */
  private getFileExtension(contentType: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'video/quicktime': '.mov',
    };

    return extensions[contentType] || '';
  }
}