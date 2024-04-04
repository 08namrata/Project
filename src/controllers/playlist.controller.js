import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"

const createPlaylist = asyncHandler(async (req, res) => {
 
    //TODO: create playlist
    const { name, description, videoIds } = req.body;

    console.log("body:", req.body);

    const userId = req.user._id; // Assuming you have middleware that sets req.user

    try {
        // Split the comma-separated string of videoIds into an array of individual video IDs
        const videoIdsArray = videoIds.split(',');

        // Cast each video ID to ObjectId using mongoose.Types.ObjectId()
        const videoObjectIds = videoIdsArray.map(videoId => new mongoose.Types.ObjectId(videoId.trim()));

        // Check if all video IDs exist
        const validVideos = await Video.find({ _id: { $in: videoObjectIds } });

        if (validVideos.length !== videoIdsArray.length) {
            return res.status(400).json({ message: "Invalid video IDs provided" });
        }

        // Create a new playlist document
        const playlist = await Playlist.create({
            name,
            description,
            owner: userId,
            videos: videoObjectIds, // Add video IDs to the playlist
        });

        res.json(playlist); // Send the created playlist in the response
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating playlist" });
    }
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const userId = req.user._id
    console.log("req.user:",req.user);
    //TODO: get user playlists
    try {
        
        const playlists = await Playlist.find({owner: userId})

        res.json(playlists);
        
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching playlist videos" });
      }
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    console.log(req.params);
    //TODO: get user playlists
    try {
        // Find all likes for the current user
        const playlists = await Playlist.find({_id: playlistId})

        res.json(playlists); // Send the list of liked videos
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching Playlist " });
      }

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    
    const {playlistId} = req.params
    const {videoId} = req.params
    console.log(videoId);
    try {
      // 1. Find the playlist document
      const playlist = await Playlist.findOne({_id: playlistId});

      console.log(playlist);
  
      // 2. Check if playlist exists
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }try {
        
      } catch (error) {
        console.error(error);
      }
  
      // 3. Check if video ID already exists in the playlist (optional)
      if (playlist.videos.includes(videoId)) {
        return res.status(400).json({ message: "Video already exists in playlist" });
      }
  
      // 4. Update the playlist by adding the video ID
      playlist.videos.push(videoId);
      await playlist.save();
  
      // 5. Send success response
      res.json({ message: "Video added to playlist successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error adding video to playlist" });
    }

 
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    
    const {playlistId} = req.params
    const {videoId} = req.params
    console.log(videoId);
    try {
      
      const playlist = await Playlist.findOne({_id: playlistId});

      console.log(playlist);
  
      
      if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
      }try {
        
      } catch (error) {
        console.error(error);
      }
  
    
      if (!playlist.videos.includes(videoId)) {
        return res.status(400).json({ message: "Video does not exists in playlist" });
      }
  
      
      playlist.videos.splice(videoId,1);
      await playlist.save();
  
      
      res.json({ message: "Video removed from playlist successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error removing video from playlist" });
    }


})

const deletePlaylist = asyncHandler(async (req, res) => {
    
    // TODO: delete playlist
    try {
      
      const {playlistId} = req.params
  
      const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);
  
      if (!deletedPlaylist) {
        return res.status(404).json({ message: 'Playlist not found' });
      }
  
      res.json({ message: 'Playlist deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
    }
})

const updatePlaylist = asyncHandler(async (req, res) => {
   
    //TODO: update playlist
    try {
      const {playlistId} = req.params
      const updateData = req.body; // Access update data from request body
  
      const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId, updateData, {
        new: true, 
      });
  
      if (!updatedPlaylist) {
        return res.status(404).json({ message: 'Playlist not found' });
      }
  
      res.json(updatedPlaylist);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
    }
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}