const express = require('express');
const router = express.Router();
const Vault = require('../models/vault'); // Import Vault model
const Account = require('../models/account'); // Import Account model
const User = require('../models/user'); // Import User model
const Transaction = require('../models/transaction'); // Import Transaction model
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Import Stripe



// Create a new account for a user by their user ID
router.post('/create-account', async (req, res) => {
  const { userId } = req.body;

  // Validate input
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required to create an account' });
  }

  try {
    // Find the user by their ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the user already has an account
    const existingAccount = await Account.findOne({ ownerId: userId, accountType: 'user' });
    if (existingAccount) {
      return res.status(400).json({ message: 'User already has an account' });
    }

    // Create a new user account
    const newAccount = new Account({
      ownerId: user._id, // Associate the account with the user
      accountType: 'user', // Specify the type as a user account
    });

    // Save the account
    const savedAccount = await newAccount.save();

    // Respond with the newly created account
    res.status(201).json({
      message: 'Account created successfully',
      accountNumber: savedAccount._id, // Use the `_id` as the account number
      balance: savedAccount.balance,
      ownerId: savedAccount.ownerId,
      accountType: savedAccount.accountType,
      createdAt: savedAccount.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Fetch account details by user ID
router.get('/user-account/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // Find the account associated with the user
    const account = await Account.findOne({ userId }).populate('userId', 'username'); // Optionally populate the user details
    if (!account) {
      return res.status(404).json({ message: 'Account not found for this user' });
    }

    res.json(account);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Fetch all accounts (optional)
router.get('/', async (req, res) => {
  try {
    // Fetch accounts and populate 'userId' to include only the 'username' field
    const accounts = await Account.find().populate('ownerId', 'username');
    
    // Return the accounts as JSON
    res.status(200).json(accounts);
  } catch (err) {
    console.error('Error fetching accounts:', err.message);
    res.status(500).json({ message: 'Failed to fetch accounts', error: err.message });
  }
});

router.post('/buy', async (req, res) => {
  const { accountId, amount } = req.body; // Standardized to `amount`

  if (!accountId || !amount) {
    return res.status(400).json({ message: 'Account ID and amount are required' });
  }

  try {
    // Fetch the account from the database and populate the user details
    const account = await Account.findById(accountId).populate('userId'); // Populate the `userId` field
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Retrieve the username from the populated `userId`
    const userName = account.userId.username;
    if (!userName) {
      return res.status(400).json({ message: 'Associated user does not have a username' });
    }

    // Calculate the fee and net amount
    const feePercentage = 0.04; // 4% Stripe fee
    const fee = amount * feePercentage;
    const netAmount = amount - fee; // Amount left after the fee

    // Current coin price (can be dynamic in a real-world scenario)
    const coinPrice = 0.01; // $0.01 per coin

    // Calculate the number of coins the user will receive
    const coinsReceived = Math.floor(netAmount / coinPrice); // Round down to the nearest whole number

    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Buy Tokens',
              description: `Spend $${amount.toFixed(2)} for Tokens`,
            },
            unit_amount: Math.round(amount * 100), // Total spend amount in cents
          },
          quantity: 1, // Specify the number of items
        },
      ],
      mode: 'payment',
      customer_email: `${userName}@virtron.cc`, // Append the username to the domain
      success_url: `http://localhost:5202/accounts/success?session_id={CHECKOUT_SESSION_ID}&account_id=${accountId}&coins_received=${coinsReceived}`, // Include coins in URL
      cancel_url: `http://localhost:5202/cancel`,
    });

    res.status(200).json({ url: session.url }); // Send session URL to the client
  } catch (err) {
    res.status(500).json({ message: 'Failed to create checkout session', error: err.message });
  }
});

router.get('/success', async (req, res) => {
  const { session_id, account_id, coins_received } = req.query;

  if (!session_id || !account_id || !coins_received) {
    return res.status(400).json({ message: 'Missing session_id, account_id, or coins_received' });
  }

  try {
    // Verify Stripe payment
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (!session || session.payment_status !== 'paid') {
      return res.status(400).json({ message: 'Payment not verified' });
    }

    // Retrieve the vault and presale holding account
    const vault = await Vault.findOne();
    if (!vault) {
      return res.status(404).json({ message: 'Vault not initialized' });
    }

    const holdingAccount = await Account.findOne({
      allocationType: 'preSale',
      accountType: 'holding',
    });
    if (!holdingAccount) {
      return res.status(404).json({ message: 'Presale holding account not found' });
    }

    const userAccount = await Account.findById(account_id);
    if (!userAccount) {
      return res.status(404).json({ message: 'User account not found' });
    }

    const coins = parseInt(coins_received, 10);

    // Check if enough presale tokens are available
    if (holdingAccount.balance < coins) {
      return res.status(400).json({ message: 'Not enough presale tokens available' });
    }

    // Transfer tokens from holding account to user account
    holdingAccount.balance -= coins;
    userAccount.balance += coins;

    // Save updates to the accounts
    await holdingAccount.save();
    await userAccount.save();

    // Log the transaction
    const transaction = new Transaction({
      amount: coins,
      type: 'purchase',
      from: holdingAccount._id,
      to: userAccount._id,
      description: `Purchased ${coins} VRT tokens via Stripe`,
      vaultId: vault._id,
    });

    await transaction.save();

    res.status(200).json({
      message: `Successfully purchased ${coins} VRT tokens`,
      userAccountBalance: userAccount.balance,
      holdingAccountBalance: holdingAccount.balance,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to process purchase', error: err.message });
  }
});

router.post('/airdrop', async (req, res) => {
  const { accountId } = req.body;

  if (!accountId) {
    return res.status(400).json({ message: 'Account ID is required for the airdrop' });
  }

  try {
    // Fetch the account and user details
    const account = await Account.findById(accountId).populate('userId');
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const userName = account.userId.username;

    // Define the airdrop amount (free coins)
    const airdropAmount = 100;

    // Create a Stripe Checkout Session with a $0 payment
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'], // Not charged for $0 but required for Checkout
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: '100 Free Coins Airdrop',
              description: 'Enjoy 100 free coins on us!',
            },
            unit_amount: 0, // $0 amount
          },
          quantity: 1,
        },
      ],
      mode: 'payment', // Still required even for $0
      customer_email: `${userName}@virtron.cc`, // Use username to create a mock email
      success_url: `http://localhost:5202/accounts/success?session_id={CHECKOUT_SESSION_ID}&account_id=${accountId}&coins_received=100`,
      cancel_url: `http://localhost:5202/cancel`,
    });

    // Respond with the Stripe session URL
    res.status(200).json({
      message: `Airdrop session created for account ${accountId}`,
      sessionUrl: session.url, // Redirect user to this URL
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to process airdrop', error: err.message });
  }
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const payload = req.body;
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`⚠️ Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Extract account ID from the success_url query string
    const accountId = new URL(session.success_url).searchParams.get('account_id');

    try {
      // Fetch the account and update the balance
      const account = await Account.findById(accountId);
      if (account) {
        const airdropAmount = 100; // Coins to airdrop
        account.balance += airdropAmount;
        await account.save();

        console.log(`✅ Airdropped ${airdropAmount} coins to account ${accountId}`);
      }
    } catch (err) {
      console.error(`❌ Failed to update account balance: ${err.message}`);
    }
  }

  res.status(200).send('Event received');
});

module.exports = router;
