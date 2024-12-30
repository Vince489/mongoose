const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  type: {
    type: String, // e.g., 'purchase', 'airdrop', 'transfer'
    required: true,
  },
  from: {
    type: mongoose.Schema.Types.ObjectId, // Sender account or vault
    ref: 'Account',
  },
  to: {
    type: mongoose.Schema.Types.ObjectId, // Recipient account
    ref: 'Account',
  },
  description: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  vaultId: {
    type: mongoose.Schema.Types.ObjectId, // Reference to the Vault
    ref: 'Vault',
  },
});

module.exports = mongoose.model('Transaction', transactionSchema);
