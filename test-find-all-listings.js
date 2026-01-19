// Comprehensive test to find ALL listings including Mystery NFT (collection offers)
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
const MaxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

function handlerToAddress(handler) {
  if (!handler || handler === '0x' || handler.length < 66) return '';
  return '0x' + handler.slice(-40).toLowerCase();
}

async function findAllListings() {
  console.log('=== Finding ALL Listings (Including Mystery NFT) ===\n');
  
  // Get nextListingId
  let maxId = 1233;
  try {
    const nextId = await publicClient.readContract({
      address: OTC_MARKETPLACE,
      abi: OTC_ABI,
      functionName: 'nextListingId',
    });
    maxId = Number(nextId);
    console.log(`nextListingId: ${maxId} (checking ALL ${maxId} slots)\n`);
  } catch (e) {
    console.log(`Could not get nextListingId\n`);
  }
  
  const batchSize = 50;
  let allListings = [];
  let startIdx = 0;
  let checkedBatches = 0;
  let successfulBatches = 0;
  let errorBatches = 0;
  
  console.log('Scanning ALL listing slots...\n');
  
  // Check EVERY batch, don't stop early
  while (startIdx < maxId) {
    try {
      const endIdx = Math.min(startIdx + batchSize, maxId);
      checkedBatches++;
      
      const result = await publicClient.readContract({
        address: OTC_MARKETPLACE,
        abi: OTC_ABI,
        functionName: 'getAllUnclaimedListings',
        args: [BigInt(startIdx), BigInt(endIdx)],
      });
      
      if (result && Array.isArray(result) && result.length >= 2) {
        const listings = result[0] || [];
        const listingIds = result[1] || [];
        successfulBatches++;
        
        // Process ALL listings, including collection offers (Mystery NFT)
        const validListings = listings
          .map((val, index) => {
            const tokensForSale = val?.tokensForSale ?? [];
            const tokensToReceive = val?.tokensToReceive ?? [];
            const listingId = Number(listingIds[index] || (startIdx + index));
            
            // Skip only truly empty listings
            if (val.seller === ZeroAddress) return null;
            if (tokensForSale.length === 0 || tokensToReceive.length === 0) return null;
            
            const saleToken = tokensForSale[0];
            const receiveToken = tokensToReceive[0];
            
            // Check if it's a collection offer (Mystery NFT)
            const isCollectionOffer = receiveToken.value === MaxUint256;
            
            return {
              listingId,
              seller: val.seller,
              saleTokens: tokensForSale,
              receiveTokens: tokensToReceive,
              destinationEndpoint: Number(val.destinationEndpoint || 0),
              saleContract: saleToken?.contractAddress,
              receiveContract: receiveToken?.contractAddress,
              saleHandler: handlerToAddress(saleToken?.handler),
              receiveHandler: handlerToAddress(receiveToken?.handler),
              saleValue: saleToken?.value?.toString(),
              receiveValue: receiveToken?.value?.toString(),
              isCollectionOffer,
            };
          })
          .filter((listing) => listing !== null);
        
        if (validListings.length > 0) {
          allListings.push(...validListings);
          console.log(`  Range ${startIdx}-${endIdx}: Found ${validListings.length} valid listings (total: ${allListings.length})`);
        }
      }
      
      startIdx = endIdx;
      
      // Progress indicator
      if (checkedBatches % 10 === 0) {
        console.log(`  Progress: ${startIdx}/${maxId} slots checked, ${allListings.length} listings found so far...`);
      }
    } catch (error) {
      errorBatches++;
      // Skip errors and continue
      startIdx += batchSize;
      if (errorBatches % 10 === 0) {
        console.log(`  Skipped ${errorBatches} error batches so far...`);
      }
    }
  }
  
  console.log(`\n=== Scan Complete ===`);
  console.log(`Checked ${checkedBatches} batches (${successfulBatches} successful, ${errorBatches} errors)`);
  console.log(`Total valid listings found: ${allListings.length}`);
  
  // Categorize listings
  const nftListings = allListings.filter((l) => {
    const saleIsNFT = l.saleHandler === ERC721_HANDLER.toLowerCase() || 
                      l.saleHandler === ERC1155_HANDLER.toLowerCase();
    const receiveIsNFT = l.receiveHandler === ERC721_HANDLER.toLowerCase() || 
                         l.receiveHandler === ERC1155_HANDLER.toLowerCase();
    return saleIsNFT || receiveIsNFT;
  });
  
  const collectionOffers = nftListings.filter(l => l.isCollectionOffer);
  const specificNFTs = nftListings.filter(l => !l.isCollectionOffer);
  
  console.log(`\n=== Breakdown ===`);
  console.log(`NFT listings: ${nftListings.length}`);
  console.log(`  - Collection offers (Mystery NFT): ${collectionOffers.length}`);
  console.log(`  - Specific NFT IDs: ${specificNFTs.length}`);
  console.log(`ERC20-only listings: ${allListings.length - nftListings.length}`);
  
  // Show sample listings
  if (specificNFTs.length > 0) {
    console.log(`\n=== Sample Specific NFT Listings (first 10) ===`);
    specificNFTs.slice(0, 10).forEach((l) => {
      console.log(`  Listing ${l.listingId}: Receive NFT ${l.receiveContract} #${l.receiveValue}`);
    });
  }
  
  if (collectionOffers.length > 0) {
    console.log(`\n=== Sample Collection Offers (first 10) ===`);
    collectionOffers.slice(0, 10).forEach((l) => {
      console.log(`  Listing ${l.listingId}: Mystery NFT for collection ${l.receiveContract}`);
    });
  }
  
  return {
    total: allListings.length,
    nft: nftListings.length,
    collectionOffers: collectionOffers.length,
    specificNFTs: specificNFTs.length,
    listings: allListings,
  };
}

findAllListings().then(result => {
  console.log(`\n=== Final Result ===`);
  console.log(`Found ${result.total} total listings`);
  console.log(`  - ${result.nft} NFT listings`);
  console.log(`  - ${result.collectionOffers} collection offers (Mystery NFT)`);
  console.log(`  - ${result.specificNFTs} specific NFT listings`);
  console.log(`\n✓ SUCCESS! The code should now return ${result.nft} NFT listings.`);
}).catch(console.error);
