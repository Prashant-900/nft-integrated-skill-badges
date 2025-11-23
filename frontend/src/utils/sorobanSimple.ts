// Soroban Contract Configuration and Utilities
// This file provides simplified contract interaction for the NFT Skills Badge platform

import { getAddress } from '@stellar/freighter-api';

// Get configuration from environment variables
export const SOROBAN_CONFIG = {
  RPC_URL: import.meta.env.VITE_STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org:443',
  NETWORK_PASSPHRASE: import.meta.env.VITE_STELLAR_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015',
  NETWORK: import.meta.env.VITE_STELLAR_NETWORK || 'testnet',
  HORIZON_URL: import.meta.env.VITE_HORIZON_URL || 'https://horizon-testnet.stellar.org',
  TEST_REGISTRY_ID: import.meta.env.VITE_TEST_REGISTRY_CONTRACT_ID,
  BADGE_NFT_ID: import.meta.env.VITE_BADGE_NFT_CONTRACT_ID,
};

/**
 * Get the current Freighter wallet address
 */
export const getWalletAddress = async (): Promise<string> => {
  const result = await getAddress();
  if (result.error) {
    throw new Error(result.error);
  }
  return result.address;
};

/**
 * Simulated function to register a test on-chain
 * In production, this would interact with the TestRegistry contract
 */
export const registerTestOnChain = async (
  testId: string,
  creator: string,
  metadataCid: string
): Promise<{ success: boolean; txHash: string }> => {
  try {
    console.log('📝 Registering test on-chain...', {
      testId,
      creator,
      metadataCid,
      contractId: SOROBAN_CONFIG.TEST_REGISTRY_ID
    });

    // TODO: Implement actual contract interaction using stellar-cli or SDK
    // For now, we'll simulate success
    
    // Simulated transaction hash
    const txHash = `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    console.log('✅ Test registered on-chain (simulated)');
    console.log(`📝 Contract: ${SOROBAN_CONFIG.TEST_REGISTRY_ID}`);
    console.log(`🔗 View on Explorer: ${getExplorerUrl(txHash)}`);

    return {
      success: true,
      txHash,
    };
  } catch (error: any) {
    console.error('❌ Error registering test on-chain:', error);
    throw error;
  }
};

/**
 * Simulated function to mint a badge NFT
 * In production, this would interact with the BadgeNFT contract
 */
export const mintBadgeNFT = async (
  receiver: string,
  testId: string,
  metadataUri: string
): Promise<{ success: boolean; txHash: string; tokenId: string }> => {
  try {
    console.log('🎖️ Minting badge NFT...', {
      receiver,
      testId,
      metadataUri,
      contractId: SOROBAN_CONFIG.BADGE_NFT_ID
    });

    // TODO: Implement actual contract interaction using stellar-cli or SDK
    // For now, we'll simulate success
    
    // Simulated data
    const txHash = `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const tokenId = `NFT_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    console.log('✅ Badge NFT minted (simulated)');
    console.log(`🎖️ Token ID: ${tokenId}`);
    console.log(`📝 Contract: ${SOROBAN_CONFIG.BADGE_NFT_ID}`);
    console.log(`🔗 View on Explorer: ${getExplorerUrl(txHash)}`);

    return {
      success: true,
      txHash,
      tokenId,
    };
  } catch (error: any) {
    console.error('❌ Error minting badge NFT:', error);
    throw error;
  }
};

/**
 * Check if a test exists on-chain
 */
export const testExistsOnChain = async (testId: string): Promise<boolean> => {
  try {
    console.log('🔍 Checking if test exists on-chain:', testId);
    // TODO: Implement actual contract read
    // For now, assume all tests exist
    return true;
  } catch (error) {
    console.error('Error checking test existence:', error);
    return false;
  }
};

/**
 * Check if user has a badge for a specific test
 */
export const hasBadgeForTest = async (owner: string, testId: string): Promise<boolean> => {
  try {
    console.log('🔍 Checking badge ownership:', { owner, testId });
    // TODO: Implement actual contract read
    // For now, return false (rely on Supabase data)
    return false;
  } catch (error) {
    console.error('Error checking badge ownership:', error);
    return false;
  }
};

// ============ UTILITY FUNCTIONS ============

/**
 * Format contract address for display
 */
export const formatContractAddress = (address: string): string => {
  if (!address || address.length < 10) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

/**
 * Get Stellar Explorer URL for transaction
 */
export const getExplorerUrl = (txHash: string): string => {
  const network = SOROBAN_CONFIG.NETWORK;
  return `https://stellar.expert/explorer/${network}/tx/${txHash}`;
};

/**
 * Get Stellar Explorer URL for contract
 */
export const getContractExplorerUrl = (contractId: string): string => {
  const network = SOROBAN_CONFIG.NETWORK;
  return `https://stellar.expert/explorer/${network}/contract/${contractId}`;
};

/**
 * Get contract IDs
 */
export const CONTRACT_IDS = {
  TEST_REGISTRY: SOROBAN_CONFIG.TEST_REGISTRY_ID,
  BADGE_NFT: SOROBAN_CONFIG.BADGE_NFT_ID,
};

/**
 * Helper to generate metadata URI for tests
 */
export const generateTestMetadataUri = (testId: string, _testData?: any): string => {
  // In production, this would upload to IPFS or Arweave
  // For now, we'll use a Supabase-based URL
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/test-metadata/${testId}.json`;
};

/**
 * Helper to generate and upload metadata for badges
 */
export const generateBadgeMetadataUri = async (
  testId: string, 
  walletAddress: string, 
  testTitle?: string,
  score?: number,
  totalScore?: number
): Promise<string> => {
  try {
    // Import supabase dynamically to avoid circular dependency
    const { supabase } = await import('../config/supabase');
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const fileName = `${testId}_${walletAddress}.json`;
    
    // Create metadata object
    const metadata = {
      name: `${testTitle || 'Skill Badge'} - Achievement`,
      description: `Badge earned for completing ${testTitle || 'the test'}`,
      image: `${supabaseUrl}/storage/v1/object/public/badge-metadata/badge-icon.png`,
      attributes: [
        {
          trait_type: 'Test ID',
          value: testId
        },
        {
          trait_type: 'Wallet Address',
          value: walletAddress
        },
        {
          trait_type: 'Score',
          value: score ? `${score}/${totalScore}` : 'Passed'
        },
        {
          trait_type: 'Issued Date',
          value: new Date().toISOString()
        }
      ]
    };

    // Upload metadata to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('badge-metadata')
      .upload(fileName, JSON.stringify(metadata, null, 2), {
        contentType: 'application/json',
        upsert: true // Overwrite if exists
      });

    if (uploadError && !uploadError.message.includes('already exists')) {
      console.error('Error uploading badge metadata:', uploadError);
    }

    return `${supabaseUrl}/storage/v1/object/public/badge-metadata/${fileName}`;
  } catch (error) {
    console.error('Error generating badge metadata:', error);
    // Fallback to simple URL if upload fails
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${supabaseUrl}/storage/v1/object/public/badge-metadata/${testId}_${walletAddress}.json`;
  }
};

/**
 * Log contract interaction info
 */
export const logContractInfo = () => {
  console.log('📋 Soroban Contract Configuration:');
  console.log('Network:', SOROBAN_CONFIG.NETWORK);
  console.log('RPC URL:', SOROBAN_CONFIG.RPC_URL);
  console.log('Test Registry:', SOROBAN_CONFIG.TEST_REGISTRY_ID);
  console.log('Badge NFT:', SOROBAN_CONFIG.BADGE_NFT_ID);
  console.log('');
  console.log('View Contracts on Stellar Expert:');
  console.log('Test Registry:', getContractExplorerUrl(SOROBAN_CONFIG.TEST_REGISTRY_ID!));
  console.log('Badge NFT:', getContractExplorerUrl(SOROBAN_CONFIG.BADGE_NFT_ID!));
};
