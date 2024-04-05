import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const {channelId} = req.params
console.log("channel",req.params);
  if(!channelId){
    throw new ApiError(400,"channel is missing")
  }
  const channelstatus = await Subscription.aggregate([
    {
        $match:{
        channel: new mongoose.Types.ObjectId(channelId),
    }
},
{
    $lookup:{
        from:"users",
        localField:"channel",
        foreignField:"_id",
        as: "totalSubscribers"
    }
},
    {
        $lookup:{
            from:"users",
            localField:"channel",
            foreignField:"_id",
            as: "totalSubscribers"
        }
    },
    {
        $lookup:{
            from:"likes",
            localField:"channel",
            foreignField:"likedBy",
            as: "totalLike"
        }
    },
    {
        $lookup:{
            from:"comments",
            localField:"channel",
            foreignField:"owner",
            as: "totalComments"
        }
    },
    {
        $lookup:{
            from:"videos",
            localField:"channel",
            foreignField:"owner",
            as: "totalVideos"
        }
    },
    {
        $lookup:{
            from:"playlists",
            localField:"channel",
            foreignField:"owner",
            as: "totalPlaylists"
        }
    },
    {
        $lookup:{
            from:"tweets",
            localField:"channel",
            foreignField:"owner",
            as: "totalTweets"
        }
    },
    {
        $addFields:{
            totalSubscribers:{
                $size:"$totalSubscribers"
            },
            totalLike:{
                $size:"$totalLike"
            },
            totalcomments:{
                $size:"$totalComments"
            },
            totalVideos:{
                $size:"$totalVideos"
            },
            totalPlaylists:{
                $size:"$totalPlaylists"
            },
            totalTweets:{
                $size:"$totalTweets"
            }
        }
    },
    {
        $project:{

            totalSubscribers: 1,
            totalLike:1,
            totalcomments:1,
            totalVideos:1,
            totalPlaylists:1,
            totalTweets:1
        }
    }
  ])

  console.log("Channel status:", channelstatus);
  if (!channelstatus?.length) {
    throw new ApiError(404,"channel does not exist")
 }

 return res.status(200).json(new ApiResponse(200,channelstatus[0],"User channel  fetched successfully"))

})
const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const {channelId} = req.params
console.log("channel",req.params);
  if(!channelId){
    throw new ApiError(400,"channel is missing")
  }
  const channelVideos = await Subscription.aggregate([
    {
        $match:{
        channel: new mongoose.Types.ObjectId(channelId),
    }
},
    {
        $lookup:{
            from:"videos",
            localField:"channel",
            foreignField:"owner",
            as: "totalVideos"
        }
    },{
        $unwind: "$totalVideos"
    },
    {
        $project:{
            title:"$totalVideos.title",
            description:"$totalVideos.description",
        }
    }
  ])

  console.log("Channel videos:", channelVideos);
  if (!channelVideos?.length) {
    throw new ApiError(404,"channel has not uploaded any videos")
 }

 return res.status(200).json(new ApiResponse(200,channelVideos,"Channel videos fetched successfully"))

})

export {
    getChannelStats, 
    getChannelVideos
    }