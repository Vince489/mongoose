const express = require('express');
const router = express.Router();
const { KeyPairGenerator, NativeCoinWallet } = require("../ok");

// Initialize native coin
router.post('/initialize', async (req, res) => {
    const wallet = new NativeCoinWallet();
    const keyGen = new KeyPairGenerator();
    const { publicKey } = keyGen.generateKeyPair();
    wallet.initializeAccount(publicKey);
    res.json({ publicKey, balance: wallet.balanceOf(publicKey) });
});




module.exports = router;