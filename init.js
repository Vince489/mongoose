require('dotenv').config();
const mongoose = require('mongoose');
const Vault = require('./models/vault');
const Account = require('./models/account');

async function initializeVault() {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log('Connected to Database');

    const existingVault = await Vault.findOne();
    if (existingVault) {
      console.log('Vault already initialized:', existingVault);
      mongoose.disconnect();
      return;
    }

    const allocations = {
      privateSale: { amount: 100_000_000, cliff: 6, vestingPeriod: 24 },
      preSale: { amount: 150_000_000, cliff: 3, vestingPeriod: 12 },
      foundingTeam: { amount: 150_000_000, cliff: 12, vestingPeriod: 36 },
      advisors: { amount: 50_000_000, cliff: 6, vestingPeriod: 24 },
      partnerships: { amount: 100_000_000, cliff: 12, vestingPeriod: 36 },
      ico: { amount: 200_000_000, cliff: 0, vestingPeriod: 0 },
      communityIncentives: { amount: 100_000_000, cliff: 0, vestingPeriod: 0 },
      marketing: { amount: 50_000_000, cliff: 0, vestingPeriod: 0 },
      development: { amount: 50_000_000, cliff: 0, vestingPeriod: 0 },
      reserve: { amount: 50_000_000, cliff: 0, vestingPeriod: 0 },
    };

    const vault = new Vault({
      totalSupply: 1_000_000_000,
      balance: 1_000_000_000,
      allocations,
    });

    await vault.save();
    console.log('Vault initialized:', vault);

    for (const [allocationType, details] of Object.entries(allocations)) {
      const holdingAccount = new Account({
        ownerId: vault._id,
        accountType: 'holding',
        balance: details.amount,
        allocationType,
      });

      await holdingAccount.save();
      console.log(`Holding account created for ${allocationType} with balance: ${details.amount}`);

      vault.balance -= details.amount;
      vault.circulatingSupply += details.amount;
    }

    await vault.save();
    console.log('Vault state updated:', vault);

    mongoose.disconnect();
  } catch (err) {
    console.error('Error initializing the vault:', err.message);
    mongoose.disconnect();
  }
}

initializeVault();
