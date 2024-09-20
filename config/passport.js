const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userModel');
const env = require('dotenv').config();
const { generateAccessToken } = require('../utils/generateAccessToken');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            console.log('profile object : ', profile);

            if (!profile.emails || profile.emails.length === 0) {
                return done(new Error('No email found'), null);
            }

            // First, check if the user exists by googleId
            let user = await User.findOne({ googleId: profile.id });

            if (user) {
                // If the user exists with googleId, generate the access token
                const token = generateAccessToken(user._id);
                return done(null, { user, token });
            } 

            // If no user is found with googleId, check by email
            user = await User.findOne({ email: profile.emails[0].value });

            if (user) {
                // If user exists but doesn't have a googleId, update it
                if (!user.googleId) {
                    user.googleId = profile.id;
                    await user.save();
                }

                // Generate token and return the existing user
                const token = generateAccessToken(user._id);
                return done(null, { user, token });
                
            } 

            // If no user exists, create a new user (without saving the profile picture)
            user = new User({
                name: profile.displayName,
                email: profile.emails[0].value,
                googleId: profile.id
            });

            await user.save();
            const token = generateAccessToken(user._id);
            return done(null, { user, token });

        } catch (error) {
            return done(error, null);
        }
    }
));

module.exports = passport;
