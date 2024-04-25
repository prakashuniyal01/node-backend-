import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js"

const registerUser = asyncHandler(async (req, res) => {
    
    /*  get user details from frontend
        validation -not empty 
        check if user already exists: username email
        check for img check for avatar
        upload them to cloudinary, avatar
        create user object -create entery in db
        remove password and refresh token field from response 
        check for user creation
        return response 
    */

    // destructure user data

    // get user details from frontend validation -not empty
    const { fullName, email, userName, password } = req.body
    console.log("email", email);
    if ([fullName, email, userName, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "full name is require")
    }
    //   check if user already exists: username email
    const existedUser = User.findOne({
        $or: [{ userName }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "user and email is already exits")
    }
    // check for img check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is require")
    }

})



export { registerUser }