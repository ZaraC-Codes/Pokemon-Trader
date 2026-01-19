// Test alternative methods to fetch listings
import { createPublicClient, http } from 'viem';

const APECHAIN_RPC = 'https://apechain-mainnet.g.alchemy.com/v2/iaNpJew_PfWaRTLVtZ15PDXLh4W584L9';
const OTC_MARKETPLACE = '0xe190E7cA0C7C7438CBaFca49457e1DCeE6c6CdAf';

const publicClient = createPublicClient({
  chain: { id: 33139 },
  transport: http(APECHAIN_RPC),
});

// Try different ABI patterns
const ALTERNATIVE_ABIS = [
  // Standard ABI
  [
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
  ],
];

async function testAlternativeMethods() {
  console.log('=== Testing Alternative Fetch Methods ===\n');
  
  // Method 1: Try with very small batches (1-5 listings at a time)
  console.log('Method 1: Very small batches (1-5 at a time)...\n');
  
  const smallBatchSizes = [1, 2, 5, 10];
  let foundAny = false;
  
  for (const batchSize of smallBatchSizes) {
    try {
      console.log(`  Trying batch size ${batchSize}...`);
      const result = await publicClient.readContract({
        address: OTC_MARKETPLACE,
        abi: ALTERNATIVE_ABIS[0],
        functionName: 'getAllUnclaimedListings',
        args: [0n, BigInt(batchSize)],
      });
      
      if (result && Array.isArray(result) && result.length >= 2) {
        const listings = result[0] || [];
        const nonZero = listings.filter(l => l.seller !== '0x0000000000000000000000000000000000000000').length;
        if (nonZero > 0) {
          console.log(`    ✓ Found ${nonZero} non-zero sellers with batch size ${batchSize}!`);
          foundAny = true;
          break;
        }
      }
    } catch (error) {
      console.log(`    ✗ Batch size ${batchSize} failed`);
    }
  }
  
  // Method 2: Try checking individual listing IDs that might exist
  // Based on the user's data, let's try some specific ranges
  console.log('\nMethod 2: Checking specific ranges that might have listings...\n');
  
  const promisingRanges = [
    [100, 105],
    [200, 205],
    [300, 305],
    [400, 405],
    [500, 505],
    [600, 605],
    [700, 705],
    [800, 805],
    [900, 905],
    [1000, 1005],
  ];
  
  for (const [start, end] of promisingRanges) {
    try {
      const result = await publicClient.readContract({
        address: OTC_MARKETPLACE,
        abi: ALTERNATIVE_ABIS[0],
        functionName: 'getAllUnclaimedListings',
        args: [BigInt(start), BigInt(end)],
      });
      
      if (result && Array.isArray(result) && result.length >= 2) {
        const listings = result[0] || [];
        const listingIds = result[1] || [];
        
        listings.forEach((listing, idx) => {
          const listingId = Number(listingIds[idx] || (start + idx));
          if (listing.seller !== '0x0000000000000000000000000000000000000000') {
            foundAny = true;
            console.log(`  ✓ Found listing ${listingId} with seller ${listing.seller}`);
            console.log(`    TokensForSale: ${listing.tokensForSale?.length || 0}`);
            console.log(`    TokensToReceive: ${listing.tokensToReceive?.length || 0}`);
          }
        });
      }
    } catch (error) {
      // Skip errors
    }
  }
  
  if (!foundAny) {
    console.log('\n⚠ Still no listings found with non-zero sellers.');
    console.log('\nThis suggests:');
    console.log('  1. The contract might use a different storage pattern');
    console.log('  2. Listings might be stored in a mapping instead of an array');
    console.log('  3. We might need to use events to find active listings');
    console.log('  4. The working marketplace might be using a different contract or method');
  } else {
    console.log('\n✓ Found listings! The issue was with batch sizes or ranges.');
  }
}

testAlternativeMethods().catch(console.error);
