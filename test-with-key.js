// Test script to fetch listings using a private key
// WARNING: This private key is for testing only - DO NOT commit to git!

import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { defineChain } from 'viem';

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
  blockExplorers: {
    default: {
      name: 'ApeChain Explorer',
      url: 'https://apechain.calderaexplorer.xyz',
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

function handlerToAddress(handler) {
  if (!handler || handler === '0x' || handler.length < 66) return '';
  return '0x' + handler.slice(-40).toLowerCase();
}

async function testListings() {
  try {
    console.log('🔐 Creating wallet from private key...');
    const account = privateKeyToAccount(PRIVATE_KEY);
    console.log(`   Account address: ${account.address}\n`);

    const publicClient = createPublicClient({
      chain: apeChainMainnet,
      transport: http(apeChainMainnet.rpcUrls.default.http[0]),
    });

    const walletClient = createWalletClient({
      account,
      chain: apeChainMainnet,
      transport: http(apeChainMainnet.rpcUrls.default.http[0]),
    });

    console.log('🔍 Fetching listings from ApeChain...\n');
    
    // Get nextListingId
    console.log('📊 Getting nextListingId...');
    const nextListingId = await publicClient.readContract({
      address: OTC_MARKETPLACE,
      abi: swapContractABI,
      functionName: 'nextListingId',
    });

    const totalListings = Number(nextListingId);
    console.log(`   nextListingId: ${totalListings}`);
    console.log(`   Will test up to listing ID 10,000\n`);

    let allListings = [];
    let validListings = 0;
    let nftListings = 0;
    let erc721Listings = 0;
    let erc1155Listings = 0;

    // Test systematically up to 10,000
    const MAX_TEST_ID = 10000;
    const SMALL_BATCH = 20; // Small batches to avoid errors
    const totalBatches = Math.ceil(MAX_TEST_ID / SMALL_BATCH);
    
    let listings = [];
    let listingIds = [];
    let successfulBatches = 0;
    let failedBatches = 0;
    
    console.log(`📦 Testing ${totalBatches} batches of ${SMALL_BATCH} (up to ID ${MAX_TEST_ID})...\n`);
    
    // Test in chunks, skipping ranges that fail
    for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
      const start = batchNum * SMALL_BATCH;
      const end = Math.min(start + SMALL_BATCH, MAX_TEST_ID);
      
      try {
        const result = await publicClient.readContract({
          address: OTC_MARKETPLACE,
          abi: swapContractABI,
          functionName: 'getAllUnclaimedListings',
          args: [BigInt(start), BigInt(end)],
        });

        // Handle the result
        if (Array.isArray(result) && result.length >= 2) {
          const batchListings = result[0] || [];
          const batchIds = result[1] || [];
          
          // Count valid listings in this batch
          let validInBatch = 0;
          let nftInBatch = 0;
          
          batchListings.forEach((listing, idx) => {
            if (listing.seller !== ZeroAddress && 
                listing.tokensForSale?.length > 0 && 
                listing.tokensToReceive?.length > 0) {
              validInBatch++;
              
              // Quick NFT check
              const tokenForSale = listing.tokensForSale[0];
              const tokenToReceive = listing.tokensToReceive[0];
              const srcHandlerAddr = handlerToAddress(tokenForSale?.handler);
              const destHandlerAddr = handlerToAddress(tokenToReceive?.handler);
              const erc721Handler = ERC721_HANDLER.toLowerCase();
              const erc1155Handler = ERC1155_HANDLER.toLowerCase();
              
              if (srcHandlerAddr === erc721Handler || srcHandlerAddr === erc1155Handler ||
                  destHandlerAddr === erc721Handler || destHandlerAddr === erc1155Handler) {
                nftInBatch++;
              }
            }
          });
          
          // Always log successful batches to see what we're getting
          if (batchListings.length > 0) {
            console.log(`   ✅ Batch ${batchNum + 1} (IDs ${start}-${end}): ${batchListings.length} listings, ${validInBatch} valid (${nftInBatch} NFTs)`);
            
            // Show sample of ALL listings (not just valid) to understand the data
            let shown = 0;
            batchListings.forEach((listing, idx) => {
              if (shown < 5) {
                try {
                  const id = batchIds[idx] ? (typeof batchIds[idx] === 'bigint' ? Number(batchIds[idx]) : Number(batchIds[idx])) : (start + idx);
                  const seller = listing.seller || '0x0';
                  const hasTokensForSale = listing.tokensForSale?.length > 0;
                  const hasTokensToReceive = listing.tokensToReceive?.length > 0;
                  const endpoint = Number(listing.destinationEndpoint || 0);
                  
                  console.log(`      Listing #${id}: Seller ${seller.slice(0, 12)}..., Endpoint ${endpoint}, HasSale: ${hasTokensForSale}, HasReceive: ${hasTokensToReceive}`);
                  
                  if (hasTokensForSale && hasTokensToReceive && seller !== ZeroAddress) {
                    const tokenForSale = listing.tokensForSale[0];
                    const tokenToReceive = listing.tokensToReceive[0];
                    const srcHandlerAddr = handlerToAddress(tokenForSale?.handler);
                    const destHandlerAddr = handlerToAddress(tokenToReceive?.handler);
                    const erc721Handler = ERC721_HANDLER.toLowerCase();
                    const erc1155Handler = ERC1155_HANDLER.toLowerCase();
                    
                    const nftTypes = [];
                    if (srcHandlerAddr === erc721Handler) nftTypes.push('src:ERC721');
                    if (srcHandlerAddr === erc1155Handler) nftTypes.push('src:ERC1155');
                    if (destHandlerAddr === erc721Handler) nftTypes.push('dest:ERC721');
                    if (destHandlerAddr === erc1155Handler) nftTypes.push('dest:ERC1155');
                    
                    console.log(`         Sale: ${tokenForSale.contractAddress?.slice(0, 10)}... (handler: ${srcHandlerAddr.slice(0, 10)}...)`);
                    console.log(`         Receive: ${tokenToReceive.contractAddress?.slice(0, 10)}... (handler: ${destHandlerAddr.slice(0, 10)}...)`);
                    console.log(`         NFT Types: ${nftTypes.join(', ') || 'non-NFT'}`);
                  }
                  shown++;
                } catch (e) {
                  // Skip if can't convert ID
                }
              }
            });
          }
          
          if (validInBatch > 0) {
            validListings += validInBatch;
          }
          
          listings = listings.concat(batchListings);
          listingIds = listingIds.concat(batchIds);
          successfulBatches++;
        } else {
          failedBatches++;
        }
      } catch (error) {
        failedBatches++;
        // Silently skip errors - most batches will fail/revert
      }
      
      // Show progress every 100 batches
      if ((batchNum + 1) % 100 === 0) {
        console.log(`   Progress: ${batchNum + 1}/${totalBatches} batches tested, ${successfulBatches} successful, ${validListings} valid listings found so far...`);
      }
      
      // Small delay to avoid rate limiting
      if ((batchNum + 1) % 50 === 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    console.log(`\n   Completed: ${successfulBatches} successful batches, ${failedBatches} failed batches`);
    
    console.log(`\n   Total listings fetched: ${listings.length}\n`);
    
    // Process all fetched listings
    if (listings && listings.length > 0) {
      console.log(`   Processing ${listings.length} listings...\n`);
      
      listings.forEach((listing, index) => {
        // Safely convert listingId to number
        let listingId;
        try {
          const id = listingIds[index];
          if (id !== undefined && id !== null) {
            listingId = typeof id === 'bigint' ? Number(id) : Number(id);
            // Check if it's a safe integer
            if (!Number.isSafeInteger(listingId)) {
              listingId = index; // Fallback to index
            }
          } else {
            listingId = index;
          }
        } catch (e) {
          listingId = index;
        }
          
          const seller = listing.seller;
          const hasTokensForSale = listing.tokensForSale && listing.tokensForSale.length > 0;
          const hasTokensToReceive = listing.tokensToReceive && listing.tokensToReceive.length > 0;
          const destinationEndpoint = Number(listing.destinationEndpoint || 0);
          
          // Check if valid (not zero address and has tokens)
          const isValid = seller !== ZeroAddress && 
                         hasTokensForSale && 
                         hasTokensToReceive &&
                         destinationEndpoint !== 33139; // Filter out ApeChain
          
          // Debug first few listings
          if (index < 5) {
            console.log(`   Listing ${index + 1}:`, {
              listingId,
              seller: seller.slice(0, 10) + '...',
              isZeroAddress: seller === ZeroAddress,
              hasTokensForSale,
              hasTokensToReceive,
              destinationEndpoint,
              isValid,
            });
          }
          
          if (isValid) {
            validListings++;
            
            // Extract tokens
            const tokenForSale = listing.tokensForSale[0];
            const tokenToReceive = listing.tokensToReceive[0];
            
            // Check if NFT
            const srcHandlerAddr = handlerToAddress(tokenForSale?.handler);
            const destHandlerAddr = handlerToAddress(tokenToReceive?.handler);
            
            const erc721Handler = ERC721_HANDLER.toLowerCase();
            const erc1155Handler = ERC1155_HANDLER.toLowerCase();
            
            const srcIsERC721 = srcHandlerAddr === erc721Handler;
            const srcIsERC1155 = srcHandlerAddr === erc1155Handler;
            const destIsERC721 = destHandlerAddr === erc721Handler;
            const destIsERC1155 = destHandlerAddr === erc1155Handler;
            
            const isNFT = srcIsERC721 || srcIsERC1155 || destIsERC721 || destIsERC1155;
            
            if (isNFT) {
              nftListings++;
              if (srcIsERC721 || destIsERC721) erc721Listings++;
              if (srcIsERC1155 || destIsERC1155) erc1155Listings++;
              
              if (nftListings <= 5) {
                const nftTypes = [];
                if (srcIsERC721) nftTypes.push('src:ERC721');
                if (srcIsERC1155) nftTypes.push('src:ERC1155');
                if (destIsERC721) nftTypes.push('dest:ERC721');
                if (destIsERC1155) nftTypes.push('dest:ERC1155');
                
                console.log(`   📦 NFT Listing #${listingId}:`);
                console.log(`      Seller: ${seller.slice(0, 10)}...${seller.slice(-8)}`);
                console.log(`      Types: ${nftTypes.join(', ')}`);
                console.log(`      Sale Token: ${tokenForSale.contractAddress.slice(0, 10)}... (handler: ${srcHandlerAddr.slice(0, 10)}...)`);
                console.log(`      Receive Token: ${tokenToReceive.contractAddress.slice(0, 10)}... (handler: ${destHandlerAddr.slice(0, 10)}...)`);
                console.log(`      Endpoint: ${destinationEndpoint}`);
                console.log('');
              }
            }
            
            allListings.push({
              listingId,
              seller,
              destinationEndpoint,
              isNFT,
              srcIsERC721,
              srcIsERC1155,
              destIsERC721,
              destIsERC1155,
            });
          }
        });
    } else {
      console.log(`   ⚠ No listings found`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('📈 TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`Total listing slots: ${totalListings}`);
    console.log(`Listings in first batch: ${allListings.length}`);
    console.log(`Valid listings (after filters): ${validListings}`);
    console.log(`NFT listings found: ${nftListings}`);
    console.log(`  - ERC721: ${erc721Listings}`);
    console.log(`  - ERC1155: ${erc1155Listings}`);
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testListings();
