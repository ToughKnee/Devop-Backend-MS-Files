import { Request, Response, NextFunction } from 'express';
import { createRouteHandler } from "uploadthing/express";
import { uploadRouter } from '../../../config/uploadthing';
import { AuthenticatedRequest } from '../middleware/authenticate.middleware';
import { uploadService } from '../services/upload.service';
import multer from 'multer';

// Multer configuration for file processing
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

// Create the file router for uploadthing routes
export const fileRouter = uploadRouter;

// Export the controller with handlers
export const uploadController = {
  // Middleware to determine request type
  determineRequestType: (req: Request, res: Response, next: NextFunction): void => {
    // Check if it's a multipart request (Flutter) or UploadThing SDK request (web)
    const contentType = req.headers['content-type'] || '';
    
    if (contentType.includes('multipart/form-data')) {
      // For mobile clients, process with multer
      upload.single('file')(req, res, (err) => {
        if (err) {
          res.status(400).json({ 
            message: 'Error processing file' 
          });
          return; // End here, don't call next()
        }
        next(); // Only call next() if there's no error
      });
    } else {
      // For web clients using UploadThing SDK
      const authReq = req as AuthenticatedRequest;
      if (authReq.user?.role === 'admin') {
        // Use a wrapper function to handle UploadThing route
        const handler = createRouteHandler({
          router: fileRouter,
          config: {
            logLevel: "Debug"
          }
        });
        handler(req, res, next);
      } else {
        // Permission error - important not to call next() after sending response
        res.status(403).json({ 
          message: 'Access denied. Administrator role required to use the web SDK.'
        });
      }
    }
  },

  // Handler to process mobile client uploads
  processUpload: async (req: Request, res: Response): Promise<void> => {
    try {
      // If there's no file, it's because it was already handled by createRouteHandler for web clients
      if (!req.file) {
        return; // Do nothing, already handled by UploadThing
      }
      
      const authReq = req as AuthenticatedRequest;
      
      // Create file object for the service
      const fileObject = {
        buffer: req.file.buffer,
        mimeType: req.file.mimetype,
        fileName: req.file.originalname
      };
      
      // Use the service to upload the file
      const result = await uploadService.uploadProfileImage(fileObject, authReq.user.role);

      // Return response
      res.status(200).json({
        message: `Image uploaded successfully${result.method === 'presignedUrl' ? ' (using presigned URL)' : ''}`,
        fileUrl: result.fileUrl
      });
    } catch (error: any) {
      console.error('Error uploading file:', error);
      res.status(500).json({
        message: 'Error uploading image',
        error: error.message || 'Unknown error'
      });
    }
  }
};