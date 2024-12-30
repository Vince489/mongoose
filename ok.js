const { ec: EC } = require('elliptic');

class KeyPairGenerator {
    constructor() {
        this.ec = new EC('secp256k1'); // Using secp256k1 elliptic curve for smaller keys
    }

    // Generate a new key pair
    generateKeyPair() {
        const key = this.ec.genKeyPair();
        const publicKey = key.getPublic('hex');
        const privateKey = key.getPrivate('hex');
        return { publicKey, privateKey };
    }
}

class NativeCoinWallet {
    constructor() {
        this.totalSupply = BigInt(1_000_000_000) * BigInt(10 ** 8); // 1 billion native coins in vinnies
        this.balances = new Map(); // Mapping of addresses to balances
        this.coinPrice = 0.01; // Price per native coin in USD
        this.vinniesPerCoin = BigInt(10 ** 8); // Number of vinnies per coin
    }

    // Initialize an account with the total supply
    initializeAccount(address) {
        this.balances.set(address, this.totalSupply);
    }

    // Get the balance of a specific address
    balanceOf(address) {
        const balance = this.balances.get(address) || BigInt(0);
        return this.formatBalance(balance);
    }

    // Format balance to human-readable coins
    formatBalance(balance) {
        const integerPart = balance / this.vinniesPerCoin;
        const fractionalPart = balance % this.vinniesPerCoin;
        return `${integerPart}.${fractionalPart.toString().padStart(8, '0')}`;
    }

    // Mock payment processor to simulate credit card payment
    async processPayment(creditCardInfo, amountInUsd) {
        const { cardNumber, expiryDate, cvv } = creditCardInfo;

        // Validate credit card details (simple simulation)
        if (!cardNumber || !expiryDate || !cvv) {
            throw new Error("Invalid credit card details");
        }
        if (cardNumber.length !== 16 || cvv.length !== 3) {
            throw new Error("Credit card details are incorrect");
        }

        console.log(`Processing payment of $${amountInUsd.toFixed(2)}...`);
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate network delay
        console.log("Payment successful!");
        return true; // Payment approved
    }

    // Purchase coins using credit card
    async purchaseCoins(address, usdAmount, creditCardInfo) {
        const coinsToPurchase = Math.floor(usdAmount / this.coinPrice);
        const scaledCoins = BigInt(coinsToPurchase) * this.vinniesPerCoin;

        if (scaledCoins > this.totalSupply) {
            throw new Error("Not enough supply available for purchase.");
        }

        // Process the payment
        await this.processPayment(creditCardInfo, usdAmount);

        // Deduct from total supply and add to user's balance
        this.totalSupply -= scaledCoins;
        this.balances.set(address, (this.balances.get(address) || BigInt(0)) + scaledCoins);

        console.log(`Successfully purchased ${coinsToPurchase} coins for $${usdAmount.toFixed(2)}`);
    }

    // Transfer coins from one address to another
    transfer(from, to, amount) {
        const scaledAmount = BigInt(Math.round(amount * Number(this.vinniesPerCoin))); // Handle decimals for coins
        const senderBalance = this.balances.get(from) || BigInt(0);

        if (senderBalance < scaledAmount) {
            throw new Error("Insufficient balance");
        }

        // Deduct from sender and add to recipient
        this.balances.set(from, senderBalance - scaledAmount);
        this.balances.set(to, (this.balances.get(to) || BigInt(0)) + scaledAmount);
    }
}

module.exports = { KeyPairGenerator, NativeCoinWallet };