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
  const deleteFromCloudinary = async (publicId) => {
    try {
      if (!publicId) {
        throw new Error('Missing public ID for deletion');
      }
  
      const response = await cloudinary.uploader.destroy(publicId);
      console.log("Deleting image with public ID:", publicId);
      console.log("Old file deleted from Cloudinary:", response);
      return response; // Optional: Return the response object if needed
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