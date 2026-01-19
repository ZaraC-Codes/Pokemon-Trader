import { createPublicClient, http, defineChain } from 'viem';

// ApeChain Mainnet configuration
const apeChainMainnet = defineChain({
  id: 33139,
  name: 'ApeChain',
  network: 'apechain',
  nativeCurrency: {
    decimals: 18,
    name: 'ApeCoin',
    symbol: 'APE',
  },
  rpcUrls: {
    default: {
      http: ['https://apechain-mainnet.g.alchemy.com/v2/iaNpJew_PfWaRTLVtZ15PDXLh4W584L9'],
    },
  },
});

const OTC_MARKETPLACE_ADDRESS = '0xe190E7cA0C7C7438CBaFca49457e1DCeE6c6CdAf';

// ABI for the "listings" mapping getter function - exact match from abi.json
const ABI = [
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'listings',
    outputs: [
      { internalType: 'uint32', name: 'destinationEndpoint', type: 'uint32' },
      { internalType: 'address', name: 'seller', type: 'address' },
      {
        components: [
          { internalType: 'address', name: 'contractAddress', type: 'address' },
          { internalType: 'address', name: 'handler', type: 'address' },
          { internalType: 'uint256', name: 'value', type: 'uint256' },
        ],
        internalType: 'struct IListing.Token',
        name: 'tokenForSale',
        type: 'tuple',
      },
      {
        components: [
          { internalType: 'address', name: 'contractAddress', type: 'address' },
          { internalType: 'address', name: 'handler', type: 'address' },
          { internalType: 'uint256', name: 'value', type: 'uint256' },
        ],
        internalType: 'struct IListing.Token',
        name: 'tokenToReceive',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

// Known listing IDs that we know exist (first 10 from the list)
const TEST_LISTING_IDS = [10, 25, 229, 551, 564, 854, 927, 929, 930, 931];

async function testListingsFunction() {
  console.log('=== Testing "listings" function ===\n');
  
  const publicClient = createPublicClient({
    chain: apeChainMainnet,
    transport: http(),
  });

  let successCount = 0;
  let failCount = 0;

  for (const listingId of TEST_LISTING_IDS) {
    try {
      const result = await publicClient.readContract({
        address: OTC_MARKETPLACE_ADDRESS,
        abi: ABI,
        functionName: 'listings',
        args: [BigInt(listingId)],
      });

      // The listings function returns an array: [destinationEndpoint, seller, tokenForSale, tokenToReceive]
      const destinationEndpoint = result[0];
      const seller = result[1];
      const tokenForSale = result[2];
      const tokenToReceive = result[3];

      // Check if listing exists (seller is not zero address)
      const isEmpty = !seller || seller === '0x0000000000000000000000000000000000000000';

      if (!isEmpty) {
        console.log(`✅ Listing ${listingId}: FOUND`);
        console.log(`   Seller: ${seller}`);
        console.log(`   Destination Endpoint: ${destinationEndpoint}`);
        console.log(`   Token For Sale: ${tokenForSale.contractAddress} (value: ${tokenForSale.value.toString()})`);
        console.log(`   Token To Receive: ${tokenToReceive.contractAddress} (value: ${tokenToReceive.value.toString()})`);
        console.log('');
        successCount++;
      } else {
        console.log(`❌ Listing ${listingId}: EMPTY (seller is zero address)`);
        console.log('');
        failCount++;
      }
    } catch (error) {
      console.error(`❌ Listing ${listingId}: ERROR - ${error.message}`);
      console.log('');
      failCount++;
    }
  }

  console.log('=== Test Summary ===');
  console.log(`Total tested: ${TEST_LISTING_IDS.length}`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`\nExpected: All ${TEST_LISTING_IDS.length} should be found (they are in KNOWN_LISTING_IDS)`);
}

testListingsFunction().catch(console.error);
