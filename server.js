require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cron = require('node-cron'); // Import node-cron for scheduling tasks
const releaseVestedTokens = require('./vesting'); // Import the vesting release logic

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.DB_URL);
const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.once('open', () => console.log('Connected to Database'));

// Middleware to parse JSON
app.use(express.json());

// Routes
const usersRouter = require('./routes/users');
const accountsRouter = require('./routes/accounts');
const vaultRouter = require('./routes/vault');
const transactionsRouter = require('./routes/transactions');
const searchRouter = require('./routes/search'); 

app.use('/users', usersRouter);
app.use('/accounts', accountsRouter);
app.use('/vault', vaultRouter);
app.use('/transactions', transactionsRouter);
app.use('/search', searchRouter);


// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Serve the HTML file as the default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Schedule the automated vesting release task
cron.schedule('0 0 * * *', async () => {
  console.log('Running automated vesting release at:', new Date());
  try {
    await releaseVestedTokens(); // Call the vesting release function
    console.log('Vesting release completed successfully');
  } catch (error) {
    console.error('Error during vesting release:', error.message);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
