const multer = require('multer');
const path = require('path');

// Set storage destination and filename
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Filter file types (optional)
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed (.jpg, .jpeg, .png)'), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
