# NFT Integrated Skill Badges - Refactored Architecture

## 🎯 Overview
This project has been refactored to follow best practices with proper separation of concerns between frontend and backend.

## 📁 Project Structure

```
nft-integrated-skill-badges/
├── frontend/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── ui/          # Base UI components (Button, Card, Input, Label)
│   │   │   ├── NotFound.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── PublicRoute.tsx
│   │   ├── config/          # Configuration files
│   │   │   ├── colors.ts    # Neobrutalism color scheme
│   │   │   └── supabase.ts  # Supabase client & types
│   │   ├── dashboard/       # Dashboard tabs
│   │   │   ├── BadgesTab.tsx      # Earned badges & NFTs
│   │   │   ├── CreateTestTab.tsx  # Create new tests
│   │   │   ├── Dashboard.tsx      # Main dashboard
│   │   │   ├── EarnTab.tsx        # Available tests
│   │   │   ├── MyTestsTab.tsx     # Creator's tests
│   │   │   ├── ProfileTab.tsx     # User profile
│   │   │   └── TakeTestTab.tsx    # Test taking interface
│   │   ├── home/
│   │   │   └── Login.tsx    # Freighter wallet login
│   │   ├── utils/
│   │   │   ├── backendApi.ts      # **NEW** Backend API calls
│   │   │   ├── freighter.ts       # Freighter wallet integration
│   │   │   └── sorobanSimple.ts   # Contract explorer URLs
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── .env                 # Frontend environment variables
│
├── backend/                 # Express + TypeScript backend
│   ├── src/
│   │   ├── config/
│   │   │   └── supabase.ts        # Backend Supabase client
│   │   ├── controllers/
│   │   │   ├── authController.ts  # Authentication handlers
│   │   │   └── blockchainController.ts  # **NEW** Blockchain operations
│   │   ├── routes/
│   │   │   ├── authRoutes.ts      # Auth endpoints
│   │   │   └── blockchainRoutes.ts  # **NEW** Blockchain endpoints
│   │   ├── services/              # **NEW** Business logic layer
│   │   │   ├── badgeNFTService.ts    # Stellar SDK NFT minting (WIP)
│   │   │   ├── nftService.ts         # Simplified NFT minting
│   │   │   ├── registryService.ts    # Test registration
│   │   │   ├── storageService.ts     # Supabase storage management
│   │   │   └── testRegistryService.ts  # Stellar SDK test registry (WIP)
│   │   ├── types/                 # **NEW** TypeScript types
│   │   │   └── blockchain.ts      # Blockchain operation types
│   │   └── index.ts           # Express server entry point
│   └── .env                 # Backend environment variables
│
└── contracts/               # Stellar smart contracts (Rust)
    ├── badge_nft/          # NFT badge minting contract
    │   └── src/lib.rs      # NFT contract implementation
    ├── test_registry/      # Test registration contract
    │   └── src/lib.rs      # Registry contract implementation
    └── CONTRACT_IDS.txt    # Deployed contract addresses
```

## 🔄 Architecture Changes

### Before Refactoring:
- ❌ Frontend directly interacted with blockchain
- ❌ No proper error handling
- ❌ Unused UI components (Dialog, Row)
- ❌ Business logic mixed with UI code
- ❌ Simulated blockchain calls in frontend

### After Refactoring:
- ✅ Backend handles all blockchain operations
- ✅ Clean separation of concerns
- ✅ Removed unused components
- ✅ Organized service layer
- ✅ Proper TypeScript types
- ✅ Backend manages metadata upload to Supabase Storage

## 🚀 New Backend API Endpoints

### Authentication
- `POST /api/auth/wallet` - Register or login with wallet
- `GET /api/auth/user/:walletAddress` - Get user by wallet

### Blockchain Operations (NEW)
- `POST /api/blockchain/register-test` - Register test on Stellar blockchain
- `POST /api/blockchain/mint-nft` - Mint NFT badge

## 📡 Backend API Usage

### Register Test on Blockchain
```typescript
// Frontend calls
import { registerTestViaBackend } from '../utils/backendApi';

const result = await registerTestViaBackend(
  testId,      // UUID from database
  walletAddress,  // Creator's Stellar address
  metadataUri  // Metadata reference
);

// Backend processes
POST http://localhost:3001/api/blockchain/register-test
{
  "testId": "e3282525-432d-427d-bbbc-c8ad13fc0d43",
  "creator": "GDDXGLNN4I7RJW43UIJXHDYWCDFG7QZCRTCRFMAVDXTVAPGES7KHABIF",
  "metadataCid": "e3282525-432d-427d-bbbc-c8ad13fc0d43.json"
}

// Response
{
  "success": true,
  "message": "Test registered on blockchain",
  "data": {
    "success": true,
    "txHash": "sim_1732551234567_abc123",
    "testMetadata": {
      "testId": "e3282525-432d-427d-bbbc-c8ad13fc0d43",
      "creator": "GDDX...",
      "metadataCid": "e3282525-432d-427d-bbbc-c8ad13fc0d43.json",
      "createdAt": 1732551234567
    }
  }
}
```

### Mint NFT Badge
```typescript
// Frontend calls
import { mintNFTViaBackend } from '../utils/backendApi';

const result = await mintNFTViaBackend(
  walletAddress,  // Recipient's address
  testId,         // Test UUID
  testTitle,      // Test name
  score,          // User's score
  totalScore      // Max score
);

// Backend processes (handles metadata generation & upload automatically)
POST http://localhost:3001/api/blockchain/mint-nft
{
  "receiver": "GDDXGLNN4I7RJW43UIJXHDYWCDFG7QZCRTCRFMAVDXTVAPGES7KHABIF",
  "testId": "e3282525-432d-427d-bbbc-c8ad13fc0d43",
  "testTitle": "JavaScript Fundamentals",
  "score": 8,
  "totalScore": 10
}

// Response
{
  "success": true,
  "message": "NFT badge minted successfully",
  "data": {
    "success": true,
    "txHash": "sim_1732551234567_xyz789",
    "tokenId": "nft_e3282525_1732551234567",
    "metadataUrl": "https://ohvqotagpasljoewbxhp.supabase.co/storage/v1/object/public/stellar/badge-metadata/e3282525_GDDX.json"
  }
}
```

## 🗂️ Database Schema

### Tables Used:
- `users` - Wallet addresses and user data
- `tests` - Test metadata and configuration
- `questions` - Test questions with answers
- `attempts` - Test submissions and scores
- `badges` - NFT badge records

### Supabase Storage:
- Bucket: `stellar`
- Path: `badge-metadata/{testId}_{walletAddress}.json`

## 🎨 Metadata Format

Badge NFT metadata follows this structure:
```json
{
  "name": "JavaScript Fundamentals - Achievement",
  "description": "Badge earned for completing JavaScript Fundamentals with a score of 8/10",
  "image": "https://ohvqotagpasljoewbxhp.supabase.co/storage/v1/object/public/stellar/badge-metadata/badge-icon.png",
  "attributes": [
    {
      "trait_type": "Test ID",
      "value": "e3282525-432d-427d-bbbc-c8ad13fc0d43"
    },
    {
      "trait_type": "Test Title",
      "value": "JavaScript Fundamentals"
    },
    {
      "trait_type": "Wallet Address",
      "value": "GDDXGLNN4I7RJW43UIJXHDYWCDFG7QZCRTCRFMAVDXTVAPGES7KHABIF"
    },
    {
      "trait_type": "Score",
      "value": "8/10"
    },
    {
      "trait_type": "Percentage",
      "value": "80.00%"
    },
    {
      "trait_type": "Issued Date",
      "value": "2025-11-24T20:21:17.131Z"
    }
  ]
}
```

## 🔧 Environment Variables

### Frontend (.env)
```properties
VITE_SUPABASE_URL=https://ohvqotagpasljoewbxhp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_BACKEND_URL=http://localhost:3001
VITE_TEST_REGISTRY_CONTRACT_ID=CC6TAXNQXKQS67LTB3RZITFUA5E24OVSXFPP5Z7ALYDVQ74FGV2XGIVH
VITE_BADGE_NFT_CONTRACT_ID=CAKY3FB7CFV6WL2XOXCGMZPCXRJRL3RPUYVAMIDRMELFVBAH3WXFZVCG
VITE_STELLAR_NETWORK=testnet
```

### Backend (.env)
```properties
SUPABASE_URL=https://ohvqotagpasljoewbxhp.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=3001
TEST_REGISTRY_CONTRACT_ID=CC6TAXNQXKQS67LTB3RZITFUA5E24OVSXFPP5Z7ALYDVQ74FGV2XGIVH
BADGE_NFT_CONTRACT_ID=CAKY3FB7CFV6WL2XOXCGMZPCXRJRL3RPUYVAMIDRMELFVBAH3WXFZVCG
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org:443
```

## 🚦 Running the Application

### Backend Server
```bash
cd backend
npm install
npm run dev
# Server runs on http://localhost:3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

## 📝 Smart Contracts

### Test Registry Contract
- **Address**: `CC6TAXNQXKQS67LTB3RZITFUA5E24OVSXFPP5Z7ALYDVQ74FGV2XGIVH`
- **Network**: Stellar Testnet
- **Purpose**: Immutable record of all created tests
- **Functions**:
  - `register_test(test_id, creator, metadata_cid)` - Register new test
  - `get_test(test_id)` - Retrieve test metadata
  - `list_tests()` - List all tests
  - `get_test_count()` - Get total count
  - `test_exists(test_id)` - Check if test exists

### Badge NFT Contract
- **Address**: `CAKY3FB7CFV6WL2XOXCGMZPCXRJRL3RPUYVAMIDRMELFVBAH3WXFZVCG`
- **Network**: Stellar Testnet
- **Purpose**: Mint NFT badges for test achievements
- **Functions**:
  - `mint(receiver, metadata_uri)` - Mint new NFT badge
  - `get_token_uri(token_id)` - Get metadata URL
  - `balance_of(owner)` - Get owner's NFT count
  - `owner_of(token_id)` - Get NFT owner

## 🔗 Blockchain Explorer Links

View contracts on Stellar Expert:
- **Test Registry**: `https://stellar.expert/explorer/testnet/contract/CC6TAXNQXKQS67LTB3RZITFUA5E24OVSXFPP5Z7ALYDVQ74FGV2XGIVH`
- **Badge NFT**: `https://stellar.expert/explorer/testnet/contract/CAKY3FB7CFV6WL2XOXCGMZPCXRJRL3RPUYVAMIDRMELFVBAH3WXFZVCG`

## ⚠️ Current Status

### ✅ Implemented:
- Backend API for blockchain operations
- Metadata generation and Supabase storage upload
- Frontend integration with backend APIs
- Proper error handling
- TypeScript types for all operations
- Simulation mode for testing without real transactions

### 🚧 Work in Progress:
- Full Stellar SDK integration (currently using simulation)
- Real blockchain transaction signing
- Freighter wallet integration for transaction approval

### 📋 Future Enhancements:
1. Implement actual blockchain transactions using Stellar SDK
2. Add wallet signing flow in frontend
3. Add transaction status polling
4. Implement contract event listening
5. Add blockchain data verification
6. Create admin dashboard for contract management

## 🧪 Testing

### Test Backend API:
```bash
# Register test
curl -X POST http://localhost:3001/api/blockchain/register-test \
  -H "Content-Type: application/json" \
  -d '{
    "testId": "test-123",
    "creator": "GDDXGLNN4I7RJW43UIJXHDYWCDFG7QZCRTCRFMAVDXTVAPGES7KHABIF",
    "metadataCid": "test-123.json"
  }'

# Mint NFT
curl -X POST http://localhost:3001/api/blockchain/mint-nft \
  -H "Content-Type: application/json" \
  -d '{
    "receiver": "GDDXGLNN4I7RJW43UIJXHDYWCDFG7QZCRTCRFMAVDXTVAPGES7KHABIF",
    "testId": "test-123",
    "testTitle": "Test Title",
    "score": 8,
    "totalScore": 10
  }'
```

## 📚 Additional Resources

- **Stellar Documentation**: https://developers.stellar.org/
- **Soroban Smart Contracts**: https://soroban.stellar.org/
- **Freighter Wallet**: https://www.freighter.app/
- **Supabase Docs**: https://supabase.com/docs

---

**Last Updated**: November 25, 2025
**Version**: 2.0.0 (Refactored Architecture)
