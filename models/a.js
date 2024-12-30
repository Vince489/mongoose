const accountSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true, // Name of the account
    },
    balance: {
      type: Number,
      default: 0, // Initial balance
    },
    allocationType: {
      type: String, // Type of allocation (e.g., "privateSale", "marketing")
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  });
  
  module.exports = mongoose.model('Account', accountSchema);
  