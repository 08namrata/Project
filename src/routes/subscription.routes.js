import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js"
import verifyJWT from "../middlewares/auth.middleware.js"

const subscriptionRouter = Router();
subscriptionRouter.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

subscriptionRouter.route("/channel/:subscriberId").get(getSubscribedChannels)
subscriptionRouter.route("/channel/:channelId").post(toggleSubscription);

subscriptionRouter.route("/user-channel-subscribers/:channelId").get(getUserChannelSubscribers);

export default subscriptionRouter