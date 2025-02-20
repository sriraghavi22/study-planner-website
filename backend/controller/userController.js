const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import User model

// Signup Controller
const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'Email already registered.' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();
        
        const token = jwt.sign({ id: newUser._id, email: newUser.email }, process.env.JWT_SECRET, {
            expiresIn: '15m',
        });

        const refreshToken = jwt.sign({ id: newUser._id, email: newUser.email }, process.env.JWT_SECRET, {
            expiresIn: '7d', // Longer expiration
        });

        newUser.refreshToken = refreshToken;
        await newUser.save();
        
        res.status(201).json({ 
            message: 'User registered successfully.', 
            accessToken: token, 
            refreshToken 
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

// Login Controller
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Compare passwords
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password.' });
        }

        // Generate JWT
        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
            expiresIn: '15m',
        });
        const refreshToken = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
            expiresIn: '7d', // Longer expiration
        });
        user.refreshToken = refreshToken;
        await user.save();

        // Include user details in the response
        res.status(200).json({ 
            message: 'Login successful.', 
            accessToken: token, 
            refreshToken,
            user: {
                _id: user._id,
                email: user.email,
                name: user.name, // Assuming "name" exists in your User model
            },
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

const refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            console.error('No refresh token provided');
            return res.status(400).json({ message: 'Refresh token is required.' });
        }

        console.log("Received refresh token request:", refreshToken);

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        console.log('Decoded refresh token:', decoded);

        const user = await User.findOne({ _id: decoded.id, refreshToken });
        if (!user) {
            console.error('Invalid refresh token or user not found.');
            return res.status(403).json({ message: 'Invalid refresh token.' });
        }

        // Generate new access token
        const accessToken = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
            expiresIn: '15m', // Short-lived
        });

        res.status(200).json({ accessToken });
    } catch (error) {
        console.error('Error in refresh controller:', error.message);
        res.status(403).json({ message: 'Invalid or expired refresh token.', error: error.message });
    }
};

module.exports = { signup, login, refresh };
