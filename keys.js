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

// Example usage
const keyGen = new KeyPairGenerator();
const { publicKey, privateKey } = keyGen.generateKeyPair();

console.log("Public Key:", publicKey);
console.log("Private Key:", privateKey);

// The public key can be shared, while the private key should be kept secure
