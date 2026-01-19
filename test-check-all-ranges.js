// Test script to systematically check all ranges
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
const ERC721_HANDLER = '0xDcC301eCcCb0B13Bc49B34a756cD650eEb99F036';
const ERC1155_HANDLER = '0xC2448a90829Ca7DC25505Fa884B1602Ce7E3b2E2';

function handlerToAddress(handler) {
  if (!handler || handler === '0x' || handler.length < 66) return '';
  return '0x' + handler.slice(-40).toLowerCase();
}

async function checkAllRanges() {
  console.log('=== Systematic Listing Check ===\n');
  
  // Get nextListingId first
  let maxId = 1233;
  try {
    const nextId = await publicClient.readContract({
      address: OTC_MARKETPLACE,
      abi: [{ inputs: [], name: 'nextListingId', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' }],
      functionName: 'nextListingId',
    });
    maxId = Number(nextId);
    console.log(`nextListingId: ${maxId} (checking 0 to ${maxId - 1})\n`);
  } catch (e) {
    console.log(`Could not get nextListingId, using 1233\n`);
  }
  
  // Check in batches, avoiding problematic ranges
  const batchSize = 20; // Smaller batches to avoid errors
  let allValidListings = [];
  let checkedRanges = 0;
  let successfulRanges = 0;
  
  // Sample different parts of the range
  const samplePoints = [
    0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200
  ];
  
  for (const start of samplePoints) {
    if (start >= maxId) continue;
    
    const end = Math.min(start + batchSize, maxId);
    checkedRanges++;
    
    try {
      const result = await publicClient.readContract({
        address: OTC_MARKETPLACE,
        abi: OTC_ABI,
        functionName: 'getAllUnclaimedListings',
        args: [BigInt(start), BigInt(end)],
      });
      
      if (result && Array.isArray(result) && result.length >= 2) {
        const listings = result[0] || [];
        const listingIds = result[1] || [];
        successfulRanges++;
        
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
            
            const saleHandler = handlerToAddress(l.saleTokens[0]?.handler);
            const receiveHandler = handlerToAddress(l.receiveTokens[0]?.handler);
            const saleIsNFT = saleHandler === ERC721_HANDLER.toLowerCase() || 
                              saleHandler === ERC1155_HANDLER.toLowerCase();
            const receiveIsNFT = receiveHandler === ERC721_HANDLER.toLowerCase() || 
                                 receiveHandler === ERC1155_HANDLER.toLowerCase();
            
            return saleIsNFT || receiveIsNFT;
          });
        
        if (valid.length > 0) {
          console.log(`✓ Range ${start}-${end}: Found ${valid.length} valid NFT listings`);
          allValidListings.push(...valid);
        } else {
          const nonZero = listings.filter(l => l.seller !== ZeroAddress).length;
          if (nonZero > 0) {
            console.log(`  Range ${start}-${end}: ${nonZero} non-zero sellers (but no NFTs)`);
          }
        }
      }
    } catch (error) {
      // Skip errors silently for now
    }
  }
  
  console.log(`\n=== Summary ===`);
  console.log(`Checked ${checkedRanges} ranges, ${successfulRanges} successful`);
  console.log(`Total valid NFT listings found: ${allValidListings.length}`);
  
  if (allValidListings.length > 0) {
    console.log(`\nListing IDs: ${allValidListings.map(l => l.listingId).sort((a, b) => a - b).join(', ')}`);
    console.log(`\nThis means there are currently ${allValidListings.length} valid NFT listings available.`);
  } else {
    console.log(`\n⚠ No valid NFT listings found in sampled ranges.`);
    console.log(`This could mean:`);
    console.log(`  - All listings are empty or ERC20-only`);
    console.log(`  - Listings exist but in ranges we haven't checked yet`);
    console.log(`  - The contract structure is different than expected`);
  }
}

checkAllRanges().catch(console.error);
