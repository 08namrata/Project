import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params.videoId
    const {page = 1, limit = 10} = req.query

    const filter = {};
    if (videoId) {
        // Add a filter for filtering videos by user ID
        filter.videoId = videoId;
    }
    try {
        // Execute MongoDB query with pagination, sorting, and filtering
        const comments = await Comment.find(filter)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Return the response with the fetched videos
        res.status(200).json ( new ApiResponse(200,comments, "success "));
    } catch (error) {
        // Handle errors
        throw new ApiError(500, "Server error")
    }
})


const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const videoId = req.params.videoId

    if (!videoId) {
        throw new ApiError(400,"Id is missing")
    }
    const {content,video,owner} = req.body

    console.log('content:',content);

    if(content === ""){
        throw new ApiError(400,"content is required")
    }

    const comment = await Comment.create({
        owner: req.user._id,
        video: req.params.videoId,
        content
    })

    const writtenComment = await Comment.findById(comment._id)

    if (!writtenComment) {
        throw new ApiError(500, "Something went wrong while uploading the comment")
    }

    return res.status(201).json(
        new ApiResponse(200, writtenComment, "comment uploaded Successfully")
    )

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
try {
       const  commentId=req.params.commentId
       const  updateData = req.body;
    
       const updatedComment = await Comment.findByIdAndUpdate(commentId, updateData, {
        new: true, 
      });
    
      if (!updatedComment) {
        return res.status(404).json({ message: 'comment not found' });
      }
    
      res.json(updatedComment);
    
} catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
}
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    try {
        const commentId = req.params.commentId;
    
        const deletedComment = await Comment.findByIdAndDelete(commentId);
    
        if (!deletedComment) {
          return res.status(404).json({ message: 'Comment not found' });
        }
    
        res.json({ message: 'Comment deleted successfully' });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
      }
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }