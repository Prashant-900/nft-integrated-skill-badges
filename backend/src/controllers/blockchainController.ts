import { Request, Response } from 'express';
import { registerTestOnChain } from '../services/registryService';
import { mintBadgeNFT } from '../services/nftService';

/**
 * Register a test on the blockchain
 */
export const registerTest = async (req: Request, res: Response) => {
  try {
    const { testId, creator, metadataCid } = req.body;

    if (!testId || !creator || !metadataCid) {
      return res.status(400).json({
        error: 'Missing required fields: testId, creator, metadataCid'
      });
    }

    const result = await registerTestOnChain(testId, creator, metadataCid);

    return res.json({
      success: true,
      message: 'Test registered on blockchain',
      data: result
    });

  } catch (error: any) {
    console.error('Blockchain registration error:', error);
    return res.status(500).json({
      error: 'Failed to register test on blockchain',
      details: error.message
    });
  }
};

/**
 * Mint a badge NFT
 */
export const mintNFT = async (req: Request, res: Response) => {
  try {
    const { receiver, testId, testTitle, score, totalScore } = req.body;

    if (!receiver || !testId) {
      return res.status(400).json({
        error: 'Missing required fields: receiver, testId'
      });
    }

    const result = await mintBadgeNFT(
      receiver,
      testId,
      testTitle,
      score,
      totalScore
    );

    return res.json({
      success: true,
      message: 'NFT badge minted successfully',
      data: result
    });

  } catch (error: any) {
    console.error('NFT minting error:', error);
    return res.status(500).json({
      error: 'Failed to mint NFT badge',
      details: error.message
    });
  }
};
