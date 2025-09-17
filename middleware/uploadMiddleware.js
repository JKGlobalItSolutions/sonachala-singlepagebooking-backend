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
const path = require("path");
const fs = require("fs");

// Storage configuration for different file types
const createStorage = (uploadPath) => {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      const dir = path.join(__dirname, `../uploads/${uploadPath}`);
      // ensure folder exists
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  });
};

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
  storage: createStorage('rooms'),
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Create upload middleware for payment proofs
const paymentUpload = multer({ 
  storage: createStorage('payment-proofs'),
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Default export for room uploads (backward compatibility)
const upload = roomUpload;

// Export both upload types
module.exports = upload;
module.exports.roomUpload = roomUpload;
module.exports.paymentUpload = paymentUpload;
