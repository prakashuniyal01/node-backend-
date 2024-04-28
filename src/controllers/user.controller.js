import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


const generateAccessAndRefreshToken = async (userID) => {
  try {
    const user = await User.findById(userID);
    const accessToken = user.generateAccessToken();
    const refressToken = user.generateRefreshToken();
    user.refressToken = refressToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refressToken };
  } catch (error) {
    throw new ApiError(
      500,
      "isme meri galti h user controller me dekh 11 number line pe "
    );
  }
};

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
  const { fullName, email, userName, password } = req.body;
  console.log("email", email);
  if (
    [fullName, email, userName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "full name is require");
  }
  //   check if user already exists: username email

  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }
  // check for img check for avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  // if (!avatarLocalPath) {
  //     throw new ApiError(400, "Avatar file is require")
  // }
  //  upload them to cloudinary, avatar
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // if (!avatar) {
  //     throw new ApiError(400, "Avatar file is require")
  // }

  // create user object -create entery in db
  const user = await User.create({
    fullName,
    avatar: avatar?.url || "",
    coverImage: coverImage?.url || "",
    email,
    password,
    userName, //: userName.toLowerCase()
  });

  // remove password and refresh token field from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(
      500,
      "server fat gya h dekh le user controller me line number 65 me"
    );
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user registered succesfully"));
});

// loggedin user
const loginUser = asyncHandler(async (req, res) => {
  // console.log(loggedInUser)
  // req body  =>
  // username or email
  // fine the user
  //password check
  // access and refresh token
  // send cookies

  const { email, userName, password } = req.body;
  if (!userName && !email) {
    throw new ApiError(400, "error login user name o email chahiye");
  }
  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (!user) {
    throw new ApiError(401, "user hi nahi h ");
  }
  const isPassordValid = await user.isPassordCorrect(password);
  if (!isPassordValid) {
    throw new ApiError(401, "password sahi nahi hi nahi h ");
  }
  const { accessToken, refressToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refressToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refressToken,
        },
        "user logged in successfully"
      )
    );
});

// loggout user
const logoutUser = asyncHandler(async (req, res) => {
  // console.log(loginUser)
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refressToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "loged out "));
});
// db me token ko match krna user right h ki nahi
const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies.refressToken || req.body.refressToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "unzuthorized request");
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "user me kuch gadbad h invalid refresh token");
    }
    if (incomingRefreshToken !== user?.refressToken) {
      throw new ApiError(401, "refresh token ki validity samapt ho gyi h ");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newRefressToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("newRefressToken", newRefressToken, options)
      .json(
        new ApiError(
          200,
          { accessToken, refressToken: newRefressToken },
          "access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid refresh token");
  }
});

// pashword changes

// const changeCurrentPassword = asyncHandler(async (req, res) => {
//   const { oldPassword, newPassword } = req.body
//   const user = await User.findById(req.user?._id)
//   const isPassordCorrect = await user.isPassordCorrect(oldPassword);
//   // if (newPassword === confPassword)
//   if (!isPassordCorrect) {
//     throw new ApiError(400, "invalid old password");
//   }

//   user.password = newPassword;
//   await user.save({ validateBeforeSave: false });

//   return res
//     .status(200)
//     .json(new ApiResponse(200, {}, "password is successfuly update"));
// });

// change 

const changeCurrentPassword = asyncHandler(async(req, res) => {
  const {oldPassword, newPassword} = req.body

  

  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if (!isPasswordCorrect) {
      throw new ApiError(400, "Invalid old password")
  }

  user.password = newPassword
  await user.save({validateBeforeSave: false})

  return res
  .status(200)
  .json(new ApiResponse(200, {}, "Password changed successfully"))
})

// current user

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(200, req.user, "current user fetched successfully");
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || email) {
    throw new ApiError(400, "all fields are required");
  }

  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email: email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar file is mising");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "error while uploading on avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "cover img is update successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "cover img  file is mising");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "error while uploading on cover img");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "cover img is update successfully"));
});

// const getUserChannelProfile = asyncHandler(async (req, res) => {
//   const { userName } = req.params;

//   if (!userName?.trim()) {
//     throw new ApiError(400, "user is missing");
//   }
//   const channel = await User.aggregate([
//     {
//       $match: {
//         userName: userName?.toLowercase(),
//       },
//     },
//     {
//       $lookup: {
//         from: "subscriptions",
//         localField: "_id",
//         foreignField: "channel",
//         as: "subscribers",
//       },
//     },
//     {
//       $lookup: {
//         from: "subscriptions",
//         localField: "_id",
//         foreignField: "subscriber",
//         as: "subscribersTo",
//       },
//     },
//     {
//       $addFields: {
//         subscribersCount: {
//           $size: "$subscribers",
//         },
//         channelsSubscribedToCount: {
//           $size: "$subscribersTo",
//         },
//         issubscribed: {
//           $cond: {
//             if: { $in: [req.user?._id, "$subscribers.subscriber"] },
//             then: true,
//             else: false,
//           },
//         },
//       },
//     },
//     {
//       $project: {
//         fullName: 1,
//         userName: 1,
//         subscribersCount: 1,
//         channelsSubscribedToCount: 1,
//         isSubscribed: 1,
//         avatar: 1,
//         coverImage: 1,
//         email: 1,
//       },
//     },
//   ]);
//   if (!channel?.length) {
//     throw new ApiError(404, "channel does not exists");
//   }

//   return res
//     .status(200)
//     .json(
//       new ApiResponse(200, channel[0], "User channel fetched successfully")
//     );
// });

const getUserChannelProfile = asyncHandler(async(req, res) => {
  const {userName} = req.params

  if (!userName?.trim()) {
      throw new ApiError(400, "username is missing")
  }

  const channel = await User.aggregate([
      {
          $match: {
            userName: userName?.toLowerCase()
          }
      },
      {
          $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers"
          }
      },
      {
          $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "subscriber",
              as: "subscribedTo"
          }
      },
      {
          $addFields: {
              subscribersCount: {
                  $size: "$subscribers"
              },
              channelsSubscribedToCount: {
                  $size: "$subscribedTo"
              },
              isSubscribed: {
                  $cond: {
                      if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                      then: true,
                      else: false
                  }
              }
          }
      },
      {
          $project: {
              fullName: 1,
              userName: 1,
              subscribersCount: 1,
              channelsSubscribedToCount: 1,
              isSubscribed: 1,
              avatar: 1,
              coverImage: 1,
              email: 1

          }
      }
  ])

  if (!channel?.length) {
      throw new ApiError(404, "channel does not exists")
  }

  return res
  .status(200)
  .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully")
  )
})

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    userName: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner: {
                $first: "$owner"
              }
            }
          }
        ]
      }
    }
  ])

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch history fetched successfully"
      )
    )
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  updateAccountDetails,
  getCurrentUser,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
};
