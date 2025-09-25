// const multer = require("multer");
// const path = require("path");

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/rooms");
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });

// const upload = multer({ storage });
// module.exports = upload;




const multer = require("multer");
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require("path");

// Configure Cloudinary storage for rooms
const roomStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'hotel_rooms',
    format: async (req, file) => 'jpg', // supports promises as well
    public_id: (req, file) => Date.now() + '-' + file.originalname,
  },
});

// File filter to allow only images and PDFs
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images (JPEG, JPG, PNG, GIF) and PDF files are allowed!'));
  }
};

// Create upload middleware for rooms
const roomUpload = multer({ 
  storage: roomStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Configure Cloudinary storage for payment proofs
const paymentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'payment_proofs',
    format: async (req, file) => 'jpg',
    public_id: (req, file) => Date.now() + '-' + file.originalname,
  },
});

// Create upload middleware for payment proofs
const paymentUpload = multer({ 
  storage: paymentStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Default export for room uploads (backward compatibility)
const upload = roomUpload;

// Export both upload types
module.exports = upload;
module.exports.roomUpload = roomUpload;
module.exports.paymentUpload = paymentUpload;
