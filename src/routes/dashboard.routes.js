import { Router } from 'express';
import {
    getChannelStats,
    getChannelVideos,
} from "../controllers/dashboard.controller.js"
import verifyJWT from "../middlewares/auth.middleware.js"

const dashboardRouter = Router();

dashboardRouter.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

dashboardRouter.route("/status/:channelId").get(getChannelStats);
dashboardRouter.route("/videos/:channelId").get(getChannelVideos);

export default dashboardRouter