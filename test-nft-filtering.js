// Test NFT filtering logic
import { createPublicClient, http } from 'viem';

const APECHAIN_RPC = 'https://apechain-mainnet.g.alchemy.com/v2/iaNpJew_PfWaRTLVtZ15PDXLh4W584L9';
const OTC_MARKETPLACE = '0xe190E7cA0C7C7438CBaFca49457e1DCeE6c6CdAf';
const ERC721_HANDLER = '0xDcC301eCcCb0B13Bc49B34a756cD650eEb99F036';
const ERC1155_HANDLER = '0xC2448a90829Ca7DC25505Fa884B1602Ce7E3b2E2';
const ERC20_HANDLER = '0x5027F2e6E8271FeF7811d146Dd3F3319e2C76252';

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

function handlerToAddress(handler) {
  if (!handler || handler === '0x' || handler.length < 66) return '';
  return '0x' + handler.slice(-40).toLowerCase();
}

async function testNFTFiltering() {
  console.log('=== Testing NFT Filtering ===\n');
  console.log('ERC721 Handler:', ERC721_HANDLER);
  console.log('ERC1155 Handler:', ERC1155_HANDLER);
  console.log('ERC20 Handler:', ERC20_HANDLER);
  console.log('');

  try {
    const result = await publicClient.readContract({
      address: OTC_MARKETPLACE,
      abi: OTC_ABI,
      functionName: 'getAllUnclaimedListings',
      args: [0n, 10n],
    });
    
    if (result && Array.isArray(result) && result.length >= 2) {
      const listings = result[0] || [];
      const listingIds = result[1] || [];
      
      console.log(`Found ${listings.length} total listings\n`);
      
      // Filter for NFT listings
      const nftListings = listings.filter((listing, idx) => {
        if (listing.seller === '0x0000000000000000000000000000000000000000') {
          return false;
        }
        
        if (!listing.tokensForSale || listing.tokensForSale.length === 0) {
          return false;
        }
        
        if (!listing.tokensToReceive || listing.tokensToReceive.length === 0) {
          return false;
        }
        
        // Check handlers
        const saleToken = listing.tokensForSale[0];
        const receiveToken = listing.tokensToReceive[0];
        
        const saleHandlerAddr = handlerToAddress(saleToken.handler);
        const receiveHandlerAddr = handlerToAddress(receiveToken.handler);
        
        const saleIsNFT = saleHandlerAddr === ERC721_HANDLER.toLowerCase() || 
                          saleHandlerAddr === ERC1155_HANDLER.toLowerCase();
        const receiveIsNFT = receiveHandlerAddr === ERC721_HANDLER.toLowerCase() || 
                             receiveHandlerAddr === ERC1155_HANDLER.toLowerCase();
        
        // At least one side must be NFT
        return saleIsNFT || receiveIsNFT;
      });
      
      console.log(`NFT Listings: ${nftListings.length} out of ${listings.length}\n`);
      
      if (nftListings.length > 0) {
        console.log('NFT Listing Details:');
        nftListings.forEach((listing, idx) => {
          const listingId = listingIds[listings.indexOf(listing)];
          const saleToken = listing.tokensForSale[0];
          const receiveToken = listing.tokensToReceive[0];
          
          const saleHandlerAddr = handlerToAddress(saleToken.handler);
          const receiveHandlerAddr = handlerToAddress(receiveToken.handler);
          
          console.log(`\n  Listing ${listingId}:`);
          console.log(`    Seller: ${listing.seller}`);
          console.log(`    Sale Token:`);
          console.log(`      Contract: ${saleToken.contractAddress}`);
          console.log(`      Handler: ${saleHandlerAddr}`);
          console.log(`      Value: ${saleToken.value.toString()}`);
          console.log(`    Receive Token:`);
          console.log(`      Contract: ${receiveToken.contractAddress}`);
          console.log(`      Handler: ${receiveHandlerAddr}`);
          console.log(`      Value: ${receiveToken.value.toString()}`);
        });
      } else {
        console.log('No NFT listings found (all listings are ERC20 or have zero sellers)');
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testNFTFiltering().catch(console.error);
