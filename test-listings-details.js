// Test script to see detailed breakdown of listings
import { createPublicClient, http } from 'viem';

const APECHAIN_RPC = 'https://apechain-mainnet.g.alchemy.com/v2/iaNpJew_PfWaRTLVtZ15PDXLh4W584L9';
const OTC_MARKETPLACE = '0xe190E7cA0C7C7438CBaFca49457e1DCeE6c6CdAf';

const publicClient = createPublicClient({
  chain: { id: 33139, name: 'ApeChain', network: 'apechain' },
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
const ERC20_HANDLER = '0x5027F2e6E8271FeF7811d146Dd3F3319e2C76252';

function handlerToAddress(handler) {
  if (!handler || handler === '0x' || handler.length < 66) return '';
  return '0x' + handler.slice(-40).toLowerCase();
}

async function checkListingsDetails() {
  console.log('=== Detailed Listing Analysis ===\n');
  
  // Try index 50 which worked before
  try {
    console.log('Fetching listings from index 50 to 100...\n');
    
    const result = await publicClient.readContract({
      address: OTC_MARKETPLACE,
      abi: OTC_ABI,
      functionName: 'getAllUnclaimedListings',
      args: [50n, 100n],
    });
    
    if (result && Array.isArray(result) && result.length >= 2) {
      const listings = result[0] || [];
      const listingIds = result[1] || [];
      
      console.log(`Total listings fetched: ${listings.length}\n`);
      
      const stats = {
        total: listings.length,
        zeroSeller: 0,
        noSaleTokens: 0,
        noReceiveTokens: 0,
        erc20Only: 0,
        hasNFT: 0,
        validNFT: 0,
      };
      
      listings.forEach((listing, idx) => {
        const listingId = Number(listingIds[idx] || (50 + idx));
        const seller = listing.seller;
        const saleTokens = listing.tokensForSale || [];
        const receiveTokens = listing.tokensToReceive || [];
        
        if (seller === ZeroAddress) {
          stats.zeroSeller++;
          return;
        }
        
        if (saleTokens.length === 0) {
          stats.noSaleTokens++;
          return;
        }
        
        if (receiveTokens.length === 0) {
          stats.noReceiveTokens++;
          return;
        }
        
        const saleHandler = handlerToAddress(saleTokens[0]?.handler);
        const receiveHandler = handlerToAddress(receiveTokens[0]?.handler);
        
        const saleIsNFT = saleHandler === ERC721_HANDLER.toLowerCase() || 
                          saleHandler === ERC1155_HANDLER.toLowerCase();
        const receiveIsNFT = receiveHandler === ERC721_HANDLER.toLowerCase() || 
                             receiveHandler === ERC1155_HANDLER.toLowerCase();
        
        if (saleIsNFT || receiveIsNFT) {
          stats.hasNFT++;
          stats.validNFT++;
        } else {
          stats.erc20Only++;
        }
      });
      
      console.log('=== Statistics ===');
      console.log(`Total listings: ${stats.total}`);
      console.log(`  - Zero seller (empty): ${stats.zeroSeller}`);
      console.log(`  - No sale tokens: ${stats.noSaleTokens}`);
      console.log(`  - No receive tokens: ${stats.noReceiveTokens}`);
      console.log(`  - ERC20 only (no NFTs): ${stats.erc20Only}`);
      console.log(`  - Has NFT (valid): ${stats.validNFT}`);
      
      // Show examples of each type
      console.log('\n=== Example Listings ===');
      let zeroSellerExample = null;
      let erc20Example = null;
      let nftExample = null;
      
      listings.forEach((listing, idx) => {
        const listingId = Number(listingIds[idx] || (50 + idx));
        const seller = listing.seller;
        const saleTokens = listing.tokensForSale || [];
        const receiveTokens = listing.tokensToReceive || [];
        
        if (!zeroSellerExample && seller === ZeroAddress) {
          zeroSellerExample = { listingId, seller, saleTokens, receiveTokens };
        }
        
        if (!erc20Example && seller !== ZeroAddress && saleTokens.length > 0 && receiveTokens.length > 0) {
          const saleHandler = handlerToAddress(saleTokens[0]?.handler);
          const receiveHandler = handlerToAddress(receiveTokens[0]?.handler);
          const saleIsNFT = saleHandler === ERC721_HANDLER.toLowerCase() || 
                            saleHandler === ERC1155_HANDLER.toLowerCase();
          const receiveIsNFT = receiveHandler === ERC721_HANDLER.toLowerCase() || 
                               receiveHandler === ERC1155_HANDLER.toLowerCase();
          if (!saleIsNFT && !receiveIsNFT) {
            erc20Example = { listingId, seller, saleTokens, receiveTokens, saleHandler, receiveHandler };
          }
        }
        
        if (!nftExample && seller !== ZeroAddress && saleTokens.length > 0 && receiveTokens.length > 0) {
          const saleHandler = handlerToAddress(saleTokens[0]?.handler);
          const receiveHandler = handlerToAddress(receiveTokens[0]?.handler);
          const saleIsNFT = saleHandler === ERC721_HANDLER.toLowerCase() || 
                            saleHandler === ERC1155_HANDLER.toLowerCase();
          const receiveIsNFT = receiveHandler === ERC721_HANDLER.toLowerCase() || 
                               receiveHandler === ERC1155_HANDLER.toLowerCase();
          if (saleIsNFT || receiveIsNFT) {
            nftExample = { listingId, seller, saleTokens, receiveTokens, saleHandler, receiveHandler };
          }
        }
      });
      
      if (zeroSellerExample) {
        console.log('\nEmpty Listing Example:');
        console.log(`  ID: ${zeroSellerExample.listingId}`);
        console.log(`  Seller: ${zeroSellerExample.seller}`);
      }
      
      if (erc20Example) {
        console.log('\nERC20-Only Listing Example:');
        console.log(`  ID: ${erc20Example.listingId}`);
        console.log(`  Seller: ${erc20Example.seller}`);
        console.log(`  Sale Handler: ${erc20Example.saleHandler}`);
        console.log(`  Receive Handler: ${erc20Example.receiveHandler}`);
        console.log(`  Sale Contract: ${erc20Example.saleTokens[0]?.contractAddress}`);
        console.log(`  Receive Contract: ${erc20Example.receiveTokens[0]?.contractAddress}`);
      }
      
      if (nftExample) {
        console.log('\nNFT Listing Example:');
        console.log(`  ID: ${nftExample.listingId}`);
        console.log(`  Seller: ${nftExample.seller}`);
        console.log(`  Sale Handler: ${nftExample.saleHandler}`);
        console.log(`  Receive Handler: ${nftExample.receiveHandler}`);
        console.log(`  Sale Contract: ${nftExample.saleTokens[0]?.contractAddress}`);
        console.log(`  Receive Contract: ${nftExample.receiveTokens[0]?.contractAddress}`);
      }
      
      console.log('\n=== Summary ===');
      console.log(`Currently, there are ${stats.validNFT} valid NFT listings in the range 50-100.`);
      console.log(`All other listings are either empty or ERC20-only.`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkListingsDetails().catch(console.error);
