import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary,deleteFromCloudinary,extractPublicId} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    
    const filter = {};
    if (query) {
        // Add a filter for searching by a specific query (e.g., video title or description)
        filter.$text = { $search: query };
    }
    if (userId) {
        // Add a filter for filtering videos by user ID
        filter.userId = userId;
    }

    // Construct a sort object for MongoDB based on sortBy and sortType parameters
    let sort = {};
    if (sortBy && sortType) {
        sort[sortBy] = sortType === 'desc' ? -1 : 1;
    }

    try {
        // Execute MongoDB query with pagination, sorting, and filtering
        const videos = await Video.find(filter)
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Return the response with the fetched videos
        res.status(200).json(new ApiError(200, "success "));
    } catch (error) {
        // Handle errors
        throw new ApiError(500, "Server error")
    }
})

const publishAVideo = asyncHandler(async (req, res) => {
    // TODO: get video, upload to cloudinary, create video
    const {videoFile, thumbnail, owner, title,description,duration } = req.body
    console.log("videoFile",videoFile,"thumbnail", thumbnail,"owner",owner,"title", title,"description", description,"duration",duration,"isPublished");

    if (
        [ title,description,duration].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
   
    let thumbnailLocalPath=req.files?.thumbnail?.[0]?.path;;
  

    if (!videoFileLocalPath) {
        throw new ApiError(400, "video file is required")
    }

    const video = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnailImage = await uploadOnCloudinary(thumbnailLocalPath)

    
    if (!video) {
        throw new ApiError(400, "video file is required")
    }
     
    if (!thumbnailImage) {
        throw new ApiError(400, "thumbnail file is required")
    }

    const videoUpload = await Video.create({
        owner: req.user._id,
        videoFile: video.url,
        thumbnail: thumbnailImage.url,
        title, 
        description,
        duration,
    })

    const createdvideo = await Video.findById(videoUpload._id)

    if (!createdvideo) {
        throw new ApiError(500, "Something went wrong while uploading the video")
    }

    return res.status(201).json(
        new ApiResponse(200, createdvideo, "video uploaded Successfully")
    )

})

const getVideoById = asyncHandler(async (req, res) => {

    //TODO: get video by id
    try {
        const videoId = req.params.videoId; 

        const video = await Video.findById(videoId);
        
        if (!video) {
            throw new ApiError(400, "video not found ")
        }
        
        res.json(video);
      } catch (error) {
        console.error(error);
        throw new ApiError(500, "server error ")
      }
})

const updateVideo = asyncHandler(async (req, res) => {
    const videoId = req.params.videoId;
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
      }
    //TODO: update video details like title, description, thumbnail
    const {title, description,duration} = req.body;


    if (title === "" || description === ""||duration === "") {
        throw new ApiError(400, "All fields are required")
    }
    const thumbnailLocalPath =  req.file?.path

    if(!thumbnailLocalPath){
      throw new ApiError(400,"thumbnail file is missing")
    }
     const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
  
     if(!thumbnail.url){
      throw new ApiError(400,"Eror while uploading thumbnail on cloudinary")
     }
    if (video.thumbnail) {
        // Extract the public ID from the cover image URL
        const publicId = extractPublicId(video.thumbnail);
        // Delete the image using the public ID
        await deleteFromCloudinary(publicId);
    }
    
    const videoUpdate = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                thumbnail:thumbnail.url,
                title:title,
                description:description,duration:duration,
            }
        },
        {new: true}
        
    )

    return res.status(200)
    .json(new ApiResponse(200, videoUpdate, "Video details updated successfully"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const videoId = req.params.videoId; 

    console.log(req.params.videoId);

    const video = await Video.findById(videoId);
    
    if (!video) {
        throw new ApiError(400, "video not found ")
    }
    //TODO: delete video
    if (video.thumbnail) {
        const imageDeleted = await deleteFromCloudinary(extractPublicId(video.thumbnail), 'image');
    }

    if (video.videoFile) {
        const videoDeleted = await deleteFromCloudinary(extractPublicId(video.videoFile), 'video');
    }

    await Video.findByIdAndDelete(videoId)

    return res.status(200)
    .json(new ApiResponse(200,"Video deleted successfully"))


  
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    
    try {
        // Find the video by its ID
        const video = await Video.findById(videoId);

        if (!video) {
            throw new ApiError(400, "video not found ")
        }

        // Toggle the publish status
        video.isPublished = !video.isPublished;

        // Save the updated video
        await video.save();

        // Return success response with the updated video
        res.status(200)
    .json(new ApiResponse(200,"Publish status updated successfully"))
;
    } catch (error) {
        // Handle errors
        throw new ApiError(500, "Something went wrong while registering the user")
    }
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}