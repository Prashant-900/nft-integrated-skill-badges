import express from 'express';
import { registerOrLoginUser, getUserByWallet } from '../controllers/authController';

const router = express.Router();

router.post('/auth/wallet', registerOrLoginUser);
router.get('/auth/user/:walletAddress', getUserByWallet);

export default router;
