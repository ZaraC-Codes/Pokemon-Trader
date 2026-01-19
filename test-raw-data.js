// Test to see RAW data from contract without any filtering
import { createPublicClient, http } from 'viem';

const APECHAIN_RPC = 'https://apechain-mainnet.g.alchemy.com/v2/iaNpJew_PfWaRTLVtZ15PDXLh4W584L9';
const OTC_MARKETPLACE = '0xe190E7cA0C7C7438CBaFca49457e1DCeE6c6CdAf';

const publicClient = createPublicClient({
  chain: { id: 33139 },
  transport: http(APECHAIN_RPC),
});

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

const ZeroAddress = '0x0000000000000000000000000000000000000000';

function handlerToAddress(handler) {
  if (!handler || handler === '0x' || handler.length < 66) return '';
  return '0x' + handler.slice(-40).toLowerCase();
}

async function testRawData() {
  console.log('=== Testing RAW Contract Data (No Filtering) ===\n');
  
  // Test multiple ranges to find where listings actually are
  const testRanges = [
    [0, 100],
    [100, 200],
    [200, 300],
    [300, 400],
    [400, 500],
    [500, 600],
    [600, 700],
    [700, 800],
    [800, 900],
    [900, 1000],
    [1000, 1100],
    [1100, 1200],
    [1200, 1233],
  ];
  
  let foundAny = false;
  
  for (const [start, end] of testRanges) {
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
        
        console.log(`  Got ${listings.length} listings from contract`);
        
        // Show RAW data for first few non-zero sellers
        let shown = 0;
        for (let i = 0; i < listings.length && shown < 3; i++) {
          const listing = listings[i];
          const listingId = Number(listingIds[i] || (start + i));
          
          if (listing.seller !== ZeroAddress) {
            foundAny = true;
            shown++;
            console.log(`\n  Listing ${listingId} (NON-ZERO SELLER!):`);
            console.log(`    Seller: ${listing.seller}`);
            console.log(`    Destination Endpoint: ${listing.destinationEndpoint?.toString() || 'N/A'}`);
            console.log(`    TokensForSale length: ${listing.tokensForSale?.length || 0}`);
            console.log(`    TokensToReceive length: ${listing.tokensToReceive?.length || 0}`);
            
            if (listing.tokensForSale && listing.tokensForSale.length > 0) {
              const sale = listing.tokensForSale[0];
              console.log(`    Sale Token:`);
              console.log(`      Contract: ${sale.contractAddress}`);
              console.log(`      Handler (raw): ${sale.handler?.substring(0, 20)}...`);
              console.log(`      Handler (addr): ${handlerToAddress(sale.handler)}`);
              console.log(`      Value: ${sale.value?.toString()}`);
            }
            
            if (listing.tokensToReceive && listing.tokensToReceive.length > 0) {
              const receive = listing.tokensToReceive[0];
              console.log(`    Receive Token:`);
              console.log(`      Contract: ${receive.contractAddress}`);
              console.log(`      Handler (raw): ${receive.handler?.substring(0, 20)}...`);
              console.log(`      Handler (addr): ${handlerToAddress(receive.handler)}`);
              console.log(`      Value: ${receive.value?.toString()}`);
            }
          }
        }
        
        // Count non-zero sellers
        const nonZero = listings.filter(l => l.seller !== ZeroAddress).length;
        if (nonZero > 0) {
          console.log(`  ✓ Found ${nonZero} listings with non-zero sellers in this range!`);
        }
      }
    } catch (error) {
      console.log(`  ✗ Error: ${error.message?.substring(0, 80)}`);
    }
  }
  
  if (!foundAny) {
    console.log('\n⚠ No listings with non-zero sellers found in any tested range.');
    console.log('This suggests the listings might be:');
    console.log('  1. Stored in a different format');
    console.log('  2. Using a different function to retrieve');
    console.log('  3. All actually empty/uninitialized');
  } else {
    console.log('\n✓ Found listings! The data structure is correct, we just need to find the right ranges.');
  }
}

testRawData().catch(console.error);
