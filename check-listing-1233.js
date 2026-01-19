import { createPublicClient, http, defineChain } from 'viem';

// ApeChain Mainnet configuration
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

const OTC_MARKETPLACE_ADDRESS = '0xe190E7cA0C7C7438CBaFca49457e1DCeE6c6CdAf';

// ABI for the "listings" mapping getter function
const ABI = [
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'listings',
    outputs: [
      { internalType: 'uint32', name: 'destinationEndpoint', type: 'uint32' },
      { internalType: 'address', name: 'seller', type: 'address' },
      {
        components: [
          { internalType: 'address', name: 'contractAddress', type: 'address' },
          { internalType: 'address', name: 'handler', type: 'address' },
          { internalType: 'uint256', name: 'value', type: 'uint256' },
        ],
        internalType: 'struct IListing.Token',
        name: 'tokenForSale',
        type: 'tuple',
      },
      {
        components: [
          { internalType: 'address', name: 'contractAddress', type: 'address' },
          { internalType: 'address', name: 'handler', type: 'address' },
          { internalType: 'uint256', name: 'value', type: 'uint256' },
        ],
        internalType: 'struct IListing.Token',
        name: 'tokenToReceive',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

async function checkListing1233() {
  console.log('\n=== Checking Listing 1233 ===\n');
  
  // Create public client
  const publicClient = createPublicClient({
    chain: apeChainMainnet,
    transport: http(),
  });

  try {
    const result = await publicClient.readContract({
      address: OTC_MARKETPLACE_ADDRESS,
      abi: ABI,
      functionName: 'listings',
      args: [BigInt(1233)],
    });

    // The listings function returns an array: [destinationEndpoint, seller, tokenForSale, tokenToReceive]
    const destinationEndpoint = result[0];
    const seller = result[1];
    const tokenForSale = result[2];
    const tokenToReceive = result[3];

    // Check if listing exists (seller is not zero address)
    const isEmpty = !seller || seller === '0x0000000000000000000000000000000000000000';

    if (isEmpty) {
      console.log('❌ Listing 1233 is empty or does not exist');
      console.log('\nRaw data:', JSON.stringify(result, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value
      , 2));
      return;
    }

    console.log('✅ Listing 1233 found!\n');
    console.log('='.repeat(80));
    console.log(`Listing ID: 1233`);
    console.log(`Seller: ${seller}`);
    console.log(`Destination Endpoint: ${destinationEndpoint}`);
    console.log('\nToken For Sale:');
    console.log(`  - Contract: ${tokenForSale.contractAddress}`);
    console.log(`  - Handler: ${tokenForSale.handler}`);
    console.log(`  - Token ID/Value: ${tokenForSale.value.toString()}`);
    console.log('\nToken To Receive:');
    console.log(`  - Contract: ${tokenToReceive.contractAddress}`);
    console.log(`  - Handler: ${tokenToReceive.handler}`);
    console.log(`  - Value: ${tokenToReceive.value.toString()}`);
    
    // Check if value is max uint256 (which means "any token")
    const maxUint256 = BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935');
    if (tokenToReceive.value === maxUint256) {
      console.log(`  - Note: Value is max uint256, meaning "any token"`);
    }
    
    console.log('='.repeat(80));
    
    // JSON format for easy copy
    console.log('\n📋 JSON Format:');
    console.log(JSON.stringify({
      listingId: 1233,
      seller,
      destinationEndpoint: Number(destinationEndpoint),
      tokenForSale: {
        contractAddress: tokenForSale.contractAddress,
        handler: tokenForSale.handler,
        value: tokenForSale.value.toString(),
      },
      tokenToReceive: {
        contractAddress: tokenToReceive.contractAddress,
        handler: tokenToReceive.handler,
        value: tokenToReceive.value.toString(),
      },
    }, null, 2));

  } catch (error) {
    console.error('❌ Error checking listing 1233:', error.message || error);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    throw error;
  }
}

checkListing1233()
  .then(() => {
    console.log('\n✅ Check completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Check failed:', error);
    process.exit(1);
  });
