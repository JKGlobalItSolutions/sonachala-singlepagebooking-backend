const express = require("express");
const { createHotel, getMyHotel, updateHotel, deleteHotel } = require("../controllers/hotelController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/hotelUpload");

const { getHotelById } = require("../controllers/hotelController");



// ----------

const router = express.Router();

router.post("/create", protect, upload.array('images', 10), createHotel);
router.get("/my-hotel", protect, getMyHotel);
router.put("/update", protect, upload.array('images', 10), updateHotel);
router.delete("/delete", protect, deleteHotel);





// ✅ Public route
router.get("/:id", getHotelById);




module.exports = router;





