// Test script to find actual listings by checking individual IDs
import { createPublicClient, http, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const PRIVATE_KEY = '0xc27de83498d9e7dc59183f864a996c458cb4fdca622f0f7010c22dceef6022d4';

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

const OTC_MARKETPLACE = '0xe190E7cA0C7C7438CBaFca49457e1DCeE6c6CdAf';
const ERC721_HANDLER = '0xDcC301eCcCb0B13Bc49B34a756cD650eEb99F036';
const ERC1155_HANDLER = '0xC2448a90829Ca7DC25505Fa884B1602Ce7E3b2E2';

const swapContractABI = [
  {
    inputs: [],
    name: "nextListingId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "start", type: "uint256" },
      { internalType: "uint256", name: "end", type: "uint256" },
    ],
    name: "getAllUnclaimedListings",
    outputs: [
      {
        components: [
          { internalType: "address", name: "seller", type: "address" },
          { internalType: "uint16", name: "destinationEndpoint", type: "uint16" },
          {
            components: [
              { internalType: "address", name: "contractAddress", type: "address" },
              { internalType: "bytes", name: "handler", type: "bytes" },
              { internalType: "uint256", name: "value", type: "uint256" },
            ],
            internalType: "struct OTC.TokenDetails[]",
            name: "tokensForSale",
            type: "tuple[]",
          },
          {
            components: [
              { internalType: "address", name: "contractAddress", type: "address" },
              { internalType: "bytes", name: "handler", type: "bytes" },
              { internalType: "uint256", name: "value", type: "uint256" },
            ],
            internalType: "struct OTC.TokenDetails[]",
            name: "tokensToReceive",
            type: "tuple[]",
          },
        ],
        internalType: "struct OTC.Listing[]",
        name: "",
        type: "tuple[]",
      },
      { internalType: "uint256[]", name: "", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const ZeroAddress = '0x0000000000000000000000000000000000000000';

function handlerToAddress(handler) {
  if (!handler || handler === '0x' || handler.length < 66) return '';
  return '0x' + handler.slice(-40).toLowerCase();
}

async function findListings() {
  try {
    console.log('🔍 Searching for actual listings...\n');
    
    const account = privateKeyToAccount(PRIVATE_KEY);
    const publicClient = createPublicClient({
      chain: apeChainMainnet,
      transport: http(apeChainMainnet.rpcUrls.default.http[0]),
    });

    // Get nextListingId
    const nextListingId = await publicClient.readContract({
      address: OTC_MARKETPLACE,
      abi: swapContractABI,
      functionName: 'nextListingId',
    });
    const totalSlots = Number(nextListingId);
    console.log(`nextListingId: ${totalSlots}\n`);

    // Try different batch sizes and ranges
    const testRanges = [
      { start: 0, size: 1 },
      { start: 1, size: 1 },
      { start: 10, size: 10 },
      { start: 100, size: 20 },
      { start: 500, size: 20 },
      { start: 1000, size: 20 },
      { start: 1200, size: 33 },
    ];

    let foundListings = [];
    
    for (const range of testRanges) {
      const start = range.start;
      const end = start + range.size;
      
      try {
        console.log(`Testing range ${start}-${end}...`);
        const result = await publicClient.readContract({
          address: OTC_MARKETPLACE,
          abi: swapContractABI,
          functionName: 'getAllUnclaimedListings',
          args: [BigInt(start), BigInt(end)],
        });

        if (Array.isArray(result) && result.length >= 2) {
          const listings = result[0] || [];
          const listingIds = result[1] || [];
          
          listings.forEach((listing, idx) => {
            const seller = listing.seller;
            const hasTokens = listing.tokensForSale?.length > 0 && listing.tokensToReceive?.length > 0;
            
            if (seller !== ZeroAddress && hasTokens) {
              const id = listingIds[idx] ? Number(listingIds[idx]) : (start + idx);
              foundListings.push({
                id,
                seller,
                endpoint: Number(listing.destinationEndpoint || 0),
                tokensForSale: listing.tokensForSale.length,
                tokensToReceive: listing.tokensToReceive.length,
              });
              console.log(`   ✅ Found listing #${id}: Seller ${seller.slice(0, 10)}..., Endpoint ${listing.destinationEndpoint}`);
            }
          });
        }
      } catch (error) {
        // Skip errors
      }
    }
    
    console.log(`\n📊 Found ${foundListings.length} valid listings`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

findListings();
