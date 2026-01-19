// Test script to check listings by skipping empty slots
import { createPublicClient, http } from 'viem';

const APECHAIN_RPC = 'https://apechain-mainnet.g.alchemy.com/v2/iaNpJew_PfWaRTLVtZ15PDXLh4W584L9';
const OTC_MARKETPLACE = '0xe190E7cA0C7C7438CBaFca49457e1DCeE6c6CdAf';

const apeChainMainnet = {
  id: 33139,
  name: 'ApeChain',
  network: 'apechain',
  nativeCurrency: {
    decimals: 18,
    name: 'ApeCoin',
    symbol: 'APE',
  },
  rpcUrls: {
    default: { http: [APECHAIN_RPC] },
  },
};

const publicClient = createPublicClient({
  chain: apeChainMainnet,
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

async function checkListingsWithSkip() {
  console.log('=== Checking Listings (Trying Different Start Indices) ===\n');
  
  // Try different start indices to skip empty slots
  const startIndices = [0, 10, 20, 50, 100, 200];
  const batchSize = 50;
  let allValidListings = [];
  
  for (const startIdx of startIndices) {
    try {
      console.log(`Trying start index ${startIdx} to ${startIdx + batchSize}...`);
      
      const result = await publicClient.readContract({
        address: OTC_MARKETPLACE,
        abi: OTC_ABI,
        functionName: 'getAllUnclaimedListings',
        args: [BigInt(startIdx), BigInt(startIdx + batchSize)],
      });
      
      if (result && Array.isArray(result) && result.length >= 2) {
        const listings = result[0] || [];
        const listingIds = result[1] || [];
        
        console.log(`  Fetched ${listings.length} listings`);
        
        // Filter for valid listings
        const validListings = listings
          .map((listing, idx) => ({
            listingId: Number(listingIds[idx] || (startIdx + idx)),
            seller: listing.seller,
            tokensForSale: listing.tokensForSale || [],
            tokensToReceive: listing.tokensToReceive || [],
            destinationEndpoint: Number(listing.destinationEndpoint || 0),
          }))
          .filter((listing) => {
            // Filter out empty listings
            if (listing.seller === ZeroAddress) return false;
            if (!listing.tokensForSale || listing.tokensForSale.length === 0) return false;
            if (!listing.tokensToReceive || listing.tokensToReceive.length === 0) return false;
            
            // Check if at least one side is NFT
            const saleHandler = handlerToAddress(listing.tokensForSale[0]?.handler);
            const receiveHandler = handlerToAddress(listing.tokensToReceive[0]?.handler);
            
            const saleIsNFT = saleHandler === ERC721_HANDLER.toLowerCase() || 
                              saleHandler === ERC1155_HANDLER.toLowerCase();
            const receiveIsNFT = receiveHandler === ERC721_HANDLER.toLowerCase() || 
                                 receiveHandler === ERC1155_HANDLER.toLowerCase();
            
            return saleIsNFT || receiveIsNFT;
          });
        
        console.log(`  Valid NFT listings: ${validListings.length}`);
        
        if (validListings.length > 0) {
          allValidListings.push(...validListings);
          console.log(`  Sample listing IDs: ${validListings.slice(0, 3).map(l => l.listingId).join(', ')}`);
        }
        
        // If we got fewer listings than requested, we might have reached the end
        if (listings.length < batchSize) {
          console.log(`  Reached end of listings (got ${listings.length} < ${batchSize})`);
        }
      }
    } catch (error) {
      console.log(`  ✗ Failed: ${error.message?.substring(0, 80)}`);
      continue;
    }
  }
  
  console.log('\n=== Final Results ===');
  console.log(`Total valid NFT listings found: ${allValidListings.length}`);
  
  if (allValidListings.length > 0) {
    console.log('\n=== Listing IDs Found ===');
    const ids = allValidListings.map(l => l.listingId).sort((a, b) => a - b);
    console.log(`IDs: ${ids.join(', ')}`);
    
    console.log('\n=== Sample Listings ===');
    allValidListings.slice(0, 5).forEach((listing) => {
      const saleHandler = handlerToAddress(listing.tokensForSale[0]?.handler);
      const receiveHandler = handlerToAddress(listing.tokensToReceive[0]?.handler);
      
      console.log(`\nListing ID ${listing.listingId}:`);
      console.log(`  Seller: ${listing.seller}`);
      console.log(`  Sale: ${listing.tokensForSale[0]?.contractAddress} (${saleHandler})`);
      console.log(`  Receive: ${listing.tokensToReceive[0]?.contractAddress} (${receiveHandler})`);
      console.log(`  Endpoint: ${listing.destinationEndpoint}`);
    });
  } else {
    console.log('\n⚠ No valid NFT listings found');
    console.log('This could mean:');
    console.log('  1. All listings are empty/uninitialized');
    console.log('  2. All listings are ERC20-only (no NFTs)');
    console.log('  3. Listings start at a higher index');
  }
}

checkListingsWithSkip().catch(console.error);
