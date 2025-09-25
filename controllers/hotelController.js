const Hotel = require("../models/Hotel");
const cloudinary = require('../config/cloudinary');

// Helper function to extract public_id from Cloudinary URL
const getPublicId = (url) => {
  const parts = url.split('/');
  const publicIdWithExtension = parts.slice(parts.indexOf('upload') + 2).join('/');
  return publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf('.'));
};

// Create Hotel (only if admin has no hotel)
const createHotel = async (req, res) => {
  try {
    const existingHotel = await Hotel.findOne({ admin: req.admin._id });
    if (existingHotel) {
      return res.status(400).json({ message: "You already created a hotel. Update instead." });
    }

    const { name, address, contact } = req.body;

    // Process uploaded images from Cloudinary
    const imagePaths = req.files ? req.files.map(file => file.path) : [];

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
      return res.status(404).json({ message: "No hotel found" });
    }

    // Determine kept images from body if provided
    let keptImages = existingHotel.images || [];
    if (typeof req.body.images === 'string') {
      try {
        const parsed = JSON.parse(req.body.images);
        if (Array.isArray(parsed)) {
          keptImages = parsed;
        }
      } catch (_) {
        // ignore parse errors
      }
    } else if (Array.isArray(req.body.images)) {
      keptImages = req.body.images;
    }

    // Compute removed images and delete from Cloudinary
    const removedImages = (existingHotel.images || []).filter(p => !keptImages.includes(p));
    if (removedImages.length > 0) {
      const publicIds = removedImages.map(getPublicId);
      await cloudinary.api.delete_resources(publicIds);
    }

    // Append any newly uploaded files from Cloudinary
    if (req.files && req.files.length > 0) {
      const newImagePaths = req.files.map(file => file.path);
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
    // No need to clean up local files as they are not stored
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Delete Hotel
const deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ admin: req.admin._id });
    if (!hotel) return res.status(404).json({ message: "No hotel found" });

    // Delete associated images from Cloudinary
    if (hotel.images && hotel.images.length > 0) {
      const publicIds = hotel.images.map(getPublicId);
      await cloudinary.api.delete_resources(publicIds);
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
