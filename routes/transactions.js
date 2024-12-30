const express = require('express');
const router = express.Router();
const User = require('../models/user'); // Import your User model
const Transaction = require('../models/transaction'); // Import your Transaction model

router.get('/', async (req, res) => {
  try {
    // Fetch all transactions and populate 'from' and 'to' with account details
    const transactions = await Transaction.find()
      .populate('from', 'accountType balance') // Populate 'from' with account details
      .populate('to', 'accountType balance'); // Populate 'to' with account details

    res.status(200).json(transactions);
  } catch (err) {
    console.error('Error fetching transactions:', err.message);
    res.status(500).json({ message: 'Failed to fetch transactions', error: err.message });
  }
});



// Getting one transaction by ID
router.get('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Getting all transactions for a specific user
router.get('/user/:username', async (req, res) => {
    try {
        const transactions = await Transaction.find({ sender: req.params.username });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Transfer money between two users
router.post('/transfer', async (req, res) => {
  const { sender, receiver, amount } = req.body;

  // Validate input
  if (!sender || !receiver || !amount) {
    return res.status(400).json({ message: 'Sender, receiver, and amount are required' });
  }

  // Check if sender and receiver exist
  const senderExists = await User.findOne({ username: sender });
  const receiverExists = await User.findOne({ username: receiver });
  if (!senderExists || !receiverExists) {
    return res.status(400).json({ message: 'Sender or receiver does not exist' });
  }

  // Check if sender has enough balance
  if (senderExists.balance < amount) {
    return res.status(400).json({ message: 'Insufficient balance' });
  }

  // Update sender's balance
  senderExists.balance -= amount;
  await senderExists.save();

  // Update receiver's balance
  receiverExists.balance += amount;
  await receiverExists.save();

  const transaction = new Transaction({ sender, receiver, amount });

  try {
    const newTransaction = await transaction.save();
    res.status(201).json(newTransaction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
