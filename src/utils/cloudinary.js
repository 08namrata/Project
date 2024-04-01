import { v2 as cloudinary} from "cloudinary";
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.COULDINARY_CLOUD_NAME , 
    api_key: process.env.COULDINARY_CLOUD_API_KEY, 
    api_secret: process.env.COULDINARY_CLOUD_API_SECRET,
    secure: true 
  });

  const uploadOnCloudinary = async (localFilePath) =>{
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        //file has been uploaded successfully
        console.log("file is uploaded on cloudinary",response.url);
        fs.unlinkSync(localFilePath);
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath)//remove the locally save temporary file as the upload operation got failed
        return null;
    }
  }
  const deleteFromCloudinary = async (publicId, resourceType) => {
    try {
      if (!publicId) {
        throw new Error('Missing public ID for deletion');
      }
  
      if (!resourceType || (resourceType !== 'image' && resourceType !== 'video')) {
        throw new Error('Invalid resource type for deletion. Supported types: image, video');
      }
  
      if (resourceType === 'image') {
        const response = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
        console.log(`Deleting image with public ID:`, publicId);
        console.log("Old image deleted from Cloudinary:", response);
        return response;
      } else if (resourceType === 'video') {
        const response = await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
        console.log(`Deleting video with public ID:`, publicId);
        console.log("Old video deleted from Cloudinary:", response);
        return response;
      } else {
        // Handle unsupported resource type (optional)
        throw new Error(`Unsupported resource type: ${resourceType}`);
      }
    } catch (error) {
      console.error("Error deleting file from Cloudinary:", error);
      throw error; // Re-throw the error for further handling
    }
  };
  function extractPublicId(cloudinaryUrl) {
    // Split the URL by '/'
    const parts = cloudinaryUrl.split('/');
    // Get the last part which should be the public ID with file extension
    const publicIdWithExtension = parts[parts.length - 1];
    // Remove file extension from public ID
    const publicId = publicIdWithExtension.split('.')[0];
    return publicId;
}
  

export {uploadOnCloudinary,deleteFromCloudinary,extractPublicId}