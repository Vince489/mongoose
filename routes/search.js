const express = require('express');
const router = express.Router();
const Vault = require('../models/vault'); // Replace with your Vault model
const Account = require('../models/account'); // Replace with your Account model

// Search endpoint
router.get('/', async (req, res) => {
  const query = req.query.q; // Retrieve the search query from the request
  if (!query) {
    return res.status(400).json({ message: 'Search query is required' });
  }

  try {
    // Example: Search in both Vault and Account collections
    const vault = await Vault.findById(query);
    const account = await Account.findById(query);

    if (vault) {
      return res.json({ type: 'vault', data: vault });
    } else if (account) {
      return res.json({ type: 'account', data: account });
    } else {
      return res.status(404).json({ message: 'No results found' });
    }
  } catch (error) {
    console.error('Error performing search:', error.message);
    res.status(500).json({ message: 'Error performing search', error: error.message });
  }
});

module.exports = router;
