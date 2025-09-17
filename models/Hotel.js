
const mongoose = require("mongoose");

const hotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    contact: { type: String, required: true },
    images: [{ type: String }], // Array of image paths

    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      unique: true, // ✅ one admin ku one hotel only
    }

  },
  { timestamps: true }
);

module.exports = mongoose.model("Hotel", hotelSchema);




