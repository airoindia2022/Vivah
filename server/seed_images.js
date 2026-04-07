const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI not found in .env');
    process.exit(1);
}

const imagesToSeed = [
    { name: 'miraj.jpeg', path: path.join(__dirname, '..', 'src', 'assets', 'miraj.jpeg') },
    { name: 'shahid.jpeg', path: path.join(__dirname, '..', 'src', 'assets', 'shahid.jpeg') },
    { name: 'shakeel.jpeg', path: path.join(__dirname, '..', 'src', 'assets', 'shakeel.jpeg') }
];

const seedImages = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const bucket = new mongoose.mongo.GridFSBucket(db, {
            bucketName: 'photos',
        });

        const urls = {};

        for (const img of imagesToSeed) {
            if (!fs.existsSync(img.path)) {
                console.error(`File not found: ${img.path}`);
                continue;
            }

            const filename = `${Date.now()}-${img.name}`;
            const uploadStream = bucket.openUploadStream(filename, {
                contentType: 'image/jpeg',
                metadata: {
                    originalName: img.name,
                    seeded: true
                }
            });

            const readStream = fs.createReadStream(img.path);
            
            await new Promise((resolve, reject) => {
                readStream.pipe(uploadStream)
                    .on('error', reject)
                    .on('finish', () => {
                        const fileId = uploadStream.id;
                        urls[img.name] = `/api/users/image/${fileId}`;
                        console.log(`Seeded ${img.name} -> /api/users/image/${fileId}`);
                        resolve();
                    });
            });
        }

        console.log('\n--- Image Links ---');
        console.log(JSON.stringify(urls, null, 2));
        console.log('-------------------\n');

        fs.writeFileSync(path.join(__dirname, 'seeded_links.json'), JSON.stringify(urls, null, 2));
        console.log('Links saved to seeded_links.json');

        mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error seeding images:', error);
        process.exit(1);
    }
};

seedImages();
