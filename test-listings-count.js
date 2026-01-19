// Test script to check how many listings are currently available
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

const ERC721_HANDLER = '0xDcC301eCcCb0B13Bc49B34a756cD650eEb99F036';
const ERC1155_HANDLER = '0xC2448a90829Ca7DC25505Fa884B1602Ce7E3b2E2';
const ERC20_HANDLER = '0x5027F2e6E8271FeF7811d146Dd3F3319e2C76252';
const ZeroAddress = '0x0000000000000000000000000000000000000000';

function handlerToAddress(handler) {
  if (!handler || handler === '0x' || handler.length < 66) return '';
  return '0x' + handler.slice(-40).toLowerCase();
}

async function checkListingsCount() {
  console.log('=== Checking Listings Count ===\n');
  
  const ranges = [10, 50, 100, 200, 500, 1000];
  let allListings = [];
  let successfulRange = null;
  
  for (const range of ranges) {
    try {
      console.log(`Trying range: 0 to ${range}...`);
      
      const result = await publicClient.readContract({
        address: OTC_MARKETPLACE,
        abi: OTC_ABI,
        functionName: 'getAllUnclaimedListings',
        args: [0n, BigInt(range)],
      });
      
      if (result && Array.isArray(result) && result.length >= 2) {
        const listings = result[0] || [];
        const listingIds = result[1] || [];
        
        console.log(`✓ Successfully fetched ${listings.length} listings with range ${range}`);
        
        if (listings.length > 0) {
          allListings = listings.map((listing, idx) => ({
            listingId: Number(listingIds[idx] || idx),
            seller: listing.seller,
            tokensForSale: listing.tokensForSale || [],
            tokensToReceive: listing.tokensToReceive || [],
            destinationEndpoint: Number(listing.destinationEndpoint || 0),
          }));
          successfulRange = range;
          
          // If we got fewer listings than the range, we've got them all
          if (listings.length < range) {
            console.log(`\n✓ Found all listings (${listings.length} < ${range})`);
            break;
          }
        } else {
          console.log('  No listings found with this range');
        }
      }
    } catch (error) {
      console.log(`  ✗ Range ${range} failed:`, error.message?.substring(0, 100));
      continue;
    }
  }
  
  console.log('\n=== Results ===');
  console.log(`Total listings fetched: ${allListings.length}`);
  console.log(`Successful range: ${successfulRange || 'None'}`);
  
  if (allListings.length > 0) {
    // Filter for NFT listings
    const nftListings = allListings.filter((listing) => {
      if (listing.seller === ZeroAddress) return false;
      if (!listing.tokensForSale || listing.tokensForSale.length === 0) return false;
      if (!listing.tokensToReceive || listing.tokensToReceive.length === 0) return false;
      
      const saleToken = listing.tokensForSale[0];
      const receiveToken = listing.tokensToReceive[0];
      
      const saleHandlerAddr = handlerToAddress(saleToken.handler);
      const receiveHandlerAddr = handlerToAddress(receiveToken.handler);
      
      const saleIsNFT = saleHandlerAddr === ERC721_HANDLER.toLowerCase() || 
                        saleHandlerAddr === ERC1155_HANDLER.toLowerCase();
      const receiveIsNFT = receiveHandlerAddr === ERC721_HANDLER.toLowerCase() || 
                           receiveHandlerAddr === ERC1155_HANDLER.toLowerCase();
      
      return saleIsNFT || receiveIsNFT;
    });
    
    console.log(`\nNFT listings (after filtering): ${nftListings.length}`);
    console.log(`Non-NFT listings (filtered out): ${allListings.length - nftListings.length}`);
    
    // Count by handler type
    const bySaleHandler = {
      ERC721: 0,
      ERC1155: 0,
      ERC20: 0,
      Other: 0,
    };
    
    const byReceiveHandler = {
      ERC721: 0,
      ERC1155: 0,
      ERC20: 0,
      Other: 0,
    };
    
    nftListings.forEach((listing) => {
      const saleHandler = handlerToAddress(listing.tokensForSale[0]?.handler);
      const receiveHandler = handlerToAddress(listing.tokensToReceive[0]?.handler);
      
      if (saleHandler === ERC721_HANDLER.toLowerCase()) bySaleHandler.ERC721++;
      else if (saleHandler === ERC1155_HANDLER.toLowerCase()) bySaleHandler.ERC1155++;
      else if (saleHandler === ERC20_HANDLER.toLowerCase()) bySaleHandler.ERC20++;
      else bySaleHandler.Other++;
      
      if (receiveHandler === ERC721_HANDLER.toLowerCase()) byReceiveHandler.ERC721++;
      else if (receiveHandler === ERC1155_HANDLER.toLowerCase()) byReceiveHandler.ERC1155++;
      else if (receiveHandler === ERC20_HANDLER.toLowerCase()) byReceiveHandler.ERC20++;
      else byReceiveHandler.Other++;
    });
    
    console.log('\n=== Breakdown by Handler Type ===');
    console.log('Sale Tokens:');
    console.log(`  ERC721: ${bySaleHandler.ERC721}`);
    console.log(`  ERC1155: ${bySaleHandler.ERC1155}`);
    console.log(`  ERC20: ${bySaleHandler.ERC20}`);
    console.log(`  Other: ${bySaleHandler.Other}`);
    console.log('\nReceive Tokens:');
    console.log(`  ERC721: ${byReceiveHandler.ERC721}`);
    console.log(`  ERC1155: ${byReceiveHandler.ERC1155}`);
    console.log(`  ERC20: ${byReceiveHandler.ERC20}`);
    console.log(`  Other: ${byReceiveHandler.Other}`);
    
    // Show ALL listings details to understand why they're filtered
    console.log('\n=== All Listings Details ===');
    allListings.forEach((listing, idx) => {
      const saleHandler = listing.tokensForSale[0]?.handler;
      const receiveHandler = listing.tokensToReceive[0]?.handler;
      const saleHandlerAddr = handlerToAddress(saleHandler);
      const receiveHandlerAddr = handlerToAddress(receiveHandler);
      
      const saleIsNFT = saleHandlerAddr === ERC721_HANDLER.toLowerCase() || 
                        saleHandlerAddr === ERC1155_HANDLER.toLowerCase();
      const receiveIsNFT = receiveHandlerAddr === ERC721_HANDLER.toLowerCase() || 
                           receiveHandlerAddr === ERC1155_HANDLER.toLowerCase();
      
      console.log(`\nListing ${idx + 1} (ID: ${listing.listingId}):`);
      console.log(`  Seller: ${listing.seller} ${listing.seller === ZeroAddress ? '(ZERO - FILTERED)' : ''}`);
      console.log(`  Sale Token: ${listing.tokensForSale[0]?.contractAddress || 'N/A'}`);
      console.log(`  Sale Handler (raw): ${saleHandler?.substring(0, 20)}...`);
      console.log(`  Sale Handler (addr): ${saleHandlerAddr || 'N/A'}`);
      console.log(`  Sale is NFT: ${saleIsNFT}`);
      console.log(`  Receive Token: ${listing.tokensToReceive[0]?.contractAddress || 'N/A'}`);
      console.log(`  Receive Handler (raw): ${receiveHandler?.substring(0, 20)}...`);
      console.log(`  Receive Handler (addr): ${receiveHandlerAddr || 'N/A'}`);
      console.log(`  Receive is NFT: ${receiveIsNFT}`);
      console.log(`  Destination Endpoint: ${listing.destinationEndpoint}`);
      console.log(`  Will be included: ${listing.seller !== ZeroAddress && (saleIsNFT || receiveIsNFT)}`);
    });
    
    console.log('\n=== Expected Handler Addresses ===');
    console.log(`ERC721 Handler: ${ERC721_HANDLER.toLowerCase()}`);
    console.log(`ERC1155 Handler: ${ERC1155_HANDLER.toLowerCase()}`);
    console.log(`ERC20 Handler: ${ERC20_HANDLER.toLowerCase()}`);
  } else {
    console.log('\n⚠ No listings found on the contract');
  }
}

checkListingsCount().catch(console.error);
