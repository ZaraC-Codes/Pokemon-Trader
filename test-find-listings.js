// Test script to find where actual listings are stored
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
  {
    inputs: [],
    name: 'nextListingId',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
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

async function findListings() {
  console.log('=== Finding Actual Listings ===\n');
  
  // First, try to get nextListingId
  try {
    console.log('Trying to get nextListingId...');
    const nextId = await publicClient.readContract({
      address: OTC_MARKETPLACE,
      abi: OTC_ABI,
      functionName: 'nextListingId',
    });
    console.log(`✓ nextListingId: ${nextId}`);
    console.log(`  This means listings should be in range 0 to ${Number(nextId) - 1}\n`);
  } catch (error) {
    console.log(`✗ nextListingId failed: ${error.message?.substring(0, 80)}\n`);
  }
  
  // Try sampling different ranges
  const rangesToTry = [
    [0, 10],
    [10, 20],
    [100, 150],
    [200, 250],
    [500, 550],
    [1000, 1050],
    [2000, 2050],
  ];
  
  let foundValidListings = [];
  
  for (const [start, end] of rangesToTry) {
    try {
      console.log(`Checking range ${start} to ${end}...`);
      
      const result = await publicClient.readContract({
        address: OTC_MARKETPLACE,
        abi: OTC_ABI,
        functionName: 'getAllUnclaimedListings',
        args: [BigInt(start), BigInt(end)],
      });
      
      if (result && Array.isArray(result) && result.length >= 2) {
        const listings = result[0] || [];
        const listingIds = result[1] || [];
        
        // Check for valid listings
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
          console.log(`  ✓ Found ${valid.length} valid NFT listings!`);
          foundValidListings.push(...valid);
        } else {
          const nonZero = listings.filter(l => l.seller !== ZeroAddress).length;
          console.log(`  - ${listings.length} total, ${nonZero} non-zero sellers, 0 valid NFTs`);
        }
      }
    } catch (error) {
      console.log(`  ✗ Failed: ${error.message?.substring(0, 60)}`);
    }
  }
  
  console.log('\n=== Final Results ===');
  console.log(`Total valid NFT listings found: ${foundValidListings.length}`);
  
  if (foundValidListings.length > 0) {
    console.log('\nListing IDs found:');
    foundValidListings.forEach(l => {
      const saleHandler = handlerToAddress(l.saleTokens[0]?.handler);
      const receiveHandler = handlerToAddress(l.receiveTokens[0]?.handler);
      console.log(`  ID ${l.listingId}: Seller ${l.seller.substring(0, 10)}..., Sale: ${saleHandler.substring(0, 10)}..., Receive: ${receiveHandler.substring(0, 10)}...`);
    });
  } else {
    console.log('\n⚠ No valid NFT listings found in any tested range.');
    console.log('This suggests either:');
    console.log('  1. All listings are empty/uninitialized');
    console.log('  2. All listings are ERC20-only');
    console.log('  3. Listings are stored in a different format or location');
  }
}

findListings().catch(console.error);
