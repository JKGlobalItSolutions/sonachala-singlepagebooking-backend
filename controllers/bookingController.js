const Booking = require('../models/Booking');

// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    // Parse JSON strings from FormData
    const guestDetails = JSON.parse(req.body.guestDetails);
    const roomDetails = JSON.parse(req.body.roomDetails);
    const bookingDetails = JSON.parse(req.body.bookingDetails);
    const amountDetails = JSON.parse(req.body.amountDetails);
    const paymentDetails = JSON.parse(req.body.paymentDetails);
    const bookingMetadata = JSON.parse(req.body.bookingMetadata);

    // Handle payment proof image upload
    let paymentProofImageUrl = null;
    if (req.file) {
      paymentProofImageUrl = req.file.path; // This will be the Cloudinary URL
    }

    // Generate unique booking ID
    const generateBookingId = () => {
      return 'BK' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
    };

    // Generate unique confirmation ID
    const generateConfirmationId = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    // Create new booking
    const newBooking = new Booking({
      bookingId: generateBookingId(),
      confirmationId: generateConfirmationId(),
      guestDetails,
      roomDetails,
      bookingDetails,
      amountDetails,
      paymentDetails: {
        ...paymentDetails,
        paymentProofImageUrl,
      },
      bookingMetadata,
    });

    const savedBooking = await newBooking.save();

    // Send confirmation emails
    try {
      const { sendGuestConfirmationEmail, sendAdminNotificationEmail } = require('../utils/emailService');
      const Hotel = require('../models/Hotel');
      const Admin = require('../models/Admin');
      
      // Get admin email from hotel
      console.log('Looking for hotel with ID:', bookingDetails.hotelId);
      console.log('Hotel ID type:', typeof bookingDetails.hotelId);
      
      // Ensure hotelId is a valid ObjectId
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(bookingDetails.hotelId)) {
        console.error('Invalid hotel ID format:', bookingDetails.hotelId);
        throw new Error('Invalid hotel ID format');
      }
      
      const hotel = await Hotel.findById(bookingDetails.hotelId).populate('admin', 'email');
      const adminEmail = hotel?.admin?.email;
      
      console.log('Hotel found:', hotel);
      console.log('Admin email:', adminEmail);
      
      if (!hotel) {
        console.error('Hotel not found for ID:', bookingDetails.hotelId);
      }
      if (!adminEmail) {
        console.error('Admin email not found for hotel:', hotel);
      }
      
      // Send email to guest
      await sendGuestConfirmationEmail(savedBooking);
      
      // Send email to admin
      if (adminEmail) {
        await sendAdminNotificationEmail(savedBooking, adminEmail);
      } else {
        console.warn('Admin email not found, sending to fallback email');
        await sendAdminNotificationEmail(savedBooking, process.env.EMAIL_USER);
      }
      
      res.status(201).json({
        message: 'Booking created successfully',
        bookingId: savedBooking.bookingId,
        confirmationId: savedBooking.confirmationId,
        booking: savedBooking,
        emailSent: true
      });
    } catch (emailError) {
      console.error('Error sending confirmation emails:', emailError);
      // Still return success even if email fails
      res.status(201).json({
        message: 'Booking created successfully but email notification failed',
        bookingId: savedBooking.bookingId,
        confirmationId: savedBooking.confirmationId,
        booking: savedBooking,
        emailSent: false
      });
    }
  } catch (error) {
    console.error("Booking creation error:", error);
    
    // Check for specific error types
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Duplicate booking error',
        error: 'A booking with this information already exists'
      });
    }
    
    // Handle file upload errors
    if (error.message && error.message.includes('file')) {
      return res.status(400).json({
        message: 'File upload error',
        error: error.message
      });
    }
    
    // Generic error response
    res.status(500).json({ 
      message: 'Failed to create booking', 
      error: error.message || 'Internal server error'
    });
  }
};

// Get all bookings
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('roomDetails.roomId')
      .populate('bookingDetails.hotelId')
      .sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a single booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('roomDetails.roomId')
      .populate('bookingDetails.hotelId');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a booking by ID (only if it belongs to the admin's hotel)
exports.updateBooking = async (req, res) => {
  try {
    // First, find the admin's hotel
    const Hotel = require('../models/Hotel');
    const hotel = await Hotel.findOne({ admin: req.admin._id });
    
    if (!hotel) {
      return res.status(404).json({ message: 'No hotel found for this admin' });
    }

    // Find the booking and check if it belongs to this admin's hotel
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if the booking belongs to this admin's hotel
    if (booking.bookingDetails.hotelId.toString() !== hotel._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only update bookings for your own hotel.' });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id, 
      { ...req.body, updatedAt: Date.now() }, 
      { new: true }
    );
    
    res.status(200).json({
      message: 'Booking updated successfully',
      booking: updatedBooking
    });
  } catch (error) {
    res.status(400).json({ message: 'Server error', error: error.message });
  }
};

// Delete a booking by ID (only if it belongs to the admin's hotel)
exports.deleteBooking = async (req, res) => {
  try {
    // First, find the admin's hotel
    const Hotel = require('../models/Hotel');
    const hotel = await Hotel.findOne({ admin: req.admin._id });
    
    if (!hotel) {
      return res.status(404).json({ message: 'No hotel found for this admin' });
    }

    // Find the booking and check if it belongs to this admin's hotel
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if the booking belongs to this admin's hotel
    if (booking.bookingDetails.hotelId.toString() !== hotel._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only delete bookings for your own hotel.' });
    }

    const deletedBooking = await Booking.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get bookings by hotel ID
exports.getBookingsByHotelId = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const bookings = await Booking.find({ 'bookingDetails.hotelId': hotelId })
      .populate('roomDetails.roomId')
      .populate('bookingDetails.hotelId')
      .sort({ createdAt: -1 });
    
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get bookings for the logged-in admin's hotel only
exports.getMyHotelBookings = async (req, res) => {
  try {
    // First, find the admin's hotel
    const Hotel = require('../models/Hotel');
    const hotel = await Hotel.findOne({ admin: req.admin._id });
    
    if (!hotel) {
      return res.status(404).json({ message: 'No hotel found for this admin' });
    }

    // Build query
    const query = { 'bookingDetails.hotelId': hotel._id };
    
    // Add status filter if provided
    if (req.query.status === 'active') {
      const today = new Date();
      query['bookingDetails.checkOut'] = { $gte: today };
      query['paymentDetails.paymentStatus'] = { $in: ['completed', 'pending'] };
    }

    // Get bookings only for this admin's hotel
    let bookingsQuery = Booking.find(query)
      .populate('roomDetails.roomId')
      .populate('bookingDetails.hotelId')
      .sort({ createdAt: -1 });

    // Apply limit if provided
    if (req.query.limit) {
      bookingsQuery = bookingsQuery.limit(parseInt(req.query.limit));
    }

    const bookings = await bookingsQuery;
    
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get revenue statistics
exports.getRevenue = async (req, res) => {
  try {
    const Hotel = require('../models/Hotel');
    const hotel = await Hotel.findOne({ admin: req.admin._id });
    
    if (!hotel) {
      return res.status(404).json({ message: 'No hotel found for this admin' });
    }

    const { startDate, endDate } = req.query;
    
    // Build date range query
    const dateQuery = {
      'bookingDetails.hotelId': hotel._id,
      'paymentDetails.paymentStatus': 'completed'
    };

    if (startDate && endDate) {
      dateQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Aggregate to calculate total revenue
    const result = await Booking.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amountDetails.grandTotal' }
        }
      }
    ]);

    const totalRevenue = result.length > 0 ? result[0].totalRevenue : 0;

    res.status(200).json({
      totalRevenue,
      period: {
        startDate: startDate || null,
        endDate: endDate || null
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
