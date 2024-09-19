//The Google OAuth 2.0 Strategy (GoogleStrategy) allows users to sign in to your application using their Google account. Passport.js handles the process of interacting with Google's OAuth service, receiving user profile data, and authenticating the user based on that data.
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;//references the Strategy constructor from that package,
const User = require('../models/userModel');
const { name } = require('ejs');
const env = require('dotenv').config();
const { generateAccessToken } = require('../utils/generateAccessToken');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            console.log('profile object : ',profile);

            if (!profile.emails || profile.emails.length === 0) {
                return done(new Error('No email found'), null);
            }

            let user = await User.findOne({ googleId: profile.id });
            if (user) {
                const token = generateAccessToken(user._id);
                return done(null, { user, token });
            } else {
                user = new User({
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    googleId: profile.id
                })
                await user.save();
                const token = generateAccessToken(user._id);
                return done(null, { user, token });
            }
        } catch (error) {
            return done(error, null);
        }
    }
));

module.exports = passport;

//{ googleId: profile.id }: This is the query object. It's looking for a document where the googleId field matches the Google profile ID (profile.id), which is returned by Google during the OAuth authentication process.