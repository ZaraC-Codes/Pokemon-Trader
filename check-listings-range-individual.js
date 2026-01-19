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

async function checkListing(publicClient, listingId) {
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
      data: !isEmpty ? {
        seller,
        destinationEndpoint: Number(destinationEndpoint),
        tokenForSale: {
          contractAddress: tokenForSale.contractAddress,
          handler: tokenForSale.handler,
          value: tokenForSale.value.toString(),
        },
        tokenToReceive: {
          contractAddress: tokenToReceive.contractAddress,
          handler: tokenToReceive.handler,
          value: tokenToReceive.value.toString(),
        },
      } : null,
    };
  } catch (error) {
    return {
      listingId,
      exists: false,
      error: error.message || String(error),
    };
  }
}

async function checkListingsRange(startIndex, endIndex) {
  console.log(`\n=== Checking Listings ${startIndex} to ${endIndex} (one at a time) ===\n`);
  
  // Create public client
  const publicClient = createPublicClient({
    chain: apeChainMainnet,
    transport: http(),
  });

  const existingListings = [];
  const totalToCheck = endIndex - startIndex + 1;
  
  console.log(`Checking ${totalToCheck} listings...\n`);
  console.log('='.repeat(100));

  // Check each listing one at a time
  for (let listingId = startIndex; listingId <= endIndex; listingId++) {
    process.stdout.write(`Checking listing ${listingId}... `);
    
    const result = await checkListing(publicClient, listingId);
    
    if (result.exists && result.data) {
      console.log('✅ EXISTS');
      existingListings.push({
        listingId,
        ...result.data,
      });
    } else if (result.error) {
      console.log(`❌ ERROR: ${result.error.substring(0, 40)}`);
    } else {
      console.log('Empty');
    }
    
    // Small delay to avoid rate limiting
    if ((listingId - startIndex + 1) % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log('\n' + '='.repeat(100));
  console.log('\n📋 FULL LIST OF EXISTING LISTINGS:\n');
  
  if (existingListings.length === 0) {
    console.log('No listings found in this range.');
  } else {
    existingListings.forEach((listing, index) => {
      console.log(`${index + 1}. Listing ID: ${listing.listingId}`);
      console.log(`   Seller: ${listing.seller}`);
      console.log(`   Destination Endpoint: ${listing.destinationEndpoint}`);
      console.log(`   Token For Sale:`);
      console.log(`     - Contract: ${listing.tokenForSale.contractAddress}`);
      console.log(`     - Handler: ${listing.tokenForSale.handler}`);
      console.log(`     - Token ID/Value: ${listing.tokenForSale.value}`);
      console.log(`   Token To Receive:`);
      console.log(`     - Contract: ${listing.tokenToReceive.contractAddress}`);
      console.log(`     - Handler: ${listing.tokenToReceive.handler}`);
      console.log(`     - Value: ${listing.tokenToReceive.value}`);
      console.log('');
    });
    
    // Summary
    console.log('='.repeat(100));
    console.log(`\n📊 Summary:`);
    console.log(`   Total checked: ${totalToCheck}`);
    console.log(`   Existing listings: ${existingListings.length}`);
    console.log(`   Empty slots: ${totalToCheck - existingListings.length}`);
    console.log(`\n   Existing listing IDs: ${existingListings.map(l => l.listingId).join(', ')}`);
    
    // JSON output for easy copy
    console.log('\n📋 JSON Format:');
    console.log(JSON.stringify(existingListings, null, 2));
  }
  
  console.log('\n' + '='.repeat(100) + '\n');
}

// Execute the script
// Check listings from 1 to 1233
const START_INDEX = 1;
const END_INDEX = 1233;

checkListingsRange(START_INDEX, END_INDEX)
  .then(() => {
    console.log('✅ Script completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
