// Script to test different approaches to fetching listings
// Based on the working marketplace at marketplace.ape.clutch.market
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

async function testDifferentApproaches() {
  console.log('=== Testing Different Listing Fetch Approaches ===\n');
  
  // Approach 1: Try smaller batches starting from 0, but handle empty slots
  console.log('Approach 1: Fetch in small batches, skip empty slots...\n');
  
  let allListings = [];
  const batchSize = 20;
  let startIdx = 0;
  let consecutiveEmpty = 0;
  const maxConsecutiveEmpty = 100; // Stop after 100 consecutive empty batches
  
  while (consecutiveEmpty < maxConsecutiveEmpty && startIdx < 2000) {
    try {
      const endIdx = startIdx + batchSize;
      const result = await publicClient.readContract({
        address: OTC_MARKETPLACE,
        abi: OTC_ABI,
        functionName: 'getAllUnclaimedListings',
        args: [BigInt(startIdx), BigInt(endIdx)],
      });
      
      if (result && Array.isArray(result) && result.length >= 2) {
        const listings = result[0] || [];
        const listingIds = result[1] || [];
        
        const valid = listings
          .map((listing, idx) => ({
            listingId: Number(listingIds[idx] || (startIdx + idx)),
            seller: listing.seller,
            saleTokens: listing.tokensForSale || [],
            receiveTokens: listing.tokensToReceive || [],
            destinationEndpoint: Number(listing.destinationEndpoint || 0),
          }))
          .filter((l) => {
            // Don't filter by NFT type yet - just get all valid listings
            if (l.seller === ZeroAddress) return false;
            if (l.saleTokens.length === 0 || l.receiveTokens.length === 0) return false;
            return true;
          });
        
        if (valid.length > 0) {
          console.log(`  Range ${startIdx}-${endIdx}: Found ${valid.length} valid listings`);
          allListings.push(...valid);
          consecutiveEmpty = 0;
        } else {
          consecutiveEmpty++;
          if (consecutiveEmpty % 20 === 0) {
            console.log(`  Checked ${consecutiveEmpty} consecutive empty batches...`);
          }
        }
      }
      
      startIdx = endIdx;
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      // Skip errors and continue
      startIdx += batchSize;
      consecutiveEmpty++;
    }
  }
  
  console.log(`\nTotal valid listings found (any type): ${allListings.length}`);
  
  // Now filter for NFTs
  const nftListings = allListings.filter((l) => {
    const saleHandler = handlerToAddress(l.saleTokens[0]?.handler);
    const receiveHandler = handlerToAddress(l.receiveTokens[0]?.handler);
    const saleIsNFT = saleHandler === ERC721_HANDLER.toLowerCase() || 
                      saleHandler === ERC1155_HANDLER.toLowerCase();
    const receiveIsNFT = receiveHandler === ERC721_HANDLER.toLowerCase() || 
                         receiveHandler === ERC1155_HANDLER.toLowerCase();
    return saleIsNFT || receiveIsNFT;
  });
  
  console.log(`NFT listings: ${nftListings.length}`);
  console.log(`ERC20-only listings: ${allListings.length - nftListings.length}`);
  
  if (nftListings.length > 0) {
    console.log('\n=== Sample NFT Listings ===');
    nftListings.slice(0, 5).forEach((l) => {
      const saleHandler = handlerToAddress(l.saleTokens[0]?.handler);
      const receiveHandler = handlerToAddress(l.receiveTokens[0]?.handler);
      console.log(`\nListing ID ${l.listingId}:`);
      console.log(`  Seller: ${l.seller}`);
      console.log(`  Sale: ${l.saleTokens[0]?.contractAddress} (${saleHandler})`);
      console.log(`  Receive: ${l.receiveTokens[0]?.contractAddress} (${receiveHandler})`);
    });
  }
  
  // Approach 2: Try reverse order (from end)
  console.log('\n\n=== Approach 2: Try fetching from the end ===\n');
  
  try {
    const nextId = await publicClient.readContract({
      address: OTC_MARKETPLACE,
      abi: [{ inputs: [], name: 'nextListingId', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' }],
      functionName: 'nextListingId',
    });
    
    const maxId = Number(nextId);
    console.log(`nextListingId: ${maxId}, trying last 100 listings...`);
    
    const result = await publicClient.readContract({
      address: OTC_MARKETPLACE,
      abi: OTC_ABI,
      functionName: 'getAllUnclaimedListings',
      args: [BigInt(Math.max(0, maxId - 100)), BigInt(maxId)],
    });
    
    if (result && Array.isArray(result) && result.length >= 2) {
      const listings = result[0] || [];
      const listingIds = result[1] || [];
      
      const valid = listings
        .map((listing, idx) => ({
          listingId: Number(listingIds[idx] || (maxId - 100 + idx)),
          seller: listing.seller,
          saleTokens: listing.tokensForSale || [],
          receiveTokens: listing.tokensToReceive || [],
        }))
        .filter((l) => l.seller !== ZeroAddress && l.saleTokens.length > 0 && l.receiveTokens.length > 0);
      
      console.log(`Found ${valid.length} valid listings in last 100`);
      
      if (valid.length > 0) {
        const nftValid = valid.filter((l) => {
          const saleHandler = handlerToAddress(l.saleTokens[0]?.handler);
          const receiveHandler = handlerToAddress(l.receiveTokens[0]?.handler);
          const saleIsNFT = saleHandler === ERC721_HANDLER.toLowerCase() || 
                            saleHandler === ERC1155_HANDLER.toLowerCase();
          const receiveIsNFT = receiveHandler === ERC721_HANDLER.toLowerCase() || 
                               receiveHandler === ERC1155_HANDLER.toLowerCase();
          return saleIsNFT || receiveIsNFT;
        });
        
        console.log(`  NFT listings in last 100: ${nftValid.length}`);
      }
    }
  } catch (error) {
    console.log(`  Failed: ${error.message?.substring(0, 80)}`);
  }
  
  console.log('\n=== Final Summary ===');
  console.log(`Total NFT listings found: ${nftListings.length}`);
  if (nftListings.length === 0) {
    console.log('\n⚠ Still no NFT listings found.');
    console.log('Possible issues:');
    console.log('  1. All listings might be ERC20-only');
    console.log('  2. Listings might be stored differently');
    console.log('  3. The working marketplace might use a different contract or method');
    console.log('\nRecommendation: Check browser devtools on marketplace.ape.clutch.market');
    console.log('  to see what API calls they make to fetch listings.');
  }
}

testDifferentApproaches().catch(console.error);
