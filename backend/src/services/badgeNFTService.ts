import * as StellarSDK from '@stellar/stellar-sdk';
import type { NFTMintResult } from '../types/blockchain';

// Contract configuration
const NETWORK = process.env.STELLAR_NETWORK || 'TESTNET';
const BADGE_NFT_CONTRACT = process.env.BADGE_NFT_CONTRACT_ID;
const RPC_URL = NETWORK === 'TESTNET' 
  ? 'https://soroban-testnet.stellar.org' 
  : 'https://soroban-mainnet.stellar.org';

const server = new StellarSDK.SorobanRpc.Server(RPC_URL);

/**
 * Mint a badge NFT on the Stellar blockchain
 */
export const mintBadgeNFT = async (
  receiver: string,
  testId: string,
  metadataUri: string,
  signerKeypair?: Keypair
): Promise<NFTMintResult> => {
  try {
    console.log('🎖️ Minting badge NFT...', {
      receiver,
      testId,
      metadataUri,
      contractId: BADGE_NFT_CONTRACT,
      network: NETWORK
    });

    // Simulation mode if no signer provided
    if (!signerKeypair) {
      console.log('⚠️  No signer keypair provided - running in simulation mode');
      
      const tokenId = `nft_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const txHash = `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      return {
        success: true,
        txHash,
        tokenId,
        metadataUrl: metadataUri
      };
    }

    // Real blockchain interaction
    const contract = new StellarSDK.Contract(BADGE_NFT_CONTRACT);
    
    // Load account
    const sourceAccount = await server.getAccount(signerKeypair.publicKey());
    
    // Build transaction to mint NFT
    const transaction = new StellarSDK.TransactionBuilder(sourceAccount, {
      fee: StellarSDK.BASE_FEE,
      networkPassphrase: NETWORK === 'TESTNET' ? StellarSDK.Networks.TESTNET : StellarSDK.Networks.PUBLIC
    })
      .addOperation(
        contract.call(
          'mint',
          StellarSDK.nativeToScVal(receiver, { type: 'address' }),
          StellarSDK.nativeToScVal(metadataUri, { type: 'string' })
        )
      )
      .setTimeout(30)
      .build();

    // Simulate transaction first
    const simulated = await server.simulateTransaction(transaction);
    
    if (StellarSDK.SorobanRpc.Api.isSimulationError(simulated)) {
      throw new Error(`Simulation failed: ${simulated.error}`);
    }

    // Prepare and sign transaction
    const preparedTx = StellarSDK.SorobanRpc.assembleTransaction(transaction, simulated).build();
    preparedTx.sign(signerKeypair);

    // Submit transaction
    const txResponse = await server.sendTransaction(preparedTx);
    
    if (txResponse.status === 'ERROR') {
      throw new Error(`Transaction failed: ${txResponse.errorResult}`);
    }

    // Wait for confirmation
    let txHash = txResponse.hash;
    let status = txResponse.status;
    let attempts = 0;
    const maxAttempts = 30;

    while (status === 'PENDING' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const statusResponse = await server.getTransaction(txHash);
      status = statusResponse.status;
      attempts++;
    }

    if (status !== 'SUCCESS') {
      throw new Error(`Transaction failed with status: ${status}`);
    }

    // Extract token ID from transaction result
    const txResult = await server.getTransaction(txHash);
    let tokenId = `nft_${testId}_${Date.now()}`;
    
    if (txResult.status === 'SUCCESS' && txResult.resultMetaXdr) {
      try {
        // Parse the result to get the minted token ID
        // This depends on your contract's return value
        const resultValue = txResult.returnValue;
        if (resultValue) {
          tokenId = StellarSDK.scValToNative(resultValue);
        }
      } catch (e) {
        console.warn('Could not parse token ID from result, using generated ID');
      }
    }

    console.log('✅ Badge NFT successfully minted');
    console.log(`🔗 TX Hash: ${txHash}`);
    console.log(`🎖️  Token ID: ${tokenId}`);

    return {
      success: true,
      txHash,
      tokenId,
      metadataUrl: metadataUri
    };

  } catch (error: any) {
    console.error('❌ Error minting badge NFT:', error);
    throw new Error(`NFT minting failed: ${error.message}`);
  }
};

/**
 * Get NFT metadata from blockchain
 */
export const getNFTMetadata = async (tokenId: string): Promise<string | null> => {
  try {
    const contract = new StellarSDK.Contract(BADGE_NFT_CONTRACT);
    const dummyKeypair = StellarSDK.Keypair.random();
    
    const account = await server.getAccount(dummyKeypair.publicKey()).catch(() => {
      return {
        accountId: () => dummyKeypair.publicKey(),
        sequenceNumber: () => '0',
        incrementSequenceNumber: () => {}
      } as any;
    });

    const transaction = new StellarSDK.TransactionBuilder(account, {
      fee: StellarSDK.BASE_FEE,
      networkPassphrase: NETWORK === 'TESTNET' ? StellarSDK.Networks.TESTNET : StellarSDK.Networks.PUBLIC
    })
      .addOperation(
        contract.call(
          'get_token_uri',
          StellarSDK.nativeToScVal(tokenId, { type: 'string' })
        )
      )
      .setTimeout(30)
      .build();

    const simulated = await server.simulateTransaction(transaction);
    
    if (StellarSDK.SorobanRpc.Api.isSimulationError(simulated) || !simulated.result) {
      return null;
    }

    return StellarSDK.scValToNative(simulated.result.retval);

  } catch (error: any) {
    console.error('❌ Error getting NFT metadata:', error);
    return null;
  }
};
