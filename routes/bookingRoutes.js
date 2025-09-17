const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');

// Create booking with file upload
router.post('/', upload.single("paymentProof"), bookingController.createBooking);

// Get all bookings (public endpoint - for system admin use only)
router.get('/', bookingController.getAllBookings);

// Get bookings for logged-in admin's hotel only (protected)
router.get('/my-hotel', protect, bookingController.getMyHotelBookings);

// Get revenue statistics for logged-in admin's hotel (protected)
router.get('/revenue', protect, bookingController.getRevenue);

// Get bookings by hotel ID
router.get('/hotel/:hotelId', bookingController.getBookingsByHotelId);

// Get a single booking by ID
router.get('/:id', bookingController.getBookingById);

// Update a booking by ID (protected - only for admin's own hotel bookings)
router.put('/:id', protect, bookingController.updateBooking);

// Delete a booking by ID (protected - only for admin's own hotel bookings)
router.delete('/:id', protect, bookingController.deleteBooking);

module.exports = router;
