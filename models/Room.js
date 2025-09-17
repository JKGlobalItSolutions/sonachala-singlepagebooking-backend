const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    type: { type: String, required: true },
    totalRooms: { type: Number, required: true },
    pricePerNight: { type: Number, required: true },
    bedType: { type: String, required: true },
    perAdultPrice: { type: Number, required: true },
    perChildPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    taxPercentage: { type: Number, default: 18 }, // Tax percentage for this room type
    maxGuests: { type: Number, required: true },
    roomSize: { type: String },
    availability: { type: String, default: "Available" },
    image: { type: String }, // store file path / URL
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);
