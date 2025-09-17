const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  // Unique Booking ID (internal)
  bookingId: { 
    type: String, 
    unique: true, 
    required: true,
    default: function() {
      return 'BK' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
    }
  },

  // Confirmation ID (user-facing)
  confirmationId: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      // Generate a shorter, more user-friendly confirmation ID
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }
  },

  // Guest Information
  guestDetails: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
  },

  // Room Information (reference to Room model)
  roomDetails: {
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    roomType: { type: String },
    pricePerNight: { type: Number },
    maxGuests: { type: Number },
    bedType: { type: String },
    roomSize: { type: String },
  },

  // Booking Specifics
  bookingDetails: {
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    numberOfRooms: { type: Number, required: true },
    numberOfAdults: { type: Number, required: true },
    numberOfChildren: { type: Number, default: 0 },
    numberOfNights: { type: Number, required: true },
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
  },

  // Amount Details
  amountDetails: {
    roomCharges: { type: Number, required: true },
    guestCharges: { type: Number, default: 0 },
    subtotal: { type: Number, required: true },
    taxesAndFees: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
  },

  // Payment Information
  paymentDetails: {
    paymentMethod: { type: String, required: true },
    paymentStatus: { 
      type: String, 
      default: 'pending', 
      enum: ['pending', 'completed', 'failed', 'cancelled'] 
    },
    transactionId: { type: String, unique: true, sparse: true },
    paymentDate: { type: Date, default: Date.now },
    paymentProofImageUrl: { type: String }, // URL of the uploaded image
  },

  // Metadata
  bookingMetadata: {
    bookingDate: { type: Date, default: Date.now },
    bookingSource: { type: String, default: 'web' },
    userAgent: { type: String },
    ipAddress: { type: String, default: 'unknown' },
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Booking', BookingSchema);
