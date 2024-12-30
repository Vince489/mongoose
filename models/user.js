const mongoose = require('mongoose');

// Define the schema
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true, // Ensures usernames are unique
    trim: true, // Removes whitespace from the start and end
    minlength: 3, // Minimum length requirement
    maxlength: 50, // Maximum length requirement
  },
  password: {
    type: String,
    required: true,
    minlength: 6, // Enforces a minimum password length
    maxlength: 1024, // Enforces a maximum password length
  },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
});

// Compile the schema into a model
const User = mongoose.model('User', UserSchema);

module.exports = User;
