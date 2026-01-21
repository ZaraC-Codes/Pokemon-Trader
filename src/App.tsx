import { useState, useEffect, useCallback } from 'react';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './services/apechainConfig';
import GameCanvas, { type PokemonClickData, type CatchOutOfRangeData } from './components/GameCanvas';
import WalletConnector from './components/WalletConnector';
import TradeModal from './components/TradeModal';
import VolumeToggle from './components/VolumeToggle';
import InventoryTerminal from './components/InventoryTerminal';
import { GameHUD } from './components/PokeBallShop';
import { CatchAttemptModal } from './components/CatchAttemptModal';
import { useActiveWeb3React } from './hooks/useActiveWeb3React';
import { contractService } from './services/contractService';
import type { TradeListing } from './services/contractService';
import '@rainbow-me/rainbowkit/styles.css';

/** State for the selected Pokemon to catch */
interface SelectedPokemon {
  pokemonId: bigint;
  slotIndex: number;
  attemptsRemaining: number;
}

/** Toast notification state */
interface ToastMessage {
  id: number;
  message: string;
  type: 'warning' | 'error' | 'success';
}

const queryClient = new QueryClient();

// Expose test functions to window for debugging
declare global {
  interface Window {
    testListings: () => Promise<void>;
    testContractConnection: () => Promise<void>;
    checkListing: (listingId: number) => Promise<void>;
    getListingsRange: (startIndex: number, max: number) => Promise<void>;
    // Music disabled
    // toggleMusic?: () => void;
  }
}

/** Inner app component that uses hooks requiring WagmiProvider context */
function AppContent() {
  const { account } = useActiveWeb3React();
  const [selectedTrade, setSelectedTrade] = useState<TradeListing | null>(null);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [selectedPokemon, setSelectedPokemon] = useState<SelectedPokemon | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  // Music disabled
  // const [isMusicPlaying, setIsMusicPlaying] = useState(true);

  // Toast management
  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'warning') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    // Expose test functions to window for browser console testing
    window.testListings = async () => {
      console.log('=== Testing Listings Fetch (using getAllListings from hooks) ===');
      try {
        // Import and use the actual getAllListings function that the app uses
        const { getAllListings } = await import('./hooks/useAllListings');
        const allListings = await getAllListings();
        console.log(`✅ Successfully fetched ${allListings.length} listings`);
        console.log('All listings:', allListings);
        
        // Show summary
        if (allListings.length > 0) {
          console.log('\n📊 Listing Summary:');
          const listingsByCollection: Record<string, number> = {};
          allListings.forEach((listing: any) => {
            const collection = listing.tokenForSale?.contractAddress?.toLowerCase() || 'unknown';
            listingsByCollection[collection] = (listingsByCollection[collection] || 0) + 1;
          });
          Object.entries(listingsByCollection).forEach(([collection, count]) => {
            console.log(`  - Collection ${collection}: ${count} listings`);
          });
          
          // Show first few listings as examples
          console.log('\n📋 First 5 listings:');
          allListings.slice(0, 5).forEach((listing: any, idx: number) => {
            console.log(`  ${idx + 1}. Listing ID: ${listing.listingId}`);
            console.log(`     Seller: ${listing.seller}`);
            console.log(`     Token For Sale: ${listing.tokenForSale?.contractAddress} (Token ID: ${listing.tokenForSale?.value})`);
            console.log(`     Token To Receive: ${listing.tokenToReceive?.contractAddress} (Value: ${listing.tokenToReceive?.value})`);
            console.log(`     Destination Chain: ${listing.dstChain}`);
          });
        } else {
          console.warn('⚠️ No listings found');
        }
      } catch (error) {
        console.error('❌ Error testing listings:', error);
      }
    };
    
    window.testContractConnection = async () => {
      console.log('=== Testing Contract Connection ===');
      await contractService.testContractConnection();
    };
    
    window.checkListing = async (listingId: number) => {
      console.log(`=== Checking Listing ${listingId} using "listings" function ===`);
      try {
        const { readContract } = await import('@wagmi/core');
        const { chainToConfig, otcAddress, swapContractConfig } = await import('./services/config');
        const apeChainMainnet = (await import('./services/apechainConfig')).apeChainMainnet;
        
        const chainConfig = chainToConfig[apeChainMainnet.id];
        const result = await readContract(chainConfig, {
          address: otcAddress[apeChainMainnet.id] as any,
          abi: swapContractConfig.abi as any,
          functionName: 'listings',
          args: [BigInt(listingId)],
        }) as any;
        
        // The "listings" function returns an array: [destinationEndpoint, seller, tokenForSale, tokenToReceive]
        const destinationEndpoint = result[0];
        const seller = result[1];
        const tokenForSale = result[2];
        const tokenToReceive = result[3];
        
        // Check if listing exists (seller is not zero address)
        const isEmpty = !seller || seller === '0x0000000000000000000000000000000000000000';
        
        if (!isEmpty) {
          console.log(`✅ Listing ${listingId} found!`);
          console.log('Listing details:', {
            listingId,
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
          });
          
          // Check if tokenToReceive.value is max uint256
          const maxUint256 = BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935');
          if (tokenToReceive.value === maxUint256) {
            console.log('   Note: tokenToReceive.value is max uint256, meaning "any token"');
          }
        } else {
          console.log(`❌ Listing ${listingId} not found or empty`);
          console.log('Raw result:', result);
        }
      } catch (error: any) {
        console.error(`❌ Error checking listing ${listingId}:`, error?.message || error);
      }
    };
    
    window.getListingsRange = async (startIndex: number, max: number) => {
      console.log(`=== Fetching Listings ${startIndex} to ${startIndex + max - 1} ===`);
      try {
        const { readContract } = await import('@wagmi/core');
        const { chainToConfig, otcAddress, swapContractConfig } = await import('./services/config');
        const apeChainMainnet = (await import('./services/apechainConfig')).apeChainMainnet;
        
        const chainConfig = chainToConfig[apeChainMainnet.id];
        const result = await readContract(chainConfig, {
          address: otcAddress[apeChainMainnet.id] as any,
          abi: swapContractConfig.abi as any,
          functionName: 'getAllUnclaimedListings',
          args: [BigInt(startIndex), BigInt(max)],
        }) as any;
        
        const listings = result[0] as any[];
        const listingIds = result[1] as bigint[];
        
        console.log(`✅ Fetched ${listings.length} listings from index ${startIndex}`);
        
        if (listings.length > 0) {
          console.log('\n📋 Listing Details:');
          listings.forEach((listing, idx) => {
            const listingId = listingIds[idx] ? Number(listingIds[idx]) : startIndex + idx;
            console.log(`\n${listingId}. Listing ID: ${listingId}`);
            console.log(`   Seller: ${listing.seller}`);
            console.log(`   Destination Endpoint: ${listing.destinationEndpoint}`);
            console.log(`   Token For Sale:`);
            console.log(`     - Contract: ${listing.tokenForSale.contractAddress}`);
            console.log(`     - Handler: ${listing.tokenForSale.handler}`);
            console.log(`     - Token ID/Value: ${listing.tokenForSale.value.toString()}`);
            console.log(`   Token To Receive:`);
            console.log(`     - Contract: ${listing.tokenToReceive.contractAddress}`);
            console.log(`     - Handler: ${listing.tokenToReceive.handler}`);
            console.log(`     - Value: ${listing.tokenToReceive.value.toString()}`);
          });
          
          // Check if listing 1233 is in this range
          const listing1233Index = listingIds.findIndex(id => Number(id) === 1233);
          if (listing1233Index !== -1) {
            console.log(`\n🎯 Found listing 1233 at index ${listing1233Index} in results!`);
            console.log('Listing 1233 details:', listings[listing1233Index]);
          } else {
            console.log(`\n⚠️ Listing 1233 not found in this range (IDs: ${listingIds.map(id => Number(id)).join(', ')})`);
          }
        } else {
          console.log(`❌ No listings found in range ${startIndex} to ${startIndex + max - 1}`);
        }
      } catch (error: any) {
        console.error(`❌ Error fetching listings range ${startIndex} to ${startIndex + max - 1}:`, error?.message || error);
      }
    };
    
    console.log('🔧 Test functions available:');
    console.log('  - window.testListings() - Fetch all available listings from contract');
    console.log('  - window.checkListing(1233) - Check specific listing by ID');
    console.log('  - window.getListingsRange(1200, 35) - Fetch listings 1200 to 1234');
    console.log('  - window.testContractConnection() - Test contract connection');
    // Music disabled
    // console.log('  - window.toggleMusic() - Toggle background music');
  }, []);

  // Music disabled
  // const handleMusicToggle = () => {
  //   // State will be updated by the game scene event
  //   setIsMusicPlaying((prev) => !prev);
  // };
  
  // useEffect(() => {
  //   // Listen for music state changes from game scene
  //   const handleMusicStateChange = (event: CustomEvent<boolean>) => {
  //     setIsMusicPlaying(event.detail);
  //   };
  //   
  //   window.addEventListener('music-state-changed' as any, handleMusicStateChange as EventListener);
  //   
  //   return () => {
  //     window.removeEventListener('music-state-changed' as any, handleMusicStateChange as EventListener);
  //   };
  // }, []);

  const handleTradeClick = useCallback((listing: TradeListing) => {
    setSelectedTrade(listing);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedTrade(null);
  }, []);

  const handleInventoryOpen = useCallback(() => {
    setIsInventoryOpen(true);
  }, []);

  const handleInventoryClose = useCallback(() => {
    setIsInventoryOpen(false);
  }, []);

  const handleVolumeChange = useCallback((volume: number) => {
    setMusicVolume(volume);
    // Update music volume in game scene without causing re-renders
    // Use requestAnimationFrame to avoid blocking
    requestAnimationFrame(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game && !game.destroyed) {
        try {
          const scene = game.scene.getScene('GameScene');
          if (scene && typeof scene.getMP3Music === 'function') {
            const mp3Music = scene.getMP3Music();
            if (mp3Music && typeof mp3Music.setVolume === 'function') {
              mp3Music.setVolume(volume);
            }
          }
        } catch (error) {
          // Silently fail if game scene is not ready
          console.warn('Could not update music volume:', error);
        }
      }
    });
  }, []);

  // Handle Pokemon click from Phaser scene (only fires when player is in range)
  const handlePokemonClick = useCallback((data: PokemonClickData) => {
    // Max attempts is 3, so attemptsRemaining = 3 - attemptCount
    setSelectedPokemon({
      pokemonId: data.pokemonId,
      slotIndex: data.slotIndex,
      attemptsRemaining: 3 - data.attemptCount,
    });
  }, []);

  // Handle out-of-range catch attempt
  const handleCatchOutOfRange = useCallback((_data: CatchOutOfRangeData) => {
    addToast('Move closer to the Pokémon!', 'warning');
  }, [addToast]);

  const handleCloseCatchModal = useCallback(() => {
    setSelectedPokemon(null);
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        margin: 0,
        padding: 0,
        backgroundColor: '#000',
      }}
    >
      <WalletConnector />
      <GameCanvas
        onTradeClick={handleTradeClick}
        onPokemonClick={handlePokemonClick}
        onCatchOutOfRange={handleCatchOutOfRange}
      />
      <GameHUD playerAddress={account} />

      {/* Toast Notifications */}
      <div style={{
        position: 'fixed',
        top: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'none',
      }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              padding: '12px 20px',
              backgroundColor: toast.type === 'warning' ? '#3a3a1a' : toast.type === 'error' ? '#3a1a1a' : '#1a3a1a',
              border: `2px solid ${toast.type === 'warning' ? '#ffcc00' : toast.type === 'error' ? '#ff4444' : '#00ff00'}`,
              color: toast.type === 'warning' ? '#ffcc00' : toast.type === 'error' ? '#ff4444' : '#00ff00',
              fontFamily: "'Courier New', monospace",
              fontSize: '14px',
              fontWeight: 'bold',
              textAlign: 'center',
              imageRendering: 'pixelated',
              animation: 'fadeInOut 3s ease-in-out',
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(-10px); }
          10% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
      `}</style>
      {selectedTrade && (
        <TradeModal listing={selectedTrade} onClose={handleCloseModal} />
      )}

      {/* Catch Attempt Modal */}
      <CatchAttemptModal
        isOpen={selectedPokemon !== null}
        onClose={handleCloseCatchModal}
        playerAddress={account}
        pokemonId={selectedPokemon?.pokemonId ?? BigInt(0)}
        slotIndex={selectedPokemon?.slotIndex ?? 0}
        attemptsRemaining={selectedPokemon?.attemptsRemaining ?? 0}
      />

      {/* Inventory Button */}
      <button
        onClick={handleInventoryOpen}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          zIndex: 1000,
          padding: '12px 20px',
          backgroundColor: '#4a4',
          color: '#fff',
          border: '3px solid #fff',
          cursor: 'pointer',
          fontFamily: 'Courier New, monospace',
          fontSize: '14px',
          textTransform: 'uppercase',
          fontWeight: 'bold',
          imageRendering: 'pixelated',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#6a6';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '#4a4';
        }}
      >
        <i className="fas fa-box" style={{ marginRight: '8px' }}></i>
        INVENTORY
      </button>

      {/* Volume Toggle */}
      <VolumeToggle onVolumeChange={handleVolumeChange} initialVolume={musicVolume} />

      {/* Inventory Terminal */}
      <InventoryTerminal isOpen={isInventoryOpen} onClose={handleInventoryClose} />

      {/* Music disabled */}
    </div>
  );
}

/** Root App component with providers */
function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <AppContent />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
