
const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

const adminRoutes = require("./routes/adminRoutes");
const hotelRoutes = require("./routes/hotelRoutes");
const roomRoutes = require("./routes/roomRoutes");
const bookingRoutes = require("./routes/bookingRoutes");






const cors = require("cors");

const path = require("path");

dotenv.config();
connectDB();

const app = express();






const allowedOrigins = [
  "http://localhost:8080", // customer frontend
  "http://localhost:5173", // admin frontend
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






app.use(express.json());


app.use(express.json());
app.use(express.urlencoded({ extended: true }));




app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/admin", adminRoutes);
app.use("/hotel", hotelRoutes);
app.use("/rooms", roomRoutes);
app.use("/bookings", bookingRoutes);






const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
