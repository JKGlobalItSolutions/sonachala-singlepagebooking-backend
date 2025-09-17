const Hotel = require("../models/Hotel");
const fs = require('fs').promises;
const path = require('path');

// Create Hotel (only if admin has no hotel)
const createHotel = async (req, res) => {
  try {
    const existingHotel = await Hotel.findOne({ admin: req.admin._id });
    if (existingHotel) {
      // Delete uploaded files if hotel already exists
      if (req.files) {
        for (const file of req.files) {
          await fs.unlink(file.path);
        }
      }
      return res.status(400).json({ message: "You already created a hotel. Update instead." });
    }

    const { name, address, contact } = req.body;

    // Process uploaded images
    const imagePaths = req.files ? req.files.map(file => '/uploads/hotels/' + file.filename) : [];

    const hotel = await Hotel.create({
      name,
      address,
      contact,
      images: imagePaths,
      admin: req.admin._id,
    });

    res.status(201).json({ message: "Hotel created successfully", hotel });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};






// Get hotel by logged in admin
const getMyHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ admin: req.admin._id });
    if (!hotel) return res.status(404).json({ message: "No hotel found" });
    res.json(hotel);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update Hotel
const updateHotel = async (req, res) => {
  try {
    // Find existing hotel
    const existingHotel = await Hotel.findOne({ admin: req.admin._id });
    if (!existingHotel) {
      // Delete uploaded files if hotel doesn't exist
      if (req.files) {
        for (const file of req.files) {
          await fs.unlink(file.path);
        }
      }
      return res.status(404).json({ message: "No hotel found" });
    }

    // Determine kept images from body if provided
    // Frontend may send 'images' as JSON string of array or omit it
    let keptImages = existingHotel.images || [];
    if (typeof req.body.images === 'string') {
      try {
        const parsed = JSON.parse(req.body.images);
        if (Array.isArray(parsed)) {
          keptImages = parsed;
        }
      } catch (_) {
        // ignore parse errors; fall back to existing images
      }
    }

    // Compute removed images and delete from disk
    const removedImages = (existingHotel.images || []).filter(p => !keptImages.includes(p));
    for (const imgPath of removedImages) {
      const fullPath = path.join(__dirname, '..', imgPath);
      await fs.unlink(fullPath).catch(() => {});
    }

    // Append any newly uploaded files
    if (req.files && req.files.length > 0) {
      const newImagePaths = req.files.map(file => '/uploads/hotels/' + file.filename);
      keptImages = [...keptImages, ...newImagePaths];
    }

    // Prepare updatable fields
    const updatePayload = {
      name: req.body.name ?? existingHotel.name,
      address: req.body.address ?? existingHotel.address,
      contact: req.body.contact ?? existingHotel.contact,
      images: keptImages,
    };

    const hotel = await Hotel.findOneAndUpdate(
      { admin: req.admin._id },
      updatePayload,
      { new: true }
    );

    res.json({ message: "Hotel updated successfully", hotel });
  } catch (err) {
    // Clean up uploaded files in case of error
    if (req.files) {
      for (const file of req.files) {
        await fs.unlink(file.path).catch(console.error);
      }
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Delete Hotel
const deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ admin: req.admin._id });
    if (!hotel) return res.status(404).json({ message: "No hotel found" });

    // Delete associated image files
    if (hotel.images && hotel.images.length > 0) {
      for (const imagePath of hotel.images) {
        const fullPath = path.join(__dirname, '..', imagePath);
        await fs.unlink(fullPath).catch(console.error);
      }
    }

    // Delete hotel from database
    await Hotel.deleteOne({ _id: hotel._id });
    res.json({ message: "Hotel deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};





// ✅ Public: Get hotel by ID
const getHotelById = async (req, res) => {
  try {
    const { id } = req.params; // hotelId from URL
    const hotel = await Hotel.findById(id).populate("admin", "name email");
    if (!hotel) return res.status(404).json({ message: "Hotel not found" });
    res.json(hotel);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};








module.exports = { createHotel, getMyHotel, updateHotel, deleteHotel,getHotelById };
