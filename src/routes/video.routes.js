import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
} from "../controllers/video.controller.js"
import verifyJWT from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"

const videoRouter = Router();
videoRouter.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

videoRouter.route("/").get(getAllVideos)
videoRouter.route("/video").post(
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
            
        ]),
        publishAVideo
    );

videoRouter.route("/:videoId").get(getVideoById)
videoRouter.route("/delete-video/:videoId").delete(deleteVideo)
videoRouter.route("/update-video/:videoId").patch(upload.single("thumbnail"), updateVideo);

videoRouter.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default videoRouter