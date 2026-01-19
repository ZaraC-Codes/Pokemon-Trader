// Test script to count actual listings from the contract
import { createPublicClient, http, defineChain } from 'viem';

const OTC_MARKETPLACE = '0xe190E7cA0C7C7438CBaFca49457e1DCeE6c6CdAf'; // Updated from config

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
  blockExplorers: {
    default: {
      name: 'ApeChain Explorer',
      url: 'https://apechain.calderaexplorer.xyz',
    },
  },
});

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
          { internalType: "bytes", name: "extraBuyInfo", type: "bytes" },
          { internalType: "bytes", name: "extraSellInfo", type: "bytes" },
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
const BATCH_SIZE = 500;

async function countListings() {
  try {
    console.log('🔍 Fetching listings from ApeChain...\n');
    
    const publicClient = createPublicClient({
      chain: apeChainMainnet,
      transport: http(apeChainMainnet.rpcUrls.default.http[0]),
    });

    // Get nextListingId
    console.log('📊 Getting nextListingId...');
    const nextListingId = await publicClient.readContract({
      address: OTC_MARKETPLACE,
      abi: swapContractABI,
      functionName: 'nextListingId',
    });

    const totalListings = Number(nextListingId);
    console.log(`   nextListingId: ${totalListings}\n`);

    if (totalListings === 0) {
      console.log('❌ No listings found (nextListingId is 0)');
      return;
    }

    // Calculate batches
    const batches = Math.ceil(totalListings / BATCH_SIZE);
    console.log(`📦 Fetching in ${batches} batch(es) of ${BATCH_SIZE}...\n`);

    let allListings = [];
    let validListings = 0;
    let invalidListings = 0;

    // Fetch all batches
    for (let i = 0; i < batches; i++) {
      const start = i * BATCH_SIZE;
      const end = Math.min(start + BATCH_SIZE, totalListings);
      
      try {
        console.log(`   Fetching batch ${i + 1}/${batches} (${start}-${end})...`);
        
        const result = await publicClient.readContract({
          address: OTC_MARKETPLACE,
          abi: swapContractABI,
          functionName: 'getAllUnclaimedListings',
          args: [BigInt(start), BigInt(end)],
        });

        // Handle BigInt values properly
        const [listings, listingIds] = result;
        
        // Convert listingIds to numbers safely
        const safeListingIds = listingIds.map(id => {
          try {
            return Number(id);
          } catch (e) {
            return null;
          }
        });
        
        if (listings && listings.length > 0) {
          console.log(`   ✓ Found ${listings.length} listings in this batch`);
          
          listings.forEach((listing, index) => {
            const listingId = safeListingIds[index] || (start + index);
            const seller = listing.seller;
            const hasTokensForSale = listing.tokensForSale && listing.tokensForSale.length > 0;
            const hasTokensToReceive = listing.tokensToReceive && listing.tokensToReceive.length > 0;
            const destinationEndpoint = Number(listing.destinationEndpoint || 0);
            
            // Check if valid
            const isValid = seller !== ZeroAddress && 
                           hasTokensForSale && 
                           hasTokensToReceive &&
                           destinationEndpoint !== 33139; // Filter out ApeChain
            
            if (isValid) {
              validListings++;
              allListings.push({
                listingId,
                seller,
                destinationEndpoint,
                tokensForSale: listing.tokensForSale.length,
                tokensToReceive: listing.tokensToReceive.length,
              });
            } else {
              invalidListings++;
            }
          });
        } else {
          console.log(`   ⚠ No listings in this batch`);
        }
      } catch (error) {
        console.log(`   ❌ Error fetching batch ${i + 1}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📈 SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total listing slots: ${totalListings}`);
    console.log(`Valid listings found: ${validListings}`);
    console.log(`Invalid listings: ${invalidListings}`);
    console.log(`Filtered out (ApeChain endpoints): ${allListings.filter(l => l.destinationEndpoint === 33139).length}`);
    console.log('\n✅ Final count of valid listings:', validListings);
    
    if (validListings > 0) {
      console.log('\n📋 Sample listings:');
      allListings.slice(0, 5).forEach(listing => {
        console.log(`   - Listing #${listing.listingId}: Seller ${listing.seller.slice(0, 10)}..., Endpoint ${listing.destinationEndpoint}`);
      });
      if (validListings > 5) {
        console.log(`   ... and ${validListings - 5} more`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

countListings();
