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

// ABI for the "listings" mapping getter function
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

async function fetchListing(publicClient, listingId) {
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
    
    return {
      listingId,
      exists: !isEmpty,
      data: {
        destinationEndpoint,
        seller,
        tokenForSale,
        tokenToReceive,
      },
    };
  } catch (error) {
    return {
      listingId,
      exists: false,
      error: error.message || String(error),
    };
  }
}

async function fetchListingsRange(startIndex, endIndex) {
  console.log(`\n=== Fetching Listings ${startIndex} to ${endIndex} using "listings" function ===\n`);
  
  // Create public client
  const publicClient = createPublicClient({
    chain: apeChainMainnet,
    transport: http(),
  });

  const results = [];
  const validListings = [];
  
  console.log(`Querying ${endIndex - startIndex + 1} listings...\n`);
  console.log('='.repeat(100));

  // Query each listing individually
  for (let listingId = startIndex; listingId <= endIndex; listingId++) {
    process.stdout.write(`Querying listing ${listingId}... `);
    
    const result = await fetchListing(publicClient, listingId);
    results.push(result);
    
    if (result.exists) {
      console.log('✅ FOUND');
      validListings.push(result);
      
      const listing = result.data;
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
    } else if (result.error) {
      console.log(`❌ ERROR: ${result.error.substring(0, 50)}`);
    } else {
      // Show raw data for debugging (especially for 1233)
      if (listingId === 1233) {
        console.log(`\n⚠️ Listing 1233 raw data:`);
        console.log(JSON.stringify(result.data, (key, value) => 
          typeof value === 'bigint' ? value.toString() : value
        , 2));
      }
      console.log('Empty');
    }
  }

  // Check specifically for listing 1233
  const listing1233 = results.find(r => r.listingId === 1233);
  if (listing1233 && listing1233.exists) {
    console.log(`\n🎯 Listing 1233 Details:`);
    console.log(JSON.stringify(listing1233.data, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    , 2));
  } else {
    console.log(`\n⚠️ Listing 1233 not found or empty`);
  }

  // Summary
  console.log(`\n📊 Summary:`);
  console.log(`   Total listings checked: ${results.length}`);
  console.log(`   Valid listings found: ${validListings.length}`);
  console.log(`   Empty/Invalid slots: ${results.length - validListings.length}`);
  
  const listingIds = validListings.map(l => l.listingId).sort((a, b) => a - b);
  if (listingIds.length > 0) {
    console.log(`   Valid listing IDs: ${listingIds.join(', ')}`);
  }
  
  console.log(`\n${'='.repeat(100)}\n`);
}

// Execute the script
const START_INDEX = 1200;
const END_INDEX = 1234;

fetchListingsRange(START_INDEX, END_INDEX)
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
