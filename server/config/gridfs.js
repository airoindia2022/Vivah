const multer = require('multer');
const mongoose = require('mongoose');

// Use Memory Storage and handle manual GridFS upload in controller
// to avoid bugs in multer-gridfs-storage v5 with newer MongoDB drivers
const storage = multer.memoryStorage();


const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max per image
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files (jpg, jpeg, png, webp) are allowed'), false);
        }
    },
});

module.exports = { upload };
