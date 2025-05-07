import { UTApi } from "uploadthing/server";
import { FileObject } from "../interfaces/file.interface";

export class UploadService {
  private utapi: UTApi;

  constructor() {
    this.utapi = new UTApi();
  }

  /**
   * Upload a file to UploadThing using direct upload
   * @param fileObject Object containing file information
   * @param metadata Additional metadata for the upload
   * @returns URL of the uploaded file
   */
  public async uploadFileDirectly(fileObject: FileObject, metadata: Record<string, any>): Promise<string> {
    try {
      // Create a File object from the buffer
      const file = new File([fileObject.buffer], fileObject.fileName, {
        type: fileObject.mimeType,
        lastModified: Date.now()
      });

      const result = await this.utapi.uploadFiles([file], {
        ...metadata
      });

      if (!Array.isArray(result) || !result[0]?.data?.url) {
        throw new Error('Error uploading file');
      }

      return result[0].data.url;
    } catch (error) {
      console.error('Error in uploadFileDirectly:', error);
      throw error;
    }
  }

  /**
   * Upload a file to UploadThing using presigned URLs (more reliable in Node.js)
   * @param fileObject Object containing file information
   * @returns URL of the uploaded file
   */
  public async uploadFileWithPresignedUrl(fileObject: FileObject): Promise<string> {
    try {
      // 1. Generate presigned URL
      const fileKey = `${Date.now()}-${fileObject.fileName}`;
      const presignedUrl = await this.utapi.generateSignedURL(fileKey);

      if (!presignedUrl) {
        throw new Error('Error generating presigned URL');
      }

      // 2. Upload to presigned URL
      const uploadResponse = await fetch(typeof presignedUrl === 'string' ? presignedUrl : presignedUrl.ufsUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': fileObject.mimeType
        },
        body: fileObject.buffer
      });

      if (!uploadResponse.ok) {
        throw new Error(`Error uploading to presigned URL: ${uploadResponse.statusText}`);
      }

      // 3. Get the final URL
      const { data } = await this.utapi.getFileUrls([fileKey]);

      if (!data || !data[0]?.url) {
        throw new Error('Could not get file URL');
      }

      return data[0].url;
    } catch (error) {
      console.error('Error in uploadFileWithPresignedUrl:', error);
      throw error;
    }
  }

  /**
   * Main method for uploading a file trying different strategies
   * @param fileObject Object containing file information
   * @param metadata Additional metadata for the upload
   * @returns URL of the uploaded file and method used
   */
  public async uploadProfileImage(fileObject: FileObject, userRole: string): Promise<{fileUrl: string, method: string}> {
    try {
      // Prepare metadata
      const metadata = {
        userId: `user-${Date.now()}`,
        userRole: userRole
      };

      try {
        // First attempt: direct upload
        const fileUrl = await this.uploadFileDirectly(fileObject, metadata);
        console.log(`File uploaded by ${userRole} using direct method: ${fileUrl}`);
        return { fileUrl, method: 'direct' };
      } catch (directError) {
        // Second attempt: presigned URL
        console.log('Direct upload failed. Trying with presigned URL...');
        const fileUrl = await this.uploadFileWithPresignedUrl(fileObject);
        console.log(`File uploaded by ${userRole} using presigned URL: ${fileUrl}`);
        return { fileUrl, method: 'presignedUrl' };
      }
    } catch (error) {
      console.error('Error in uploadProfileImage:', error);
      throw error;
    }
  }
}

export const uploadService = new UploadService();