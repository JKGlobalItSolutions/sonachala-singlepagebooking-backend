const Room = require("../models/Room");
const Hotel = require("../models/Hotel");
const Booking = require("../models/Booking");





const createRoom = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ admin: req.admin._id });
    if (!hotel) return res.status(400).json({ message: "Create a hotel first" });

    const room = await Room.create({
      ...req.body,
      hotel: hotel._id,
      image: req.file ? req.file.path : "", // This will be the Cloudinary URL
    });

    // Emit Socket.IO event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('roomCreated', { room, hotelId: hotel._id });
    }

    res.status(201).json({ message: "Room created", room });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};











// ✅ Get all Rooms of logged in Admin's Hotel
const getMyRooms = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ admin: req.admin._id });
    if (!hotel) return res.status(404).json({ message: "No hotel found" });

    const rooms = await Room.find({ hotel: hotel._id });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};












const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;

    const hotel = await Hotel.findOne({ admin: req.admin._id });
    if (!hotel) return res.status(404).json({ message: "No hotel found" });

    const updates = {};

    // Only update fields if they exist
    ["type", "totalRooms", "pricePerNight", "bedType", "perAdultPrice", "perChildPrice", "discount", "commission", "maxGuests", "roomSize", "availability"].forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = ["totalRooms","pricePerNight","perAdultPrice","perChildPrice","discount","commission","maxGuests"].includes(field)
          ? Number(req.body[field])
          : req.body[field];
      }
    });

    // Update image if a new file is uploaded
    if (req.file) {
      updates.image = req.file.path; // This will be the new Cloudinary URL
    }

    const room = await Room.findOneAndUpdate(
      { _id: id, hotel: hotel._id },
      updates,
      { new: true }
    );

    if (!room) return res.status(404).json({ message: "Room not found" });

    // Emit Socket.IO event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('roomUpdated', { room, hotelId: hotel._id });
    }

    res.json({ message: "Room updated successfully", room });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};







// ✅ Delete Room
const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;

    const hotel = await Hotel.findOne({ admin: req.admin._id });
    if (!hotel) return res.status(404).json({ message: "No hotel found" });

    const room = await Room.findOneAndDelete({ _id: id, hotel: hotel._id });
    if (!room) return res.status(404).json({ message: "Room not found" });

    // Emit Socket.IO event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('roomDeleted', { roomId: id, hotelId: hotel._id });
    }

    res.json({ message: "Room deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};










// ✅ Public: Get rooms by Hotel ID
const getRoomsByHotelId = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const rooms = await Room.find({ hotel: hotelId });

    // Get all bookings for the hotel
    const bookings = await Booking.find({ "bookingDetails.hotelId": hotelId });

    // Calculate room availability
    const now = new Date();
    const roomAvailability = {};

    // Initialize with total rooms
    rooms.forEach(room => {
      roomAvailability[room._id] = room.totalRooms;
    });

    // Subtract booked rooms
    bookings.forEach(booking => {
      if (booking.paymentDetails.paymentStatus === 'completed') {
        const checkIn = new Date(booking.bookingDetails.checkIn);
        const checkOut = new Date(booking.bookingDetails.checkOut);
        if (now >= checkIn && now < checkOut) {
          const roomId = booking.roomDetails.roomId.toString();
          if (roomAvailability[roomId]) {
            roomAvailability[roomId] -= booking.bookingDetails.numberOfRooms;
          }
        }
      }
    });

    // Add available count to each room object
    const roomsWithAvailability = rooms.map(room => ({
      ...room.toObject(),
      availableCount: roomAvailability[room._id] || 0,
    }));

    res.json(roomsWithAvailability);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Get Room Stats for Admin Dashboard
const getRoomStats = async (req, res) => {
  try {
    // Find the hotel for the logged-in admin
    const hotel = await Hotel.findOne({ admin: req.admin._id });
    if (!hotel) return res.status(404).json({ message: "Hotel not found" });

    // Get all rooms for that hotel
    const rooms = await Room.find({ hotel: hotel._id });

    // Get all bookings for that hotel
    const bookings = await Booking.find({ "bookingDetails.hotelId": hotel._id });

    // Group rooms by type and initialize stats
    const statsMap = new Map();
    rooms.forEach(room => {
      if (!statsMap.has(room.type)) {
        statsMap.set(room.type, { totalRooms: 0, booked: 0 });
      }
      statsMap.get(room.type).totalRooms += room.totalRooms;
    });

    // Calculate booked rooms for current bookings
    const now = new Date();
    bookings.forEach(booking => {
      // Only count completed bookings
      if (booking.paymentDetails.paymentStatus !== 'completed') return;

      // Check if the booking is currently active
      const checkIn = new Date(booking.bookingDetails.checkIn);
      const checkOut = new Date(booking.bookingDetails.checkOut);
      if (now >= checkIn && now < checkOut) {
        // Find the room type
        const room = rooms.find(r => r._id.toString() === booking.roomDetails.roomId.toString());
        if (room && statsMap.has(room.type)) {
          statsMap.get(room.type).booked += booking.bookingDetails.numberOfRooms;
        }
      }
    });

    // Prepare the response array
    const stats = Array.from(statsMap.entries()).map(([roomType, data]) => ({
      roomType,
      totalRooms: data.totalRooms,
      booked: data.booked,
      available: data.totalRooms - data.booked,
    }));

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};









module.exports = { createRoom, getMyRooms, updateRoom, deleteRoom, getRoomsByHotelId, getRoomStats };
