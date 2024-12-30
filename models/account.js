const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  balance: {
    type: Number,
    default: 0,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  accountType: {
    type: String,
    enum: ['user', 'holding'], // 'user' for user accounts, 'holding' for vault holding accounts
    required: true,
  },
  cliffEndDate: {
    type: Date, // Date when the cliff period ends
    validate: {
      validator: function (value) {
        return !this.vestingEndDate || value < this.vestingEndDate;
      },
      message: 'Cliff end date must be before the vesting end date.',
    },
  },
  vestingEndDate: {
    type: Date, // Date when the vesting period ends
    validate: {
      validator: function (value) {
        return !this.cliffEndDate || value > this.cliffEndDate;
      },
      message: 'Vesting end date must be after the cliff end date.',
    },
  },
  tokensVested: {
    type: Number, // Number of tokens vested
    default: 0,
  },
  totalAllocated: {
    type: Number, // Total number of tokens allocated
    default: 0,
  },
  allocationType: {
    type: String, // e.g., 'privateSale', 'preSale' (for holding accounts only)
    enum: [
      'privateSale',
      'preSale',
      'foundingTeam',
      'advisors',
      'partnerships',
      'ico',
      'communityIncentives',
      'marketing',
      'development',
      'reserve',
    ], // Optional: Validate known types
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Account', accountSchema);
