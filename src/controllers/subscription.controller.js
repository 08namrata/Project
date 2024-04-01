import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const userId = req.user.id; // Assuming user ID is available from request

    // Check if user already follows the channel
    const existingSubscription = await Subscription.findOne({ subscriber: userId, channel: channelId });

    if (existingSubscription) {
        // User is already following, so unfollow
        await Subscription.deleteOne({ _id: existingSubscription._id });
        res.json(new ApiResponse(200, true, "Unfollowed channel successfully"));
    } else {
        // User is not following, so follow
        const newSubscription = new Subscription({ subscriber: userId, channel: channelId });
        await newSubscription.save();
        res.json(new ApiResponse(200, true, "Followed channel successfully"));
    }
});

// Controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    // Validate channelId
    if (!isValidObjectId(channelId)) {
        return next(new ApiError(400, "Invalid channel ID"));
    }

    // Find subscriptions where following matches the channelId
    const subscribers = await Subscription.find({ channel: channelId }).populate('subscriber'); // Populate subscriber data

    // Extract subscriber data from subscriptions (no need for separate mapping)
    const subscriberData = subscribers.map((subscription) => {
        const subscriber = subscription.subscriber; // Assuming populated channel data
        return {
          // Extract specific user fields you need from the channel object
          subscriberId: subscriber._id,
          username: subscriber.username,
          // ... other relevant user data
        };
      });

    // Respond with subscriber data
    res.json(new ApiResponse(200, subscriberData, "Subscriber list retrieved"));
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
  
    // Validate subscriberId
  
    // Find subscriptions where subscriber matches the subscriberId
    const subscriptions = await Subscription.find({ subscriber: subscriberId }).populate('channel');
  
    // Handle empty subscriptions (optional)
    if (!subscriptions.length) {
      return res.json(new ApiResponse(200, true, "No channels subscribed to yet"));
    }
  
    // Extract and transform channel data (optional)
    const subscribedChannels = subscriptions.map((subscription) => {
      const channel = subscription.channel; // Assuming populated channel data
      return {
        // Extract specific user fields you need from the channel object
        channelId: channel._id,
        username: channel.username,
        // ... other relevant user data
      };
    });
  
    // Respond with subscribed channels data
    res.json(new ApiResponse(200, subscribedChannels, "Subscribed channels retrieved"));
  });

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
};