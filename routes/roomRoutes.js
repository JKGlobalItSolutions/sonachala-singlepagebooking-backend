const express = require("express");
const {
  createRoom,
  getMyRooms,
  updateRoom,
  deleteRoom,
  getRoomStats,
} = require("../controllers/roomController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// Create room with image upload
router.post("/create", protect, upload.single("image"), createRoom);

// Get my rooms
router.get("/my-rooms", protect, getMyRooms);

// Update room (later you can add upload.single("image") if want image update also)

// router.put("/update/:id", protect, updateRoom);
router.put("/update/:id", protect, upload.single("image"), updateRoom);


// Delete room
router.delete("/delete/:id", protect, deleteRoom);

// Get room stats
router.get("/room-stats", protect, getRoomStats);







// --------------



const { getRoomsByHotelId } = require("../controllers/roomController");

// ✅ Public route
router.get("/hotel/:hotelId", getRoomsByHotelId);





module.exports = router;
