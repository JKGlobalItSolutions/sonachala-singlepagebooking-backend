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

// ✅ Allowed Origins List
const allowedOrigins = [
  process.env.ADMIN_URL,
  "http://www.apsresidency.com",
  "https://www.apsresidency.com",
  "http://apsresidency.com",
  "https://apsresidency.com",
  "https://jkglobalitsolutions.github.io",
  "http://localhost:5173", // for local testing
  "http://localhost:8080"  // optional if you test older builds
];

// ✅ CORS setup
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow Postman or internal
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.log("❌ Blocked by CORS:", origin);
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// ✅ Body parsing middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ✅ Serve static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Routes
app.use("/admin", adminRoutes);
app.use("/hotel", hotelRoutes);
app.use("/rooms", roomRoutes);
app.use("/bookings", bookingRoutes);

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

// ✅ Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
});

// ✅ Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

// ✅ Create HTTP server
const server = http.createServer(app);

// ✅ Initialize Socket.IO with the same CORS rules
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ✅ Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// ✅ Make io accessible to routes
app.set("io", io);

// ✅ Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
