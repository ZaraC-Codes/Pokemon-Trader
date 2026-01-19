// Test script to verify ApeChain configuration and test getAllUnclaimedListings
import { createPublicClient, http } from 'viem';

// ApeChain Mainnet Configuration
const APECHAIN_CHAIN_ID = 33139;
const APECHAIN_RPC = 'https://apechain-mainnet.g.alchemy.com/v2/iaNpJew_PfWaRTLVtZ15PDXLh4W584L9';
const OTC_MARKETPLACE = '0xe190E7cA0C7C7438CBaFca49457e1DCeE6c6CdAf';

// ApeChain chain configuration
const apeChainMainnet = {
  id: APECHAIN_CHAIN_ID,
  name: 'ApeChain',
  network: 'apechain',
  nativeCurrency: {
    decimals: 18,
    name: 'ApeCoin',
    symbol: 'APE',
  },
  rpcUrls: {
    default: {
      http: [APECHAIN_RPC],
    },
  },
  blockExplorers: {
    default: {
      name: 'ApeChain Explorer',
      url: 'https://apechain.calderascan.xyz',
    },
  },
};

// Create public client
const publicClient = createPublicClient({
  chain: apeChainMainnet,
  transport: http(APECHAIN_RPC),
});

// OTC Marketplace ABI
const OTC_ABI = [
  {
    inputs: [],
    name: 'nextListingId',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'start', type: 'uint256' },
      { internalType: 'uint256', name: 'end', type: 'uint256' },
    ],
    name: 'getAllUnclaimedListings',
    outputs: [
      {
        components: [
          { internalType: 'address', name: 'seller', type: 'address' },
          {
            components: [
              { internalType: 'address', name: 'contractAddress', type: 'address' },
              { internalType: 'bytes', name: 'handler', type: 'bytes' },
              { internalType: 'uint256', name: 'value', type: 'uint256' },
            ],
            internalType: 'struct Token[]',
            name: 'tokensForSale',
            type: 'tuple[]',
          },
          {
            components: [
              { internalType: 'address', name: 'contractAddress', type: 'address' },
              { internalType: 'bytes', name: 'handler', type: 'bytes' },
              { internalType: 'uint256', name: 'value', type: 'uint256' },
            ],
            internalType: 'struct Token[]',
            name: 'tokensToReceive',
            type: 'tuple[]',
          },
          { internalType: 'uint256', name: 'destinationEndpoint', type: 'uint256' },
        ],
        internalType: 'struct Listing[]',
        name: '',
        type: 'tuple[]',
      },
      { internalType: 'uint256[]', name: '', type: 'uint256[]' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

const ZeroAddress = '0x0000000000000000000000000000000000000000';
const ERC721_HANDLER = '0xDcC301eCcCb0B13Bc49B34a756cD650eEb99F036';
const ERC1155_HANDLER = '0xC2448a90829Ca7DC25505Fa884B1602Ce7E3b2E2';

function handlerToAddress(handler) {
  if (!handler || handler === '0x' || handler.length < 66) return '';
  return '0x' + handler.slice(-40).toLowerCase();
}

async function testConfiguration() {
  console.log('=== Testing ApeChain Configuration ===\n');
  
  // Test 1: Verify chain ID
  console.log('1. Chain Configuration:');
  console.log(`   Chain ID: ${APECHAIN_CHAIN_ID}`);
  console.log(`   Chain Name: ${apeChainMainnet.name}`);
  console.log(`   RPC URL: ${APECHAIN_RPC}`);
  console.log(`   OTC Marketplace: ${OTC_MARKETPLACE}`);
  
  // Test 2: Test RPC connection
  console.log('\n2. Testing RPC Connection...');
  try {
    const blockNumber = await publicClient.getBlockNumber();
    console.log(`   ✓ Connected! Current block: ${blockNumber}`);
  } catch (error) {
    console.log(`   ✗ Connection failed: ${error.message}`);
    return;
  }
  
  // Test 3: Get nextListingId
  console.log('\n3. Getting nextListingId...');
  try {
    const nextId = await publicClient.readContract({
      address: OTC_MARKETPLACE,
      abi: OTC_ABI,
      functionName: 'nextListingId',
    });
    console.log(`   ✓ nextListingId: ${nextId}`);
    console.log(`   This means listings should be in range 0 to ${Number(nextId) - 1}`);
    return Number(nextId);
  } catch (error) {
    console.log(`   ✗ Failed: ${error.message}`);
    return null;
  }
}

async function testGetAllUnclaimedListings() {
  console.log('\n=== Testing getAllUnclaimedListings Function ===\n');
  
  // First get nextListingId
  let maxId = 2000;
  try {
    const nextId = await publicClient.readContract({
      address: OTC_MARKETPLACE,
      abi: OTC_ABI,
      functionName: 'nextListingId',
    });
    maxId = Number(nextId);
    console.log(`nextListingId: ${maxId}\n`);
  } catch (error) {
    console.log(`Could not get nextListingId: ${error.message}\n`);
  }
  
  // Test different ranges
  const testRanges = [
    [0, 10],
    [10, 20],
    [50, 100],
    [100, 150],
    [500, 550],
    [Math.max(0, maxId - 100), maxId], // Last 100
  ];
  
  let totalValid = 0;
  let totalNFT = 0;
  
  for (const [start, end] of testRanges) {
    if (start >= maxId) continue;
    
    try {
      console.log(`Testing range ${start} to ${end}...`);
      
      const result = await publicClient.readContract({
        address: OTC_MARKETPLACE,
        abi: OTC_ABI,
        functionName: 'getAllUnclaimedListings',
        args: [BigInt(start), BigInt(end)],
      });
      
      if (result && Array.isArray(result) && result.length >= 2) {
        const listings = result[0] || [];
        const listingIds = result[1] || [];
        
        const valid = listings
          .map((listing, idx) => ({
            listingId: Number(listingIds[idx] || (start + idx)),
            seller: listing.seller,
            saleTokens: listing.tokensForSale || [],
            receiveTokens: listing.tokensToReceive || [],
            destinationEndpoint: Number(listing.destinationEndpoint || 0),
          }))
          .filter((l) => {
            if (l.seller === ZeroAddress) return false;
            if (l.saleTokens.length === 0 || l.receiveTokens.length === 0) return false;
            return true;
          });
        
        const nftValid = valid.filter((l) => {
          const saleHandler = handlerToAddress(l.saleTokens[0]?.handler);
          const receiveHandler = handlerToAddress(l.receiveTokens[0]?.handler);
          const saleIsNFT = saleHandler === ERC721_HANDLER.toLowerCase() || 
                            saleHandler === ERC1155_HANDLER.toLowerCase();
          const receiveIsNFT = receiveHandler === ERC721_HANDLER.toLowerCase() || 
                               receiveHandler === ERC1155_HANDLER.toLowerCase();
          return saleIsNFT || receiveIsNFT;
        });
        
        totalValid += valid.length;
        totalNFT += nftValid.length;
        
        console.log(`  ✓ Fetched ${listings.length} listings`);
        console.log(`    - Valid (non-empty): ${valid.length}`);
        console.log(`    - NFT listings: ${nftValid.length}`);
        
        if (nftValid.length > 0) {
          console.log(`    - Sample NFT listing IDs: ${nftValid.slice(0, 3).map(l => l.listingId).join(', ')}`);
        }
      }
    } catch (error) {
      console.log(`  ✗ Failed: ${error.message?.substring(0, 80)}`);
    }
  }
  
  console.log('\n=== Summary ===');
  console.log(`Total valid listings found: ${totalValid}`);
  console.log(`Total NFT listings found: ${totalNFT}`);
  
  if (totalNFT === 0) {
    console.log('\n⚠ No NFT listings found in tested ranges.');
    console.log('This could mean:');
    console.log('  - All listings are ERC20-only');
    console.log('  - Listings are in ranges we haven\'t tested yet');
    console.log('  - The contract structure is different');
  }
}

async function main() {
  try {
    const maxId = await testConfiguration();
    if (maxId) {
      await testGetAllUnclaimedListings();
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main().catch(console.error);
