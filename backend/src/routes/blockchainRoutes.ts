import express from 'express';
import { registerTest, mintNFT } from '../controllers/blockchainController';

const router = express.Router();

// Register test on blockchain
router.post('/blockchain/register-test', registerTest);

// Mint NFT badge
router.post('/blockchain/mint-nft', mintNFT);

export default router;
