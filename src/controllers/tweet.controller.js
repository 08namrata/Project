import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {owner,content} = req.body;
    console.log("content:",content);
    console.log("owner:", owner);

    if(content === ""){
        throw new ApiError(400, "content is required");
    }

    const tweet = await Tweet.create({
        owner: req.user._id,
        content
    })

    const createdTweet = await Tweet.findById(tweet._id);
    if (!createdTweet) {
      throw new ApiError(500, "Something went wrong while tweeting");
    }
  
    return res.status(201).json(
      new ApiResponse(200, createdTweet, "Tweeted Successfully")
    );


})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    try {
        const ownerId = req.params.ownerId; 
      
        const tweet = await Tweet.find({ owner: ownerId });

        if (tweet.length === 0) {
          return res.status(404).json({ message: 'No tweets found for this user' });
        }
    
        if (!tweet) {
          return res.status(404).json({ message: 'tweet not found' });
        }
        
        res.json(tweet);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
      }
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    try {
        const tweetId = req.params.tweetId;
        const updateData = req.body; // Access update data from request body
    
        const updatedTweet = await Tweet.findByIdAndUpdate(tweetId, updateData, {
          new: true, 
        });
    
        if (!updatedTweet) {
          return res.status(404).json({ message: 'Tweet not found' });
        }
    
        res.json(updatedTweet);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
      }
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    try {
        const tweetId = req.params.tweetId;
    
        const deletedTweet = await Tweet.findByIdAndDelete(tweetId);
    
        if (!deletedTweet) {
          return res.status(404).json({ message: 'Tweet not found' });
        }
    
        res.json({ message: 'Tweet deleted successfully' });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
      }
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}