// Test script to check contract functions and fetch listings
import { createPublicClient, http } from 'viem';
import { createWalletClient, http as httpWallet } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const APECHAIN_RPC = 'https://apechain-mainnet.g.alchemy.com/v2/iaNpJew_PfWaRTLVtZ15PDXLh4W584L9';
const OTC_MARKETPLACE = '0x075893707e168162234B62A5B39650e124FF3321';

// ApeChain mainnet config
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
    default: {
      http: [APECHAIN_RPC],
    },
  },
  blockExplorers: {
    default: {
      name: 'ApeChain Explorer',
      url: 'https://apechain.calderascan.xyz',
    },
  },
};

const publicClient = createPublicClient({
  chain: apeChainMainnet,
  transport: http(APECHAIN_RPC),
});

// Test different function signatures
async function testContractFunctions() {
  console.log('=== Testing Contract Functions ===\n');
  console.log('Contract Address:', OTC_MARKETPLACE);
  console.log('RPC URL:', APECHAIN_RPC);
  console.log('');

  // Test 1: Check if contract exists
  console.log('1. Checking contract bytecode...');
  try {
    const code = await publicClient.getBytecode({ address: OTC_MARKETPLACE });
    console.log('   ✓ Contract code exists:', code ? `Yes (${code.length} bytes)` : 'No');
  } catch (error) {
    console.log('   ✗ Error:', error.message);
  }
  console.log('');

  // Test 2: Try nextListingId() - current function
  console.log('2. Testing nextListingId()...');
  try {
    const result = await publicClient.readContract({
      address: OTC_MARKETPLACE,
      abi: [{
        inputs: [],
        name: 'nextListingId',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      }],
      functionName: 'nextListingId',
    });
    console.log('   ✓ nextListingId() works! Result:', result.toString());
  } catch (error) {
    console.log('   ✗ nextListingId() failed:', error.message);
    console.log('   Error details:', error.cause?.message || 'Unknown');
  }
  console.log('');

  // Test 3: Try alternative function names
  const alternativeFunctions = [
    'listingCount',
    'totalListings',
    'listingsCount',
    'nextId',
    'currentListingId',
  ];

  console.log('3. Testing alternative function names...');
  for (const funcName of alternativeFunctions) {
    try {
      const result = await publicClient.readContract({
        address: OTC_MARKETPLACE,
        abi: [{
          inputs: [],
          name: funcName,
          outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
          stateMutability: 'view',
          type: 'function',
        }],
        functionName: funcName,
      });
      console.log(`   ✓ ${funcName}() works! Result:`, result.toString());
    } catch (error) {
      // Silently fail - function doesn't exist
    }
  }
  console.log('');

  // Test 4: Try getAllUnclaimedListings with different parameters
  console.log('4. Testing getAllUnclaimedListings(0, 10)...');
  try {
    const result = await publicClient.readContract({
      address: OTC_MARKETPLACE,
      abi: [{
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
      }],
      functionName: 'getAllUnclaimedListings',
      args: [0n, 10n],
    });
    console.log('   ✓ getAllUnclaimedListings(0, 10) works!');
    console.log('   Listings found:', result[0]?.length || 0);
    if (result[0] && result[0].length > 0) {
      console.log('   First listing:', JSON.stringify(result[0][0], null, 2));
    }
  } catch (error) {
    console.log('   ✗ getAllUnclaimedListings() failed:', error.message);
    console.log('   Error details:', error.cause?.message || 'Unknown');
  }
  console.log('');

  // Test 5: Try to get contract ABI from explorer (V2 API)
  console.log('5. Fetching ABI from Apescan API V2...');
  try {
    // Try V2 API endpoint
    const response = await fetch(
      `https://api.apescan.io/v2/api?module=contract&action=getabi&address=${OTC_MARKETPLACE}&apikey=YourApiKeyToken`
    );
    const data = await response.json();
    if (data.status === '1' && data.result) {
      const abi = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
      console.log('   ✓ ABI fetched successfully!');
      console.log('   Functions found:', abi.filter((f) => f.type === 'function').length);
      
      // List all view functions
      const viewFunctions = abi.filter((f) => 
        f.type === 'function' && 
        (f.stateMutability === 'view' || f.stateMutability === 'pure')
      );
      console.log('   View functions:', viewFunctions.map((f) => f.name).join(', '));
      
      // Save ABI to file for reference
      console.log('\n   Saving ABI to contract-abi.json...');
      const fs = await import('fs');
      fs.writeFileSync('contract-abi.json', JSON.stringify(abi, null, 2));
      console.log('   ✓ ABI saved!');
    } else {
      console.log('   ✗ ABI fetch failed:', data.message || 'Unknown error');
      console.log('   Trying without API key...');
      // Try without API key
      const response2 = await fetch(
        `https://api.apescan.io/v2/api?module=contract&action=getabi&address=${OTC_MARKETPLACE}`
      );
      const data2 = await response2.json();
      if (data2.status === '1' && data2.result) {
        const abi = typeof data2.result === 'string' ? JSON.parse(data2.result) : data2.result;
        console.log('   ✓ ABI fetched (without API key)!');
        console.log('   Functions found:', abi.filter((f) => f.type === 'function').length);
      }
    }
  } catch (error) {
    console.log('   ✗ Error fetching ABI:', error.message);
  }
  console.log('');

  // Test 6: Try reading events with smaller block range
  console.log('6. Checking for ListingCreated events (recent blocks)...');
  try {
    const currentBlock = await publicClient.getBlockNumber();
    const fromBlock = currentBlock - 10000n; // Last 10k blocks
    
    const logs = await publicClient.getLogs({
      address: OTC_MARKETPLACE,
      event: {
        type: 'event',
        name: 'ListingCreated',
        inputs: [
          { indexed: true, name: 'listingId', type: 'uint256' },
          { indexed: true, name: 'seller', type: 'address' },
        ],
      },
      fromBlock: fromBlock,
      toBlock: 'latest',
    });
    console.log('   ✓ Found', logs.length, 'ListingCreated events in last 10k blocks');
    if (logs.length > 0) {
      console.log('   Latest event block:', logs[logs.length - 1].blockNumber);
      console.log('   Latest event:', JSON.stringify(logs[logs.length - 1], null, 2));
    }
  } catch (error) {
    console.log('   ✗ Error reading events:', error.message);
    if (error.message.includes('block range')) {
      console.log('   Trying with even smaller range...');
      try {
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock - 1000n;
        const logs = await publicClient.getLogs({
          address: OTC_MARKETPLACE,
          fromBlock: fromBlock,
          toBlock: 'latest',
        });
        console.log('   ✓ Found', logs.length, 'total events in last 1k blocks');
      } catch (e) {
        console.log('   ✗ Still failed:', e.message);
      }
    }
  }
  console.log('');

  // Test 7: Try to call the contract with different function selectors
  console.log('7. Testing function selectors...');
  const functionSelectors = {
    'nextListingId()': '0xaaccf1ec',
    'getAllUnclaimedListings(uint256,uint256)': '0x0e36b756',
    'listings(uint256)': '0x', // Need to calculate
    'listingCount()': '0x', // Need to calculate
  };
  
  for (const [funcName, selector] of Object.entries(functionSelectors)) {
    if (!selector || selector === '0x') continue;
    try {
      const result = await publicClient.call({
        to: OTC_MARKETPLACE,
        data: selector,
      });
      if (result.data && result.data !== '0x') {
        console.log(`   ✓ ${funcName} might exist (got response)`);
      }
    } catch (error) {
      // Expected to fail
    }
  }
}

// Run tests
testContractFunctions().catch(console.error);
