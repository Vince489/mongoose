const mongoose = require('mongoose');
const Account = require('./models/account'); // Replace with the correct path to your Account model

/**
 * Function to release vested tokens for accounts with active vesting schedules.
 */
const releaseVestedTokens = async () => {
  const currentDate = new Date();

  try {
    console.log(`Starting vesting release process at ${currentDate}`);

    // Find all accounts with active vesting schedules
    const accounts = await Account.find({
      cliffEndDate: { $lte: currentDate }, // Cliff period has passed
      vestingEndDate: { $gte: currentDate }, // Vesting period is still ongoing
    });

    if (accounts.length === 0) {
      console.log('No accounts eligible for vesting at this time.');
      return;
    }

    for (const account of accounts) {
      const totalVestingDuration = account.vestingEndDate - account.cliffEndDate;
      const timeElapsed = currentDate - account.cliffEndDate;

      // Calculate vested tokens based on time elapsed
      const vestingRatio = Math.min(timeElapsed / totalVestingDuration, 1); // Cap at 100%
      const vestedTokens = Math.floor(account.totalAllocated * vestingRatio);

      // Determine the number of tokens to release
      const tokensToRelease = vestedTokens - account.tokensVested;

      if (tokensToRelease > 0) {
        // Update the account's balance and tokensVested
        account.balance += tokensToRelease;
        account.tokensVested += tokensToRelease;

        await account.save(); // Save updated account to the database

        console.log(`Released ${tokensToRelease} tokens to account ID: ${account._id}`);
      } else {
        console.log(`No new tokens to release for account ID: ${account._id}`);
      }
    }

    console.log('Vesting release process completed.');
  } catch (err) {
    console.error('Error during vesting release process:', err.message);
  }
};

module.exports = releaseVestedTokens;
