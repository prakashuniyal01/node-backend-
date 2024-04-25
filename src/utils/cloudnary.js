import {v2 as cloudinary} from 'cloudinary';
import fs from "fs"
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDNARY_CLOUD_NAME, 
  api_key: process.env.CLOUDNARY_API_KEY, 
  api_secret: process.env.CLOUDNARY_API_SECRET,
});


const uploadOnCloudinary = async(localFilePath) =>{
    try {
        if (!localFilePath) return null
        // upload the file on cloudnary
       const response= await  cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto'
        })
        // file hash been uploaded successfully
        console.log(`upload ${response.url}`)
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath)
        //remove 
        return null
        
    }
}





export {uploadOnCloudinary}

// cloudinary.uploader.upload("https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
//   { public_id: "olympic_flag" }, 
//   function(error, result) {console.log(result); });