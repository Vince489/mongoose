const mongoose = require('mongoose');

const vaultSchema = new mongoose.Schema({
  name: {
    type: String,
    default: 'System_Vault_220',
  },
  native: {
    type: String,
    default: 'VRT',
  },
  totalSupply: {
    type: Number,
    required: true,
    default: 1_000_000_000,
  },
  circulatingSupply: {
    type: Number,
    required: true,
    default: 0,
  },
  allocations: {
    privateSale: { amount: Number, cliff: Number, vestingPeriod: Number },
    preSale: { amount: Number, cliff: Number, vestingPeriod: Number },
    foundingTeam: { amount: Number, cliff: Number, vestingPeriod: Number },
    advisors: { amount: Number, cliff: Number, vestingPeriod: Number },
    partnerships: { amount: Number, cliff: Number, vestingPeriod: Number },
    ico: { amount: Number, cliff: Number, vestingPeriod: Number },
    communityIncentives: { amount: Number, cliff: Number, vestingPeriod: Number },
    marketing: { amount: Number, cliff: Number, vestingPeriod: Number },
    development: { amount: Number, cliff: Number, vestingPeriod: Number },
    reserve: { amount: Number, cliff: Number, vestingPeriod: Number },
  },
  startTimestamp: {
    type: Date,
    default: Date.now,
  },
  epoch: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });


module.exports = mongoose.model('Vault', vaultSchema);
