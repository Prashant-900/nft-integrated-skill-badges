import * as StellarSDK from '@stellar/stellar-sdk';
import type { TestMetadata, TestRegistrationResult } from '../types/blockchain';

// Contract configuration
const NETWORK = process.env.STELLAR_NETWORK || 'TESTNET';
const TEST_REGISTRY_CONTRACT = process.env.TEST_REGISTRY_CONTRACT_ID || 'CC6TAXNQXKQS67LTB3RZITFUA5E24OVSXFPP5Z7ALYDVQ74FGV2XGIVH';
const RPC_URL = NETWORK === 'TESTNET' 
  ? 'https://soroban-testnet.stellar.org' 
  : 'https://soroban-mainnet.stellar.org';

const server = new StellarSDK.SorobanRpc.Server(RPC_URL);

/**
 * Register a test on the Stellar blockchain via Test Registry contract
 */
export const registerTestOnChain = async (
  testId: string,
  creator: string,
  metadataCid: string,
  signerKeypair?: Keypair
): Promise<TestRegistrationResult> => {
  try {
    console.log('📝 Registering test on-chain...', {
      testId,
      creator,
      metadataCid,
      contractId: TEST_REGISTRY_CONTRACT,
      network: NETWORK
    });

    // For now, we'll simulate the transaction since we need a signing keypair
    // In production, you'd either:
    // 1. Have the user sign the transaction in the frontend
    // 2. Have a backend wallet that sponsors the transaction
    
    if (!signerKeypair) {
      // Simulation mode
      console.log('⚠️  No signer keypair provided - running in simulation mode');
      const txHash = `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      return {
        success: true,
        txHash,
        testMetadata: {
          testId,
          creator,
          metadataCid,
          createdAt: Date.now()
        }
      };
    }

    // Real blockchain interaction
    const contract = new StellarSDK.Contract(TEST_REGISTRY_CONTRACT);
    
    // Load account
    const sourceAccount = await server.getAccount(signerKeypair.publicKey());
    
    // Build transaction to call register_test
    const transaction = new StellarSDK.TransactionBuilder(sourceAccount, {
      fee: StellarSDK.BASE_FEE,
      networkPassphrase: NETWORK === 'TESTNET' ? StellarSDK.Networks.TESTNET : StellarSDK.Networks.PUBLIC
    })
      .addOperation(
        contract.call(
          'register_test',
          StellarSDK.nativeToScVal(testId, { type: 'string' }),
          StellarSDK.nativeToScVal(creator, { type: 'string' }),
          StellarSDK.nativeToScVal(metadataCid, { type: 'string' })
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

    console.log('✅ Test successfully registered on-chain');
    console.log(`🔗 TX Hash: ${txHash}`);

    return {
      success: true,
      txHash,
      testMetadata: {
        testId,
        creator,
        metadataCid,
        createdAt: Date.now()
      }
    };

  } catch (error: any) {
    console.error('❌ Error registering test on-chain:', error);
    throw new Error(`Blockchain registration failed: ${error.message}`);
  }
};

/**
 * Get test metadata from blockchain
 */
export const getTestFromChain = async (testId: string): Promise<TestMetadata | null> => {
  try {
    const contract = new StellarSDK.Contract(TEST_REGISTRY_CONTRACT);
    
    // Build account for simulation (doesn't need to exist for read operations)
    const dummyKeypair = StellarSDK.Keypair.random();
    const account = await server.getAccount(dummyKeypair.publicKey()).catch(() => {
      // If account doesn't exist, create a dummy one for simulation
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
          'get_test',
          StellarSDK.nativeToScVal(testId, { type: 'string' })
        )
      )
      .setTimeout(30)
      .build();

    const simulated = await server.simulateTransaction(transaction);
    
    if (StellarSDK.SorobanRpc.Api.isSimulationError(simulated) || !simulated.result) {
      return null;
    }

    const result = StellarSDK.scValToNative(simulated.result.retval);
    return result ? {
      testId: result.test_id,
      creator: result.creator,
      metadataCid: result.metadata_cid,
      createdAt: result.created_at
    } : null;

  } catch (error: any) {
    console.error('❌ Error getting test from chain:', error);
    return null;
  }
};

/**
 * List all tests from blockchain
 */
export const listTestsFromChain = async (): Promise<TestMetadata[]> => {
  try {
    const contract = new StellarSDK.Contract(TEST_REGISTRY_CONTRACT);
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
      .addOperation(contract.call('list_tests'))
      .setTimeout(30)
      .build();

    const simulated = await server.simulateTransaction(transaction);
    
    if (StellarSDK.SorobanRpc.Api.isSimulationError(simulated) || !simulated.result) {
      return [];
    }

    const result = StellarSDK.scValToNative(simulated.result.retval);
    return Array.isArray(result) ? result.map((item: any) => ({
      testId: item.test_id,
      creator: item.creator,
      metadataCid: item.metadata_cid,
      createdAt: item.created_at
    })) : [];

  } catch (error: any) {
    console.error('❌ Error listing tests from chain:', error);
    return [];
  }
};
