// More detailed contract testing
import { createPublicClient, http, decodeFunctionData, getFunctionSelector } from 'viem';

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

const publicClient = createPublicClient({
  chain: apeChainMainnet,
  transport: http(APECHAIN_RPC),
});

// Try to find function selectors by testing common patterns
async function findContractFunctions() {
  console.log('=== Detailed Contract Analysis ===\n');
  
  // Get contract bytecode
  const code = await publicClient.getBytecode({ address: OTC_MARKETPLACE });
  console.log('Contract bytecode length:', code?.length || 0, 'bytes\n');
  
  // Test common marketplace function patterns
  const commonFunctions = [
    // Standard patterns
    { name: 'nextListingId()', selector: '0xaaccf1ec' },
    { name: 'getAllUnclaimedListings(uint256,uint256)', selector: '0x0e36b756' },
    { name: 'listings(uint256)', selector: '0x' }, // Will calculate
    { name: 'listingCount()', selector: '0x' },
    { name: 'totalListings()', selector: '0x' },
    { name: 'getListings()', selector: '0x' },
    { name: 'getAllListings()', selector: '0x' },
    { name: 'activeListings()', selector: '0x' },
  ];
  
  // Calculate selectors for functions without them
  for (const func of commonFunctions) {
    if (func.selector === '0x') {
      try {
        func.selector = getFunctionSelector(func.name);
      } catch (e) {
        // Skip if can't calculate
      }
    }
  }
  
  console.log('Testing function selectors:\n');
  for (const func of commonFunctions) {
    if (!func.selector || func.selector === '0x') continue;
    
    try {
      const result = await publicClient.call({
        to: OTC_MARKETPLACE,
        data: func.selector,
      });
      
      if (result.data && result.data !== '0x' && result.data.length > 2) {
        console.log(`✓ ${func.name} - Got response: ${result.data.substring(0, 20)}...`);
      }
    } catch (error) {
      // Check if it's a revert vs function doesn't exist
      if (error.message.includes('revert')) {
        console.log(`⚠ ${func.name} - Function exists but reverts`);
      }
      // Otherwise function likely doesn't exist
    }
  }
  
  console.log('\n=== Checking Contract on Explorer ===');
  console.log(`Visit: https://apechain.calderascan.xyz/address/${OTC_MARKETPLACE}`);
  console.log('Check the "Contract" tab for verified ABI\n');
  
  console.log('=== Recommendations ===');
  console.log('1. Check the contract on ApeChain explorer for verified ABI');
  console.log('2. The contract might be a proxy - check implementation address');
  console.log('3. Functions might require specific access control');
  console.log('4. Contract might need initialization before use');
}

findContractFunctions().catch(console.error);
