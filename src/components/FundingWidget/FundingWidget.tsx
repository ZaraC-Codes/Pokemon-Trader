/**
 * FundingWidget Component
 *
 * Comprehensive widget for funding wallets with APE or USDC.e on ApeChain.
 * Supports:
 * - Bridge from other chains (Ethereum, Arbitrum, Base, etc.)
 * - Swap tokens on any chain into APE/USDC.e
 * - Buy with fiat (card, bank transfer)
 * - Onramp from any supported source
 *
 * Uses ThirdWeb Universal Bridge (PayEmbed) for seamless cross-chain transactions.
 *
 * Usage:
 * ```tsx
 * import { FundingWidget } from './components/FundingWidget';
 *
 * <FundingWidget
 *   isOpen={showFunding}
 *   onClose={() => setShowFunding(false)}
 *   defaultToken="APE"  // or "USDC"
 * />
 * ```
 */

import React, { useState, useCallback, Component, Suspense, lazy, type ReactNode } from 'react';
import {
  thirdwebClient,
  apechain,
  APECHAIN_TOKENS,
  isThirdwebConfigured,
} from '../../services/thirdwebConfig';

// ============================================================
// ERROR BOUNDARY FOR THIRDWEB COMPONENTS
// ============================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ThirdwebErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[FundingWidget] ThirdWeb error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// ============================================================
// LAZY LOADED THIRDWEB COMPONENTS
// ============================================================

const LazyPayEmbed = lazy(async () => {
  if (!isThirdwebConfigured()) {
    throw new Error('ThirdWeb not configured');
  }
  const module = await import('thirdweb/react');
  return { default: module.PayEmbed };
});

const LazyThirdwebProvider = lazy(async () => {
  if (!isThirdwebConfigured()) {
    throw new Error('ThirdWeb not configured');
  }
  const module = await import('thirdweb/react');
  return { default: module.ThirdwebProvider };
});

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export type FundingToken = 'APE' | 'USDC';

export interface FundingWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Default token to fund (APE or USDC.e) */
  defaultToken?: FundingToken;
  /** Optional callback when funding completes */
  onFundingComplete?: () => void;
}

// ============================================================
// STYLES
// ============================================================

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1100,
  },
  modal: {
    backgroundColor: '#1a1a1a',
    border: '4px solid #00ff88',
    padding: '24px',
    maxWidth: '480px',
    width: '95%',
    maxHeight: '90vh',
    overflowY: 'auto' as const,
    fontFamily: "'Courier New', monospace",
    color: '#fff',
    imageRendering: 'pixelated' as const,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    borderBottom: '2px solid #444',
    paddingBottom: '12px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#00ff88',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: '2px solid #ff4444',
    color: '#ff4444',
    padding: '6px 10px',
    cursor: 'pointer',
    fontFamily: "'Courier New', monospace",
    fontSize: '12px',
  },
  description: {
    fontSize: '12px',
    color: '#888',
    marginBottom: '16px',
    lineHeight: '1.5',
  },
  tokenSelector: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },
  tokenButton: {
    flex: 1,
    padding: '12px',
    border: '2px solid #444',
    backgroundColor: '#2a2a2a',
    color: '#888',
    cursor: 'pointer',
    fontFamily: "'Courier New', monospace",
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.1s',
  },
  tokenButtonActive: {
    borderColor: '#00ff88',
    backgroundColor: '#1a3a2a',
    color: '#00ff88',
  },
  tokenButtonApe: {
    borderColor: '#ffcc00',
    backgroundColor: '#3a3a1a',
    color: '#ffcc00',
  },
  tokenButtonUsdc: {
    borderColor: '#00ff00',
    backgroundColor: '#1a3a1a',
    color: '#00ff00',
  },
  featureList: {
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: '#2a2a2a',
    border: '2px solid #444',
  },
  featureTitle: {
    fontSize: '12px',
    color: '#00ff88',
    marginBottom: '8px',
    fontWeight: 'bold',
  },
  featureItem: {
    fontSize: '11px',
    color: '#aaa',
    marginBottom: '4px',
    paddingLeft: '12px',
  },
  loadingOverlay: {
    padding: '24px',
    backgroundColor: '#2a2a2a',
    border: '2px solid #00ff88',
    textAlign: 'center' as const,
  },
  loadingText: {
    color: '#00ff88',
    fontSize: '14px',
  },
  errorBox: {
    padding: '12px',
    backgroundColor: '#3a1a1a',
    border: '2px solid #ff4444',
    marginTop: '16px',
  },
  errorText: {
    color: '#ff4444',
    fontSize: '12px',
  },
  retryButton: {
    marginTop: '8px',
    padding: '8px 16px',
    border: '2px solid #ff4444',
    backgroundColor: 'transparent',
    color: '#ff4444',
    cursor: 'pointer',
    fontFamily: "'Courier New', monospace",
    fontSize: '12px',
  },
  notConfiguredBox: {
    padding: '24px',
    backgroundColor: '#2a2a2a',
    border: '2px solid #666',
    textAlign: 'center' as const,
  },
  notConfiguredText: {
    color: '#888',
    fontSize: '12px',
    lineHeight: '1.6',
  },
  poweredBy: {
    marginTop: '12px',
    textAlign: 'center' as const,
    color: '#666',
    fontSize: '10px',
  },
  widgetContainer: {
    minHeight: '400px',
    backgroundColor: '#1a1a1a',
  },
};

// ============================================================
// SUB-COMPONENTS
// ============================================================

/** Loading fallback for ThirdWeb widget */
function LoadingFallback() {
  return (
    <div style={styles.loadingOverlay}>
      <div style={styles.loadingText}>Loading funding widget...</div>
      <div style={{ color: '#888', fontSize: '11px', marginTop: '8px' }}>
        Connecting to Universal Bridge...
      </div>
    </div>
  );
}

/** Error fallback for ThirdWeb widget */
function ErrorFallback({ error, onRetry }: { error?: string; onRetry?: () => void }) {
  return (
    <div style={styles.errorBox}>
      <div style={styles.errorText}>
        {error || 'Failed to load funding widget. Please try again.'}
      </div>
      {onRetry && (
        <button style={styles.retryButton} onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

/** Inner PayEmbed wrapper with ThirdwebProvider */
function PayEmbedWithProvider({
  selectedToken,
  onComplete,
}: {
  selectedToken: FundingToken;
  onComplete?: () => void;
}) {
  if (!thirdwebClient) {
    return <ErrorFallback error="ThirdWeb client not initialized" />;
  }

  // Configure token address for destination
  // For APE (native), we don't pass a token address - just the chain
  // For USDC.e, we pass the token address
  const tokenConfig = selectedToken === 'USDC'
    ? {
        address: APECHAIN_TOKENS.USDC,
        symbol: 'USDC.e',
        name: 'USDC.e (Stargate)',
      }
    : undefined; // Native APE - no token address needed

  return (
    <LazyThirdwebProvider>
      <div style={styles.widgetContainer}>
        <LazyPayEmbed
          client={thirdwebClient}
          theme="dark"
          payOptions={{
            mode: 'fund_wallet',
            metadata: {
              name: `Get ${selectedToken} on ApeChain`,
            },
            prefillBuy: {
              chain: apechain,
              token: tokenConfig,
              allowEdits: {
                amount: true,
                token: true,
                chain: false, // Lock to ApeChain
              },
            },
            // Enable crypto purchases (bridge/swap) with source configuration
            buyWithCrypto: {
              // Allow user to select source chain/token
              prefillSource: undefined,
            },
            // Enable fiat purchases
            buyWithFiat: {
              // Use default fiat providers
              prefillSource: undefined,
            },
            // Callback when transaction completes
            onPurchaseSuccess: () => {
              console.log('[FundingWidget] Purchase successful');
              onComplete?.();
            },
          }}
        />
      </div>
    </LazyThirdwebProvider>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function FundingWidget({
  isOpen,
  onClose,
  defaultToken = 'APE',
  onFundingComplete,
}: FundingWidgetProps) {
  const [selectedToken, setSelectedToken] = useState<FundingToken>(defaultToken);
  const [widgetError, setWidgetError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  // Reset error state when modal opens/closes or token changes
  React.useEffect(() => {
    if (!isOpen) {
      setWidgetError(null);
    }
  }, [isOpen]);

  React.useEffect(() => {
    setWidgetError(null);
    setRetryKey((k) => k + 1);
  }, [selectedToken]);

  const handleError = useCallback((error: Error) => {
    console.error('[FundingWidget] Widget error:', error);
    setWidgetError(error.message || 'Failed to load funding widget');
  }, []);

  const handleRetry = useCallback(() => {
    setWidgetError(null);
    setRetryKey((k) => k + 1);
  }, []);

  const handleComplete = useCallback(() => {
    onFundingComplete?.();
  }, [onFundingComplete]);

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h3 style={styles.title}>FUND YOUR WALLET</h3>
          <button style={styles.closeButton} onClick={onClose}>
            X
          </button>
        </div>

        {/* Description */}
        <div style={styles.description}>
          Bridge, swap, or buy crypto to get APE or USDC.e on ApeChain.
          Use any token on any chain - we'll handle the conversion automatically.
        </div>

        {/* Token Selector */}
        <div style={styles.tokenSelector}>
          <button
            style={{
              ...styles.tokenButton,
              ...(selectedToken === 'APE' ? styles.tokenButtonApe : {}),
            }}
            onClick={() => setSelectedToken('APE')}
          >
            Get APE
          </button>
          <button
            style={{
              ...styles.tokenButton,
              ...(selectedToken === 'USDC' ? styles.tokenButtonUsdc : {}),
            }}
            onClick={() => setSelectedToken('USDC')}
          >
            Get USDC.e
          </button>
        </div>

        {/* Features List */}
        <div style={styles.featureList}>
          <div style={styles.featureTitle}>SUPPORTED METHODS:</div>
          <div style={styles.featureItem}>+ Bridge from Ethereum, Arbitrum, Base, Optimism, etc.</div>
          <div style={styles.featureItem}>+ Swap any token (ETH, USDC, USDT, etc.)</div>
          <div style={styles.featureItem}>+ Buy with card or bank transfer</div>
          <div style={styles.featureItem}>+ Cross-chain swap+bridge in one step</div>
        </div>

        {/* ThirdWeb Widget */}
        {!isThirdwebConfigured() && (
          <div style={styles.notConfiguredBox}>
            <div style={styles.notConfiguredText}>
              ThirdWeb not configured.<br /><br />
              Set VITE_THIRDWEB_CLIENT_ID in .env to enable<br />
              bridging, swapping, and fiat purchases.
            </div>
          </div>
        )}

        {isThirdwebConfigured() && widgetError && (
          <ErrorFallback error={widgetError} onRetry={handleRetry} />
        )}

        {isThirdwebConfigured() && !widgetError && (
          <ThirdwebErrorBoundary
            key={`${selectedToken}-${retryKey}`}
            fallback={<ErrorFallback onRetry={handleRetry} />}
            onError={handleError}
          >
            <Suspense fallback={<LoadingFallback />}>
              <PayEmbedWithProvider
                selectedToken={selectedToken}
                onComplete={handleComplete}
              />
            </Suspense>
          </ThirdwebErrorBoundary>
        )}

        {/* Powered By */}
        <div style={styles.poweredBy}>
          Powered by ThirdWeb Universal Bridge
        </div>
      </div>
    </div>
  );
}

export default FundingWidget;
