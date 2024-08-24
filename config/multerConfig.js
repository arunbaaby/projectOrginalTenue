//multerConfig.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, '../public/userImages');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const fileName = 'images-' + Date.now() + path.extname(file.originalname);
        cb(null, fileName);
    }
});

const upload = multer({ storage: storage });

module.exports = upload;