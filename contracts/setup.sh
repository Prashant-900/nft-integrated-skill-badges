#!/bin/bash

echo "🚀 Building and Deploying Soroban Contracts to Testnet"
echo "========================================================"

# Build Test Registry
echo ""
echo "📦 Building Test Registry Contract..."
cd test_registry
cargo build --target wasm32-unknown-unknown --release
if [ $? -eq 0 ]; then
    echo "✅ Test Registry built successfully"
else
    echo "❌ Test Registry build failed"
    exit 1
fi

# Deploy Test Registry
echo ""
echo "🌐 Deploying Test Registry to Testnet..."
TEST_REGISTRY_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/test_registry.wasm \
  --source deployer \
  --network testnet)

if [ $? -eq 0 ]; then
    echo "✅ Test Registry deployed successfully"
    echo "📝 Contract ID: $TEST_REGISTRY_ID"
else
    echo "❌ Test Registry deployment failed"
    exit 1
fi

# Build Badge NFT
echo ""
echo "📦 Building Badge NFT Contract..."
cd ../badge_nft
cargo build --target wasm32-unknown-unknown --release
if [ $? -eq 0 ]; then
    echo "✅ Badge NFT built successfully"
else
    echo "❌ Badge NFT build failed"
    exit 1
fi

# Deploy Badge NFT
echo ""
echo "🌐 Deploying Badge NFT to Testnet..."
BADGE_NFT_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/badge_nft.wasm \
  --source deployer \
  --network testnet)

if [ $? -eq 0 ]; then
    echo "✅ Badge NFT deployed successfully"
    echo "📝 Contract ID: $BADGE_NFT_ID"
else
    echo "❌ Badge NFT deployment failed"
    exit 1
fi

# Save contract IDs
echo ""
echo "💾 Saving Contract IDs..."
cd ..
cat > CONTRACT_IDS.txt << EOL
Test Registry Contract ID: $TEST_REGISTRY_ID
Badge NFT Contract ID: $BADGE_NFT_ID
Deployed: $(date)
Network: Testnet
Deployer: deployer
EOL

echo "✅ Contract IDs saved to CONTRACT_IDS.txt"

# Create .env file for frontend
cat > ../frontend/.env.local << EOL
# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Soroban Contract IDs (Testnet)
VITE_TEST_REGISTRY_CONTRACT_ID=$TEST_REGISTRY_ID
VITE_BADGE_NFT_CONTRACT_ID=$BADGE_NFT_ID

# Stellar Network Configuration
VITE_STELLAR_NETWORK=testnet
VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org:443
VITE_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
EOL

echo "✅ Environment file created at frontend/.env.local"

echo ""
echo "🎉 Deployment Complete!"
echo "========================================================"
echo "Test Registry Contract ID:"
echo "$TEST_REGISTRY_ID"
echo ""
echo "Badge NFT Contract ID:"
echo "$BADGE_NFT_ID"
echo ""
echo "Next steps:"
echo "1. Update frontend/.env.local with your Supabase credentials"
echo "2. Test contracts using: stellar contract invoke --id <CONTRACT_ID> ..."
echo "3. View on Stellar Explorer:"
echo "   https://stellar.expert/explorer/testnet/contract/$TEST_REGISTRY_ID"
echo "   https://stellar.expert/explorer/testnet/contract/$BADGE_NFT_ID"