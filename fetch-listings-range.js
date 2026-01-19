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
  blockExplorers: {
    default: {
      name: 'ApeChain Explorer',
      url: 'https://apechain.calderaexplorer.xyz',
    },
  },
});

const OTC_MARKETPLACE_ADDRESS = '0xe190E7cA0C7C7438CBaFca49457e1DCeE6c6CdAf';

// ABI for getAllUnclaimedListings function
const ABI = [
  {
    inputs: [
      { internalType: 'uint256', name: 'startIndex', type: 'uint256' },
      { internalType: 'uint256', name: 'max', type: 'uint256' },
    ],
    name: 'getAllUnclaimedListings',
    outputs: [
      {
        components: [
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
        internalType: 'struct IListing.Listing[]',
        name: '',
        type: 'tuple[]',
      },
      { internalType: 'uint256[]', name: '', type: 'uint256[]' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

async function fetchListingsRange(startIndex, max) {
  console.log(`\n=== Fetching Listings ${startIndex} to ${startIndex + max - 1} ===\n`);
  
  // Create public client
  const publicClient = createPublicClient({
    chain: apeChainMainnet,
    transport: http(),
  });

  try {
    console.log(`Calling getAllUnclaimedListings with startIndex=${startIndex}, max=${max}...`);
    
    const result = await publicClient.readContract({
      address: OTC_MARKETPLACE_ADDRESS,
      abi: ABI,
      functionName: 'getAllUnclaimedListings',
      args: [BigInt(startIndex), BigInt(max)],
    });

    const listings = result[0];
    const listingIds = result[1];

    console.log(`✅ Successfully fetched ${listings.length} listings\n`);

    if (listings.length === 0) {
      console.log(`❌ No listings found in range ${startIndex} to ${startIndex + max - 1}`);
      return;
    }

    console.log('📋 Listing Details:\n');
    console.log('=' .repeat(100));
    
    listings.forEach((listing, idx) => {
      const listingId = listingIds[idx] ? Number(listingIds[idx]) : startIndex + idx;
      const isEmpty = !listing.seller || listing.seller === '0x0000000000000000000000000000000000000000';
      
      if (isEmpty) {
        console.log(`\n${listingId}. [EMPTY SLOT]`);
        return;
      }

      console.log(`\n${listingId}. Listing ID: ${listingId}`);
      console.log(`   Seller: ${listing.seller}`);
      console.log(`   Destination Endpoint: ${listing.destinationEndpoint}`);
      console.log(`   Token For Sale:`);
      console.log(`     - Contract: ${listing.tokenForSale.contractAddress}`);
      console.log(`     - Handler: ${listing.tokenForSale.handler}`);
      console.log(`     - Token ID/Value: ${listing.tokenForSale.value.toString()}`);
      console.log(`   Token To Receive:`);
      console.log(`     - Contract: ${listing.tokenToReceive.contractAddress}`);
      console.log(`     - Handler: ${listing.tokenToReceive.handler}`);
      console.log(`     - Value: ${listing.tokenToReceive.value.toString()}`);
      
      if (listingId === 1233) {
        console.log(`   ⭐ THIS IS LISTING 1233!`);
      }
      
      console.log('   ' + '-'.repeat(96));
    });

    // Check specifically for listing 1233
    const listing1233Index = listingIds.findIndex(id => Number(id) === 1233);
    if (listing1233Index !== -1) {
      console.log(`\n🎯 Found listing 1233 at index ${listing1233Index} in results!`);
      console.log('Listing 1233 details:', JSON.stringify(listings[listing1233Index], (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      , 2));
    } else {
      const actualIds = listingIds.map(id => Number(id));
      console.log(`\n⚠️ Listing 1233 not found in this range`);
      console.log(`   Actual listing IDs in range: ${actualIds.filter(id => id > 0).join(', ') || 'None'}`);
    }

    // Summary
    const validListings = listings.filter(listing => 
      listing.seller && listing.seller !== '0x0000000000000000000000000000000000000000'
    );
    console.log(`\n📊 Summary:`);
    console.log(`   Total slots checked: ${listings.length}`);
    console.log(`   Valid listings: ${validListings.length}`);
    console.log(`   Empty slots: ${listings.length - validListings.length}`);
    console.log(`\n${'='.repeat(100)}\n`);

  } catch (error) {
    console.error(`❌ Error fetching listings:`, error.message || error);
    if (error.cause) {
      console.error('   Cause:', error.cause);
    }
    throw error;
  }
}

// Execute the script
const START_INDEX = 1200;
const MAX = 35;

fetchListingsRange(START_INDEX, MAX)
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
