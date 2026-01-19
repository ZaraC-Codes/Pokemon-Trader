// Test script for useAllListings with new ApeChain addresses
import { createPublicClient, http } from 'viem';

const APECHAIN_RPC = 'https://apechain-mainnet.g.alchemy.com/v2/iaNpJew_PfWaRTLVtZ15PDXLh4W584L9';
const OTC_MARKETPLACE = '0xe190E7cA0C7C7438CBaFca49457e1DCeE6c6CdAf'; // New ApeChain address

const apeChainMainnet = {
  id: 33139,
  name: 'ApeChain',
  network: 'apechain',
  nativeCurrency: {
    decimals: 18,
    name: 'ApeCoin',
    symbol: 'APE',
  },
  rpcUrls: {
    default: { http: [APECHAIN_RPC] },
  },
};

const publicClient = createPublicClient({
  chain: apeChainMainnet,
  transport: http(APECHAIN_RPC),
});

// ABI for getAllUnclaimedListings
const OTC_ABI = [
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

async function testGetAllUnclaimedListings() {
  console.log('=== Testing getAllUnclaimedListings with New ApeChain Address ===\n');
  console.log('OTC Marketplace:', OTC_MARKETPLACE);
  console.log('RPC URL:', APECHAIN_RPC);
  console.log('');

  // Test 1: Check if contract exists
  console.log('1. Checking contract bytecode...');
  try {
    const code = await publicClient.getBytecode({ address: OTC_MARKETPLACE });
    console.log('   ✓ Contract code exists:', code ? `Yes (${code.length} bytes)` : 'No');
    if (!code) {
      console.log('   ✗ Contract does not exist at this address!');
      return;
    }
  } catch (error) {
    console.log('   ✗ Error:', error.message);
    return;
  }
  console.log('');

  // Test 2: Try getAllUnclaimedListings with different ranges
  const ranges = [10, 50, 100, 500];
  
  console.log('2. Testing getAllUnclaimedListings with different ranges...\n');
  
  for (const range of ranges) {
    try {
      console.log(`   Testing range (0, ${range})...`);
      const result = await publicClient.readContract({
        address: OTC_MARKETPLACE,
        abi: OTC_ABI,
        functionName: 'getAllUnclaimedListings',
        args: [0n, BigInt(range)],
      });
      
      if (result && Array.isArray(result) && result.length >= 2) {
        const listings = result[0] || [];
        const listingIds = result[1] || [];
        
        console.log(`   ✓ Success! Found ${listings.length} listings`);
        
        // Filter out zero address sellers
        const validListings = listings.filter((listing, idx) => {
          const seller = listing.seller;
          const hasTokens = (listing.tokensForSale?.length > 0) && (listing.tokensToReceive?.length > 0);
          return seller && seller !== '0x0000000000000000000000000000000000000000' && hasTokens;
        });
        
        console.log(`   Valid listings (non-zero seller with tokens): ${validListings.length}`);
        
        if (validListings.length > 0) {
          console.log(`\n   First valid listing details:`);
          const firstListing = validListings[0];
          const listingIdx = listings.indexOf(firstListing);
          console.log(`     - Seller: ${firstListing.seller}`);
          console.log(`     - Listing ID: ${listingIds[listingIdx]}`);
          console.log(`     - Tokens for sale: ${firstListing.tokensForSale?.length || 0}`);
          console.log(`     - Tokens to receive: ${firstListing.tokensToReceive?.length || 0}`);
          console.log(`     - Destination endpoint: ${firstListing.destinationEndpoint}`);
          
          if (firstListing.tokensForSale && firstListing.tokensForSale.length > 0) {
            const token = firstListing.tokensForSale[0];
            console.log(`     - Token for sale:`);
            console.log(`       Contract: ${token.contractAddress}`);
            console.log(`       Value: ${token.value.toString()}`);
            console.log(`       Handler: ${token.handler.substring(0, 20)}...`);
          }
          
          if (firstListing.tokensToReceive && firstListing.tokensToReceive.length > 0) {
            const token = firstListing.tokensToReceive[0];
            console.log(`     - Token to receive:`);
            console.log(`       Contract: ${token.contractAddress}`);
            console.log(`       Value: ${token.value.toString()}`);
          }
        } else {
          console.log(`   Note: All listings have zero address sellers or empty tokens (will be filtered in app)`);
        }
        
        // Stop after first successful call
        console.log('\n   ✓ Function works correctly with new ApeChain address!');
        return;
      }
    } catch (error) {
      if (error.message?.includes('revert') || error.message?.includes('Execution reverted')) {
        console.log(`   ✗ Range (0, ${range}) reverted`);
        continue;
      } else {
        console.log(`   ✗ Range (0, ${range}) failed:`, error.message);
        continue;
      }
    }
  }
  
  console.log('\n   ✗ All ranges failed - function may not exist or contract needs initialization');
}

// Run test
testGetAllUnclaimedListings().catch(console.error);
