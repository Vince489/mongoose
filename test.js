const { KeyPairGenerator, NativeCoinWallet } = require("./ok");

const keyGen = new KeyPairGenerator();
const { publicKey: creatorPublicKey } = keyGen.generateKeyPair();
console.log("Creator Public Key:", creatorPublicKey);

const wallet = new NativeCoinWallet();
wallet.initializeAccount(creatorPublicKey); // Initialize with 1 billion native coins

console.log("Initial Wallet Balance:", wallet.balanceOf(creatorPublicKey)); // Should print 1 billion

const { publicKey: userPublicKey } = keyGen.generateKeyPair();
console.log("User Public Key:", userPublicKey);

// Simulate a user purchasing coins with credit card details
(async () => {
    const creditCardInfo = {
        cardNumber: "1234567812345678",
        expiryDate: "12/28",
        cvv: "123",
    };

    try {
        await wallet.purchaseCoins(userPublicKey, 50, creditCardInfo); // User spends $50 to buy coins
        console.log("User Wallet Balance:", wallet.balanceOf(userPublicKey));
    } catch (error) {
        console.error("Error purchasing coins:", error.message);
    }
})();
