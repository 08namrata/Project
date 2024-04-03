import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    const userId = req.user._id; // Assuming you have authentication middleware that sets req.user

    // Check if the user has already liked the video
    const existingLike = await Like.findOne({ video: videoId, likedBy: userId });
console.log("existingLike:",existingLike);
    if (existingLike) {
        // If the user has already liked the video, remove the like
        await Like.deleteOne({ _id: existingLike._id });
        res.json(new ApiResponse(200, "Like removed successfully" ));
    } else {
        // If the user hasn't liked the video, create a new like
     const likedVideo = await Like.create({ video: videoId, likedBy: userId });
        res.json( new ApiResponse(200,{
            likedVideo
        },"Video liked Successfully"));
    }
   
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    const userId = req.user._id; 
    
    const existingComment = await Like.findOne({ comment:commentId , likedBy: userId });
console.log("existingcomment:",existingComment);
    if (existingComment) {
       
        await Like.deleteOne({ _id: existingComment._id });
        res.json(new ApiResponse(200, "Like removed successfully" ));
    } else {
        
     const likedComment = await Like.create({ comment: commentId, likedBy: userId });
        res.json( new ApiResponse(200,{
            likedComment
        },"Comment liked Successfully"));
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    const userId = req.user._id; 
    
    const existingTweet = await Like.findOne({ tweet:tweetId , likedBy: userId });
console.log("existingTweet:",existingTweet);
    if (existingTweet) {
       
        await Like.deleteOne({ _id: existingTweet._id });
        res.json(new ApiResponse(200, "Like removed successfully" ));
    } else {
        
     const likedTweet = await Like.create({ tweet:tweetId, likedBy: userId });
        res.json( new ApiResponse(200,{
            likedTweet
        },"Tweet liked Successfully"));
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id; // Assuming you have middleware that sets req.user

    try {
      // Find all likes for the current user
      const likes = await Like.find({ likedBy: userId })

  
      // Check if any likes were found
      if (!likes.length) {
        return res.json({ message: "No liked videos found" });
      }
  
      // Filter out likes without populated video (optional, if needed)
      const likesWithVideo = likes.filter(like => like.video);

  
      // Find all videos based on the extracted IDs (efficiency for many likes)
      const videos = await Like.find({ _id: { $in: likesWithVideo } }); // Find videos with IDs from likes
  
      res.json(videos); // Send the list of liked videos
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching liked videos" });
    }
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}