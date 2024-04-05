import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User} from "../models/user.model.js"
import {uploadOnCloudinary,deleteFromCloudinary,extractPublicId} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken';
import mongoose from "mongoose";


const generateAccessAndRefreshTokens =async (userId)=>{
    try {
         const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken= user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken,refreshToken}
        
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating refresh and access token")
    }
}
const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res


    const {fullName, email, username, password,watchHistory } = req.body
    console.log("email: ", email,"fullName:",fullName,"username:",username,"password:",password,"watchHistory:",watchHistory);

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    //console.log(req.files);

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
   
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
   

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase(),
        watchHistory
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

} )

const loginUser = asyncHandler(async (req,res)=>{
      // get user details from frontend
     // validation - not empty
     // username or password
     //find user
     //password check
     //access and refresh token
     //send cookies 

     const {email,username,password} = req.body
     console.log("email: ",email,"username:",username,"password:",password);

     if(!username && !email) {
        throw new ApiError(400, "username or email required")
    } 

    const user = await User.findOne({
         $or: [{ username }, { email }]
        })
    

    if(!user){
        throw new ApiError(404, "User does not exist")
    }
 const isPasswordValid = await user.isPasswordCorrect(password)

 if (!isPasswordValid){
    throw new ApiError(401,"Invalid user credentials")
 }
  
  const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options= {
    httpOnly:true,
    secure: true
  }
return res.status(200)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken",refreshToken,options)
.json(
    new ApiResponse(200,{
        user: loggedInUser,accessToken,refreshToken
    },"User Logged In Successfully")
)

})

const logoutUser = asyncHandler(async(req,res)=>{
   await User.findByIdAndUpdate(
    req.user._id,
    {
        $unset:{
            refreshToken: undefined
        }
        
    },{
        new: true
    }
   )
   const options= {
    httpOnly:true,
    secure: true
  }

  return res.status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(new ApiResponse(200,{},"User logged Out successfully"))
})

const refreshAccessToken = asyncHandler(async(req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  
    if (!incomingRefreshToken) {
      return res.status(401).json({
        statusCode: 401,
        data: null,
        message: "Unauthorized Request",
        success: false
      });
    }
  
    try {
      // Verify the refresh token
      const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  
      // Check if the refresh token has expired
      if (decodedToken.exp <= Math.floor(Date.now() / 1000)) {
        return res.status(401).json({
          statusCode: 401,
          data: null,
          message: "Refresh token is expired",
          success: false
        });
      }
  
      // Generate new access and refresh tokens
      const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(decodedToken._id);
  
      // Set the new tokens in the response cookies
      const options = {
        httpOnly: true,
        secure: true
      };
  
      return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json({
          statusCode: 200,
          data: { accessToken, refreshToken: newRefreshToken },
          message: "Access token refreshed successfully",
          success: true
        });
  
    } catch (error) {
      return res.status(401).json({
        statusCode: 401,
        data: null,
        message: error?.message || "Invalid refresh token",
        success: false
      });
    }
  });
  

const changeCurrentPassword = asyncHandler(async (req,res)=>{
   const {password,newPassword,confirmPassword}=req.body
   console.log("password:",password,"newPassword:",newPassword,"confirmPassword:",confirmPassword)
   if(!(newPassword === confirmPassword)){
    throw new ApiError(400,"Password does not match")
   }
   const user = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(password)

  if(!isPasswordCorrect){
    throw new ApiError(400,"Invalid old password")
  }

 user.password = newPassword
   await user.save({validateBeforeSave: false}) 
return res.status(200).json(
    new ApiResponse(200,{},"Password changed successfully")
)

})

const getCurrentUser = asyncHandler(async (req,res)=>{
    return res.status(200)
    .json({status:200,data:req.user,message:"current user fetched successfully"})
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body;

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const existingUser = await User.findOne({ email });
  if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
    throw new ApiError(400, "Email address already in use");
  }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName,
                email: email
            }
        },
        {new: true}
        
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
});

const updateUserAvatar = asyncHandler(async (req,res)=>{
    const userId = req.user.id
  
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
      }

  const avatarLocalPath =  req.file?.path

  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is missing")
  }
   const avatar = await uploadOnCloudinary(avatarLocalPath)

   if(!avatar.url){
    throw new ApiError(400,"Eror while uploading avatar on cloudinary")
   }
   
   if (user.avatar) {
    // Extract the public ID from the cover image URL
    const publicId = extractPublicId(user.avatar);
    // Delete the image using the public ID
    await deleteFromCloudinary(publicId);
}

   await User.findByIdAndUpdate(req.user?._id,
    {
        $set:{
            avatar: avatar.url
        }
    },
    {new: true}).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const userId = req.user.id
  
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
      }
  
      const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }
   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    if (user.coverImage) {
        // Extract the public ID from the cover image URL
        const publicId = extractPublicId(user.coverImage);
        // Delete the image using the public ID
        await deleteFromCloudinary(publicId);
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedUser, "Cover image updated successfully")
    )
})



const getUserChannelProfile = asyncHandler(async(req,res)=>{
  const {username} = req.params
  if(!username){
    throw new ApiError(400,"username is missing")
  }

 const channel = await User.aggregate([
    {
        $match:{
            username: username?.toLowerCase()
        }
    },
    {
        $lookup:{
            from:"subscriptions",
            localField:"_id",
            foreignField:"subscriber",
            as: "subscribedTo"
        }
    },
    {
        $lookup:{
            from:"subscriptions",
            localField:"_id",
            foreignField:"channel",
            as: "subscriber"
        }   
    },
    {
        $addFields:{
            subscribersCount:{
                $size:"$subscriber"
            },
            channelSubscribedToCount:{
                $size:"$subscribedTo"
            },
            isSubscribed:{
                $cond:{
                    if:{$in:[req.user._id,"$subscriber.subscriber"]},
                    then: true,
                    else:false
                }
            }
        }
    },
    {
        $project:{
            fullName:1,
            username:1,
            subscribersCount: 1,
            channelSubscribedToCount:1,
            isSubscribed:1,
            avatar:1,
            coverImage:1,
            email:1
        }
    }
 ])

  if (!channel?.length) {
    throw new ApiError(404,"channel does not exist")
 }

 return res.status(200).json(new ApiResponse(200,channel[0],"User channel  fetched successfully"))

})

const updateWatchHistory = asyncHandler(async(req,res)=>{
    const userId = req.user._id; // Assuming req.user._id contains the user's ID
    const videoId = req.body.videoId; // Assuming req.body.videoId contains the video ID
    
    // Validate the videoId
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid video ID'
      });
    }
    
    // Update the user's watch history
    User.findByIdAndUpdate(
      userId,
      { $addToSet: { watchHistory: videoId } },
      { new: true }
    )
    .then(updatedUser => {
      // Handle success - updatedUser contains the updated user document
      console.log("User's watch history updated:", updatedUser);
      // Send a response indicating success
      return res.status(200).json({
        success: true,
        message: 'Watch history updated successfully',
        user: updatedUser
      });
    })
    .catch(error => {
      // Handle error
      console.error("Error updating user's watch history:", error);
      // Send a response indicating failure
      return res.status(500).json({
        success: false,
        message: 'Failed to update watch history'
      });
    });
    
})

const getWatchHistory = asyncHandler(async(req,res)=>{

    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },{
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    console.log("Retrieved user:", user);

// Prepare the response
const response = new ApiResponse(
  200,
  user && user.length > 0 ? user[0].watchHistory : [],
  "Watch history fetched successfully"
);


// Send the response
return res.status(200).json(response);
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    updateWatchHistory,
    getWatchHistory
}