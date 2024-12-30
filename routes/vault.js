// vault.js

const express = require('express');
const router = express.Router();
const Vault = require('../models/vault');
const Account = require('../models/account');
const Transaction = require('../models/transaction');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Helper function to handle purchases
const handlePurchase = async (req, res, allocationType, coinPrice) => {
  const { accountId, spendAmount } = req.body;

  if (!accountId || !spendAmount) {
    return res.status(400).json({ message: 'Account ID and spend amount are required' });
  }

  try {
    console.log(`Initiating purchase for accountId: ${accountId}, spendAmount: ${spendAmount}`);

    // Fetch the vault
    const vault = await Vault.findOne();
    if (!vault) {
      console.log('Vault not found');
      return res.status(404).json({ message: 'Vault not initialized' });
    }

    // Fetch the holding account
    const holdingAccount = await Account.findOne({
      allocationType,
      accountType: 'holding',
    });
    if (!holdingAccount || holdingAccount.balance <= 0) {
      return res.status(400).json({ message: `${allocationType} tokens are sold out` });
    }

    // Fetch the user account and populate ownerId
    const userAccount = await Account.findById(accountId).populate('ownerId');
    if (!userAccount || !userAccount.ownerId || !userAccount.ownerId.username) {
      return res.status(404).json({ message: 'User account or owner not found' });
    }

    const username = userAccount.ownerId.username;
    console.log(`Username retrieved: ${username}`);

    // Calculate fee and tokens
    const feePercentage = 0.04; // Stripe fee
    const fee = spendAmount * feePercentage;
    const netAmount = spendAmount - fee;
    const coinsToReceive = Math.floor(netAmount / coinPrice);

    if (coinsToReceive > holdingAccount.balance) {
      return res.status(400).json({ message: 'Not enough tokens available in the allocation' });
    }

    // Initialize vesting details
    const currentDate = new Date();
    const cliffDuration = 90 * 24 * 60 * 60 * 1000; // 90 days
    const vestingDuration = 365 * 24 * 60 * 60 * 1000; // 1 year
    userAccount.cliffEndDate = new Date(currentDate.getTime() + cliffDuration);
    userAccount.vestingEndDate = new Date(currentDate.getTime() + vestingDuration);
    userAccount.totalAllocated = coinsToReceive;
    userAccount.tokensVested = 0;

    // Save updated user account
    await userAccount.save();
    console.log('User account updated with vesting schedule:', userAccount);

    // Update holding account balance
    holdingAccount.balance -= coinsToReceive;
    await holdingAccount.save();
    console.log(`Updated holding account balance: ${holdingAccount.balance}`);

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Purchase VRT Tokens (${allocationType})`,
              description: `Buy ${coinsToReceive} VRT tokens at $${coinPrice} each`,
            },
            unit_amount: Math.round(spendAmount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: `${username}@virtron.mv`,
      success_url: `http://localhost:5202/accounts/success?session_id={CHECKOUT_SESSION_ID}&account_id=${accountId}&coins_received=${coinsToReceive}`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
    });

    res.status(200).json({ url: session.url });

    // Save the transaction
    const pendingTransaction = new Transaction({
      amount: coinsToReceive,
      type: 'purchase',
      from: holdingAccount._id,
      to: userAccount._id,
      description: `User initiated purchase of ${coinsToReceive} VRT via Stripe`,
      vaultId: vault._id,
    });
    await pendingTransaction.save();
    console.log('Pending transaction saved:', pendingTransaction);
  } catch (err) {
    console.error('Error during purchase:', err.message);
    res.status(500).json({ message: 'Failed to process purchase', error: err.message });
  }
};


// GET /vault - Retrieve vault details
router.get('/', async (req, res) => {
  try {
    const vault = await Vault.findOne();
    if (!vault) {
      return res.status(404).json({ message: 'Vault not found' });
    }
    res.status(200).json(vault);
  } catch (err) {
    console.error('Error fetching vault data:', err.message);
    res.status(500).json({ message: 'Failed to retrieve vault data', error: err.message });
  }
});


// Presale Route @ $0.0025 per coin
router.post('/presale', async (req, res) => {
  handlePurchase(req, res, 'preSale', 0.0025);
});

// Private Sale Route @ $0.005 per coin
router.post('/privateSale', async (req, res) => {
  handlePurchase(req, res, 'privateSale', 0.005);
});

module.exports = router;
