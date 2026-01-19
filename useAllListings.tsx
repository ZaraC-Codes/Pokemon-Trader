import { Chain } from "wagmi/chains";
import {
  chainToConfig,
  chainToHandler,
  endpointsToChainId,
  otcAddress,
  supportedChains,
  swapContractConfig,
} from "./src/services/config";
import { readContract, multicall } from "@wagmi/core";
import { useQuery } from "@tanstack/react-query";
import { OTCListing } from "./src/services/types";
const ZeroAddress = '0x0000000000000000000000000000000000000000';
import { getCollectionFetchFn } from "./src/hooks/useNFTBalances";

const BATCH_SIZE = 500;

// Convert handler bytes to address for comparison
function handlerToAddress(handler: string | undefined): string {
  if (!handler || handler === '0x' || handler.length < 66) return '';
  // Extract address from handler bytes (last 40 chars after 0x)
  return '0x' + handler.slice(-40).toLowerCase();
}

async function getListingsForChain(chain: Chain) {
  try {
    const chainConfig = chainToConfig[chain.id];
    console.log(`[getListingsForChain] Fetching listings for chain ${chain.id}...`);
    
    const nextListingId = (await readContract(chainConfig, {
      functionName: "nextListingId",
      address: otcAddress[chain.id] as any,
      abi: swapContractConfig.abi,
      args: [],
    })) as unknown as bigint;

    const totalSlots = Number(nextListingId.toString());
    console.log(`[getListingsForChain] nextListingId: ${totalSlots} (total listing slots)`);
    
    const batches = Math.ceil(totalSlots / BATCH_SIZE);
    console.log(`[getListingsForChain] Will fetch in ${batches} batch(es) of ${BATCH_SIZE}`);

    // ApeChain doesn't support multicall3, so we'll use individual readContract calls
    // Fetch batches sequentially to avoid BigInt conversion issues
    const allResults: any[] = [];
    
    for (let i = 0; i < batches; i++) {
      const start = i * BATCH_SIZE;
      const end = Math.min(start + BATCH_SIZE, totalSlots);
      
      try {
        const result = await readContract(chainConfig, {
          address: otcAddress[chain.id] as any,
          abi: swapContractConfig.abi,
          functionName: "getAllUnclaimedListings",
          args: [BigInt(start), BigInt(end)],
        });
        
        allResults.push({
          status: "success" as const,
          result: result,
        });
        
        if ((i + 1) % 10 === 0 || i < 3) {
          console.log(`[getListingsForChain] Batch ${i + 1}/${batches} (${start}-${end}): Success`);
        }
      } catch (error: any) {
        // Handle errors gracefully - skip problematic batches
        const errorMsg = error?.message || String(error);
        if (errorMsg.includes('out of bounds') || errorMsg.includes('safe integer')) {
          // Skip this batch and continue
          allResults.push({
            status: "failure" as const,
            error: errorMsg,
          });
        } else {
          // Log other errors for first few batches
          if (i < 3) {
            console.warn(`[getListingsForChain] Batch ${i + 1}/${batches} error:`, errorMsg.substring(0, 80));
          }
          allResults.push({
            status: "failure" as const,
            error: errorMsg,
          });
        }
      }
      
      // Small delay to avoid rate limiting
      if (i > 0 && i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    const results = allResults;
    const allListings = results.flatMap((data, batchIndex) => {
      if (data.status === "success" && Array.isArray(data.result) && data.result.length >= 2) {
        try {
          //@ts-ignore
          const listings = data.result[0].map((val, index) => {
            const tokensForSale = val?.tokensForSale ?? [];
            const tokensToReceive = val?.tokensToReceive ?? [];
            
            // Safely convert listingId
            let listingId: number;
            try {
              //@ts-ignore
              const id = data.result[1][index];
              if (id !== undefined && id !== null) {
                listingId = typeof id === 'bigint' ? Number(id) : Number(id);
                if (!Number.isSafeInteger(listingId)) {
                  listingId = batchIndex * BATCH_SIZE + index; // Fallback
                }
              } else {
                listingId = batchIndex * BATCH_SIZE + index;
              }
            } catch (e) {
              listingId = batchIndex * BATCH_SIZE + index;
            }
            
            return {
              ...val,
              tokensForSale,
              tokensToReceive,
              // Keep the existing singular fields used throughout the UI
              tokenForSale: tokensForSale?.[0],
              tokenToReceive: tokensToReceive?.[0],
              listingId,
            };
          });
          
          const validCount = listings.filter(l => 
            l.seller !== ZeroAddress && 
            l.tokensForSale?.length > 0 && 
            l.tokensToReceive?.length > 0
          ).length;
          
          if (batchIndex < 3 || validCount > 0) {
            console.log(`[getListingsForChain] Batch ${batchIndex + 1}/${batches}: ${listings.length} listings (${validCount} valid)`);
          }
          return listings;
        } catch (error: any) {
          console.warn(`[getListingsForChain] Batch ${batchIndex + 1}/${batches}: Error processing result:`, error?.message?.substring(0, 60));
          return [];
        }
      } else {
        // Only log failures for first few batches
        if (batchIndex < 3) {
          console.warn(`[getListingsForChain] Batch ${batchIndex + 1}/${batches}: Failed`);
        }
        return [];
      }
    });
    
    console.log(`[getListingsForChain] ✅ Total listings for chain ${chain.id}: ${allListings.length}`);
    return allListings;
  } catch (error) {
    console.error(`[getListingsForChain] ❌ Error for chain ${chain.id}:`, error);
    return [];
  }
}

async function getAllListings() {
  try {
    console.log('[getAllListings] Starting to fetch listings...');
    const results = await Promise.all(
      supportedChains.map((val) => getListingsForChain(val))
    );

    const totalFetched = results.reduce((sum, arr) => sum + arr.length, 0);
    console.log(`[getAllListings] Total listings fetched from contract: ${totalFetched}`);

    const filteredListings = results.flatMap((val, index) =>
      val
        .map((listing: any) => ({
          ...listing,
          srcChain: supportedChains[index].id,
          dstChain: endpointsToChainId[listing.destinationEndpoint],
        }))
        .filter((val) => val.seller !== ZeroAddress)
    ).filter(x => x.destinationEndpoint != 33139);

    console.log(`[getAllListings] After filtering (seller !== ZeroAddress): ${filteredListings.length}`);
    console.log(`[getAllListings] After filtering (destinationEndpoint != 33139): ${filteredListings.length}`);

    let keysToCollectionListing: Record<string, Set<number>> = {};
    let keysToHandler: Record<string, string> = {};
    let keysToChainId: Record<string, number> = {};
    let nftListingsCount = 0;

    filteredListings.forEach((listing, index) => {
      // Skip if missing required fields
      if (!listing.tokenForSale || !listing.tokenToReceive) {
        if (index < 3) {
          console.log(`[getAllListings] Listing ${index + 1} skipped: missing tokenForSale or tokenToReceive`);
        }
        return;
      }
      
      // Convert handler bytes to addresses for comparison
      const srcHandlerAddr = handlerToAddress(listing.tokenForSale?.handler);
      const destHandlerAddr = handlerToAddress(listing.tokenToReceive?.handler);
      
      const erc721Handler = chainToHandler[listing.srcChain]?.["ERC721"]?.toLowerCase();
      const erc1155Handler = chainToHandler[listing.srcChain]?.["ERC1155"]?.toLowerCase();
      const erc721HandlerDest = chainToHandler[listing.dstChain]?.["ERC721"]?.toLowerCase();
      const erc1155HandlerDest = chainToHandler[listing.dstChain]?.["ERC1155"]?.toLowerCase();
      
      const srcIsERC721 = srcHandlerAddr === erc721Handler;
      const srcIsERC1155 = srcHandlerAddr === erc1155Handler;
      const srcIsNft = srcIsERC721 || srcIsERC1155;
      
      const destIsERC721 = destHandlerAddr === erc721HandlerDest;
      const destIsERC1155 = destHandlerAddr === erc1155HandlerDest;
      const destIsNFT = destIsERC721 || destIsERC1155;
      
      // Debug logging for first few listings
      if (index < 3) {
        console.log(`[getAllListings] Listing ${index + 1} handler check:`, {
          srcHandler: listing.tokenForSale?.handler?.slice(0, 20) + '...',
          srcHandlerAddr,
          erc721Handler,
          erc1155Handler,
          srcIsERC721,
          srcIsERC1155,
          srcIsNft,
          destHandler: listing.tokenToReceive?.handler?.slice(0, 20) + '...',
          destHandlerAddr,
          erc721HandlerDest,
          erc1155HandlerDest,
          destIsERC721,
          destIsERC1155,
          destIsNFT,
        });
      }
      
      if (srcIsNft || destIsNFT) {
        nftListingsCount++;
        if (index < 5) {
          const nftTypes: string[] = [];
          if (srcIsERC721) nftTypes.push('src:ERC721');
          if (srcIsERC1155) nftTypes.push('src:ERC1155');
          if (destIsERC721) nftTypes.push('dest:ERC721');
          if (destIsERC1155) nftTypes.push('dest:ERC1155');
          console.log(`[getAllListings] ✅ NFT Listing ${index + 1} detected: ${nftTypes.join(', ')}`);
        }
      }
      if (srcIsNft) {
        if (!keysToCollectionListing[listing.tokenForSale.contractAddress]) {
          keysToCollectionListing[listing.tokenForSale.contractAddress] =
            new Set();
        }
        if (!keysToHandler[listing.tokenForSale.contractAddress]) {
          keysToHandler[listing.tokenForSale.contractAddress] =
            listing.tokenForSale.handler;
        }
        if (!keysToChainId[listing.tokenForSale.contractAddress]) {
          keysToChainId[listing.tokenForSale.contractAddress] =
            listing.srcChain;
        }
        keysToCollectionListing[listing.tokenForSale.contractAddress].add(
          listing.tokenForSale.value
        );
      }
      if (destIsNFT) {
        if (!keysToCollectionListing[listing.tokenToReceive.contractAddress]) {
          keysToCollectionListing[listing.tokenToReceive.contractAddress] =
            new Set();
        }
        if (!keysToHandler[listing.tokenToReceive.contractAddress]) {
          keysToHandler[listing.tokenToReceive.contractAddress] =
            listing.tokenToReceive.handler;
        }
        if (!keysToChainId[listing.tokenToReceive.contractAddress]) {
          keysToChainId[listing.tokenToReceive.contractAddress] =
            listing.dstChain;
        }
        keysToCollectionListing[listing.tokenToReceive.contractAddress].add(
          listing.tokenToReceive.value
        );
      }
    });

    console.log(`[getAllListings] NFT listings found: ${nftListingsCount}`);
    console.log(`[getAllListings] Collections to fetch metadata for: ${Object.keys(keysToCollectionListing).length}`);

    let collectionToValueToData: Record<string, Record<number, any>> = {};

    for (var collectionAddress of Object.keys(keysToCollectionListing)) {
      const fn = getCollectionFetchFn(collectionAddress);
      if (fn) {
        const fetchedData = await fn(
          Array.from(keysToCollectionListing[collectionAddress]),
          keysToHandler[collectionAddress],
          keysToChainId[collectionAddress],
          collectionAddress
        );

        //eslint-disable-next-line no-loop-func
        fetchedData.map((val) => {
          if (!collectionToValueToData[collectionAddress]) {
            collectionToValueToData[collectionAddress] = {};
          }
          return (collectionToValueToData[collectionAddress][
            Number(val.tokenId)
          ] = val);
        });
      }
    }

    const finalListings = filteredListings.map((listing) => ({
      ...listing,
      extraBuyInfo:
        collectionToValueToData?.[listing.tokenForSale.contractAddress]?.[
        listing.tokenForSale.value
        ],
      extraSellInfo:
        collectionToValueToData?.[listing.tokenToReceive.contractAddress]?.[
        listing.tokenToReceive.value
        ],
    }));

    console.log(`[getAllListings] ✅ Final listings count: ${finalListings.length}`);
    console.log(`[getAllListings] ==========================================`);
    
    return finalListings;
  } catch (error) {
    console.error('[getAllListings] ❌ Error:', error);
    return [];
  }
}

export function useAllListings() {
  const {
    data = [],
    isLoading,
    refetch,
  } = useQuery<OTCListing[]>({
    queryKey: [],
    queryFn: getAllListings,
  });

  return { data: data, isLoading, refetch };
}

// Export the function for direct use outside React components
export { getAllListings };
