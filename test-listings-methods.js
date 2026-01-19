// Test script to verify the listing methods work correctly
// This simulates the key functions from useAllListings.tsx

console.log('Testing listing methods...\n');

// Test 1: Verify BATCH_SIZE constant
const BATCH_SIZE = 500;
console.log('✓ BATCH_SIZE:', BATCH_SIZE);

// Test 2: Simulate getListingsForChain logic
function simulateGetListingsForChain(nextListingId) {
  const batches = Math.ceil(Number(nextListingId.toString()) / BATCH_SIZE);
  console.log(`✓ For nextListingId ${nextListingId}, batches needed: ${batches}`);
  
  const calls = new Array(batches).fill({}).map((_, index) => ({
    start: index * BATCH_SIZE,
    end: index * BATCH_SIZE + BATCH_SIZE,
  }));
  
  console.log(`  Batch ranges:`, calls.map(c => `${c.start}-${c.end}`).join(', '));
  return calls;
}

// Test with different nextListingId values
console.log('\n--- Testing getListingsForChain logic ---');
simulateGetListingsForChain(0n);
simulateGetListingsForChain(500n);
simulateGetListingsForChain(1233n);
simulateGetListingsForChain(2000n);

// Test 3: Simulate filtering logic
function simulateFiltering(listings) {
  const ZeroAddress = '0x0000000000000000000000000000000000000000';
  
  const filtered = listings.filter((val) => 
    val.seller !== ZeroAddress && 
    val?.tokenForSale && 
    val?.tokenToReceive
  ).filter(x => x.destinationEndpoint !== 1);
  
  console.log(`✓ Filtered ${listings.length} listings to ${filtered.length} valid listings`);
  return filtered;
}

console.log('\n--- Testing filtering logic ---');
const testListings = [
  { seller: '0x0000000000000000000000000000000000000000', tokenForSale: {}, tokenToReceive: {}, destinationEndpoint: 1 },
  { seller: '0x123', tokenForSale: { handler: 'ERC721' }, tokenToReceive: { handler: 'ERC20' }, destinationEndpoint: 30112 },
  { seller: '0x456', tokenForSale: { handler: 'ERC1155' }, tokenToReceive: { handler: 'ERC721' }, destinationEndpoint: 2 },
];
simulateFiltering(testListings);

// Test 4: Simulate collection data mapping
function simulateCollectionMapping(listings) {
  let keysToCollectionListing = {};
  let keysToHandler = {};
  let keysToChainId = {};
  
  // Mock chainToHandler
  const chainToHandler = {
    33139: {
      ERC721: '0xDcC301eCcCb0B13Bc49B34a756cD650eEb99F036',
      ERC1155: '0xC2448a90829Ca7DC25505Fa884B1602Ce7E3b2E2',
    }
  };
  
  listings.forEach((listing) => {
    const srcIsNft =
      chainToHandler[listing.srcChain]?.["ERC721"] === listing.tokenForSale.handler ||
      chainToHandler[listing.srcChain]?.["ERC1155"] === listing.tokenForSale.handler;
    
    if (srcIsNft) {
      if (!keysToCollectionListing[listing.tokenForSale.contractAddress]) {
        keysToCollectionListing[listing.tokenForSale.contractAddress] = new Set();
      }
      keysToCollectionListing[listing.tokenForSale.contractAddress].add(listing.tokenForSale.value);
    }
  });
  
  console.log(`✓ Mapped ${Object.keys(keysToCollectionListing).length} collections`);
  Object.keys(keysToCollectionListing).forEach(addr => {
    console.log(`  - ${addr}: ${keysToCollectionListing[addr].size} tokens`);
  });
  
  return keysToCollectionListing;
}

console.log('\n--- Testing collection mapping ---');
const testListings2 = [
  { 
    srcChain: 33139, 
    tokenForSale: { 
      contractAddress: '0x123', 
      handler: '0xDcC301eCcCb0B13Bc49B34a756cD650eEb99F036',
      value: 1 
    } 
  },
  { 
    srcChain: 33139, 
    tokenForSale: { 
      contractAddress: '0x123', 
      handler: '0xDcC301eCcCb0B13Bc49B34a756cD650eEb99F036',
      value: 2 
    } 
  },
];
simulateCollectionMapping(testListings2);

console.log('\n✅ All method tests completed!');
console.log('\nNote: This is a simulation. To test actual contract calls,');
console.log('you need to run the application with a connected wallet.');
