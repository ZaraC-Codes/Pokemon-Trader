// Test what the actual getAllListings function returns
import { createPublicClient, http } from 'viem';

const APECHAIN_RPC = 'https://apechain-mainnet.g.alchemy.com/v2/iaNpJew_PfWaRTLVtZ15PDXLh4W584L9';
const OTC_MARKETPLACE = '0xe190E7cA0C7C7438CBaFca49457e1DCeE6c6CdAf';

const publicClient = createPublicClient({
  chain: { id: 33139 },
  transport: http(APECHAIN_RPC),
});

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

// Simulate the actual getAllListings logic
async function simulateGetAllListings() {
  console.log('=== Simulating getAllListings Function ===\n');
  
  // Get nextListingId
  let maxId = 1233;
  try {
    const nextId = await publicClient.readContract({
      address: OTC_MARKETPLACE,
      abi: OTC_ABI,
      functionName: 'nextListingId',
    });
    maxId = Number(nextId);
    console.log(`nextListingId: ${maxId} (will check 0 to ${maxId - 1})\n`);
  } catch (e) {
    console.log(`Could not get nextListingId\n`);
  }
  
  const batchSize = 50;
  let allListings = [];
  let startIdx = 0;
  let consecutiveEmpty = 0;
  const maxConsecutiveEmpty = 50;
  const maxTotalChecks = 2000;
  
  console.log('Fetching in batches (simulating the actual code)...\n');
  
  while (consecutiveEmpty < maxConsecutiveEmpty && startIdx < maxId && startIdx < maxTotalChecks) {
    try {
      const endIdx = Math.min(startIdx + batchSize, maxId);
      
      const result = await publicClient.readContract({
        address: OTC_MARKETPLACE,
        abi: OTC_ABI,
        functionName: 'getAllUnclaimedListings',
        args: [BigInt(startIdx), BigInt(endIdx)],
      });
      
      if (result && Array.isArray(result) && result.length >= 2) {
        const listings = result[0] || [];
        const listingIds = result[1] || [];
        
        // Filter out empty listings (same as the code)
        const validListings = listings
          .map((val, index) => {
            const tokensForSale = val?.tokensForSale ?? [];
            const tokensToReceive = val?.tokensToReceive ?? [];
            const listingId = Number(listingIds[index] || (startIdx + index));
            
            // Skip empty listings
            if (val.seller === ZeroAddress || tokensForSale.length === 0 || tokensToReceive.length === 0) {
              return null;
            }
            
            return {
              listingId,
              seller: val.seller,
              tokensForSale,
              tokensToReceive,
              destinationEndpoint: Number(val.destinationEndpoint || 0),
            };
          })
          .filter((listing) => listing !== null);
        
        if (validListings.length > 0) {
          allListings.push(...validListings);
          consecutiveEmpty = 0;
          console.log(`  Range ${startIdx}-${endIdx}: Found ${validListings.length} valid listings (total so far: ${allListings.length})`);
        } else {
          consecutiveEmpty++;
          if (consecutiveEmpty % 10 === 0) {
            console.log(`  Checked ${consecutiveEmpty} consecutive empty batches (at index ${startIdx})...`);
          }
        }
      }
      
      startIdx = endIdx;
    } catch (error) {
      // Skip errors
      startIdx += batchSize;
      consecutiveEmpty++;
    }
  }
  
  console.log(`\n=== Results ===`);
  console.log(`Total valid listings found: ${allListings.length}`);
  console.log(`Total listing slots checked: ${startIdx}`);
  console.log(`Empty slots skipped: ${startIdx - allListings.length}`);
  
  // Now filter for NFTs (same as getAllListings does)
  const nftListings = allListings.filter((listing) => {
    const srcHandler = listing.tokensForSale?.[0]?.handler;
    const destHandler = listing.tokensToReceive?.[0]?.handler;
    const srcHandlerAddr = handlerToAddress(srcHandler);
    const destHandlerAddr = handlerToAddress(destHandler);
    
    const erc721Handler = ERC721_HANDLER.toLowerCase();
    const erc1155Handler = ERC1155_HANDLER.toLowerCase();
    
    const srcIsNft = srcHandlerAddr === erc721Handler || srcHandlerAddr === erc1155Handler;
    const destIsNFT = destHandlerAddr === erc721Handler || destHandlerAddr === erc1155Handler;
    
    return srcIsNft || destIsNFT;
  });
  
  console.log(`\nAfter NFT filtering: ${nftListings.length} NFT listings`);
  console.log(`ERC20-only listings (filtered out): ${allListings.length - nftListings.length}`);
  
  if (nftListings.length > 0) {
    console.log(`\n✓ SUCCESS: Found ${nftListings.length} NFT listings!`);
    console.log(`Listing IDs: ${nftListings.map(l => l.listingId).slice(0, 10).join(', ')}${nftListings.length > 10 ? '...' : ''}`);
  } else {
    console.log(`\n⚠ No NFT listings found. All ${allListings.length} valid listings are ERC20-only.`);
  }
  
  return {
    totalSlots: startIdx,
    validListings: allListings.length,
    nftListings: nftListings.length,
  };
}

simulateGetAllListings().then(result => {
  console.log(`\n=== Final Answer ===`);
  console.log(`We are NOT returning 1233 listings.`);
  console.log(`We are returning ${result.nftListings} NFT listings out of ${result.validListings} total valid listings.`);
  console.log(`Checked ${result.totalSlots} listing slots (out of 1233 possible).`);
}).catch(console.error);
