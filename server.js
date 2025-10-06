
const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

const adminRoutes = require("./routes/adminRoutes");
const hotelRoutes = require("./routes/hotelRoutes");
const roomRoutes = require("./routes/roomRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const http = require("http");
const socketIo = require("socket.io");






const cors = require("cors");

const path = require("path");

dotenv.config();
connectDB();

const app = express();






// const allowedOrigins = [
//   "http://localhost:8080", // customer frontend
//   "http://localhost:5173", // admin frontend
// ];




const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
];


app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);






// Body parsing middleware with increased limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));




app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/admin", adminRoutes);
app.use("/hotel", hotelRoutes);
app.use("/rooms", roomRoutes);
app.use("/bookings", bookingRoutes);






// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:8080", "http://localhost:5173"],
    methods: ["GET", "POST"]
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
