const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
        });
        const db = mongoose.connection;
        db.on('error', (error) => console.error('Database error:', error));
        db.once('open', () => console.log('Database connection successful.'));
        console.log('Connected to MongoDB.');
    } catch (error) {
        console.error('MongoDB connection failed:', error);
        process.exit(1); // Exit the process with failure
    }
};

module.exports = connectDB;