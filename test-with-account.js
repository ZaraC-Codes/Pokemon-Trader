// Test with an account (if needed for access control)
import { createPublicClient, http, createWalletClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const APECHAIN_RPC = 'https://apechain-mainnet.g.alchemy.com/v2/iaNpJew_PfWaRTLVtZ15PDXLh4W584L9';
const OTC_MARKETPLACE = '0x075893707e168162234B62A5B39650e124FF3321';

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

async function testWithAccount(privateKey) {
  if (!privateKey) {
    console.log('No private key provided. Testing read-only functions...\n');
    return testReadOnly();
  }

  console.log('=== Testing with Account ===\n');
  
  const account = privateKeyToAccount(privateKey);
  console.log('Account address:', account.address);
  
  const publicClient = createPublicClient({
    chain: apeChainMainnet,
    transport: http(APECHAIN_RPC),
  });

  const walletClient = createWalletClient({
    account,
    chain: apeChainMainnet,
    transport: http(APECHAIN_RPC),
  });

  // Test read functions with account context
  console.log('\n1. Testing nextListingId() with account context...');
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
      account: account.address,
    });
    console.log('   ✓ Success! nextListingId =', result.toString());
  } catch (error) {
    console.log('   ✗ Failed:', error.message);
  }

  // Test getAllUnclaimedListings
  console.log('\n2. Testing getAllUnclaimedListings(0, 10) with account...');
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
      account: account.address,
    });
    console.log('   ✓ Success! Found', result[0]?.length || 0, 'listings');
    if (result[0] && result[0].length > 0) {
      console.log('   First listing:', JSON.stringify(result[0][0], (k, v) => typeof v === 'bigint' ? v.toString() : v, 2));
    }
  } catch (error) {
    console.log('   ✗ Failed:', error.message);
  }
}

async function testReadOnly() {
  const publicClient = createPublicClient({
    chain: apeChainMainnet,
    transport: http(APECHAIN_RPC),
  });

  console.log('=== Read-Only Testing ===\n');
  console.log('Contract:', OTC_MARKETPLACE);
  console.log('Note: Functions are reverting. This might indicate:');
  console.log('  - Contract needs initialization');
  console.log('  - Access control restrictions');
  console.log('  - Proxy contract requiring different call path');
  console.log('  - Functions need different parameters\n');
  
  console.log('To test with an account, run:');
  console.log('  node test-with-account.js YOUR_PRIVATE_KEY\n');
  console.log('Or provide the private key and I can test write functions too.\n');
}

// Get private key from command line or environment
const privateKey = process.argv[2] || process.env.PRIVATE_KEY;

if (privateKey && privateKey.startsWith('0x')) {
  testWithAccount(privateKey).catch(console.error);
} else {
  testReadOnly().catch(console.error);
}
