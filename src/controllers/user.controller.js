import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshToken = async (userID) => {
    try {
        const user = await User.findById(userID);
        const accessToken = user.generateAccessToken()
        const refressToken = user.generateRefreshToken()
        user.refressToken = refressToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refressToken }
    } catch (error) {
        throw new ApiError(500, "isme meri galti h user controller me dekh 11 number line pe ")

    }
}

// register user 
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
    //  upload them to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar file is require")
    }

    // create user object -create entery in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        userName: userName.toLowerCase()
    })

    // remove password and refresh token field from response 
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createdUser) {
        throw new ApiError(500, "server fat gya h dekh le user controller me line number 65 me")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "user registered succesfully")
    )
})


// loggedin user 
const loginUser = asyncHandler(async (req, res) => {
    // req body  =>
    // username or email
    // fine the user 
    //password check 
    // access and refresh token
    // send cookies 

    const { email, userName, password } = req.body;
    if (!userName && !email) {
        throw new ApiError(400, "error login user name o email chahiye")
    }
    const user = await User.findOne({
        $or: [{ userName }, { email }]
    })
    if (!user) {
        throw new ApiError(401, "user hi nahi h ")
    }
    const isPassordValid = await user.isPassordCorrect(password)
    if (!isPassordValid) {
        throw new ApiError(401, "password sahi nahi hi nahi h ")
    }
    const {accessToken, refressToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    const options = {
        httpOnly : true,
        secure: true
    }
    return res.status(200).cookie("accessToken", accessToken,options).cookie("refreshToken", refressToken, options).json(
        new ApiResponse(
            200,{
                user: loggedInUser, accessToken,refressToken
            },
            "user logged in successfully"
        )
    )
})


// loggout user
const logoutUser = asyncHandler(async(req, res) =>{
   await User.findByIdAndUpdate(
        req.user._id,{
            $set:{
                refressToken: undefined
            }
        },{
            new: true
        }
    )
   
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken" , options).json(new ApiResponse(200, {}, "loged out "))
})


export { registerUser, loginUser,logoutUser }