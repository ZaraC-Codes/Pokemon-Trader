/**
 * HelpModal Component
 *
 * In-game "How to Play" help modal explaining the Pokemon catching mechanics.
 * Can be opened via the help button in the HUD or auto-opens on first visit.
 */

import { useEffect, useCallback } from 'react';

// ============================================================
// TYPES
// ============================================================

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================
// STYLES
// ============================================================

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
    boxSizing: 'border-box',
  },
  modal: {
    backgroundColor: '#1a1a2e',
    border: '3px solid #ffcc00',
    borderRadius: '8px',
    padding: '24px',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    position: 'relative',
    boxSizing: 'border-box',
    fontFamily: "'Courier New', monospace",
  },
  closeButton: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '4px 8px',
    lineHeight: 1,
  },
  title: {
    color: '#ffcc00',
    fontSize: '24px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '20px',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
  },
  subtitle: {
    color: '#aaa',
    fontSize: '14px',
    textAlign: 'center',
    marginBottom: '24px',
    fontStyle: 'italic',
  },
  stepsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  step: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px',
    backgroundColor: 'rgba(255, 204, 0, 0.1)',
    border: '1px solid rgba(255, 204, 0, 0.3)',
    borderRadius: '6px',
  },
  stepNumber: {
    backgroundColor: '#ffcc00',
    color: '#1a1a2e',
    fontWeight: 'bold',
    fontSize: '16px',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '4px',
  },
  stepText: {
    color: '#ccc',
    fontSize: '13px',
    lineHeight: 1.5,
  },
  highlight: {
    color: '#ffcc00',
    fontWeight: 'bold',
  },
  ballInfo: {
    marginTop: '8px',
    padding: '8px',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '4px',
    fontSize: '11px',
  },
  ballRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  ballDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    border: '1px solid rgba(255, 255, 255, 0.5)',
  },
  ballName: {
    color: '#fff',
    width: '80px',
  },
  ballRate: {
    color: '#88ff88',
  },
  modeInfo: {
    marginTop: '8px',
    padding: '8px',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '4px',
    fontSize: '11px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  modeBullet: {
    color: '#ccc',
    lineHeight: 1.5,
  },
  modeDesc: {
    color: '#ccc',
  },
  footer: {
    marginTop: '24px',
    textAlign: 'center',
    color: '#ffcc00',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  closeButtonBottom: {
    marginTop: '20px',
    width: '100%',
    padding: '12px',
    backgroundColor: '#ffcc00',
    color: '#1a1a2e',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: "'Courier New', monospace",
  },
};

// Ball colors matching the game
const BALL_COLORS = {
  poke: '#ff4444',
  great: '#4488ff',
  ultra: '#ffcc00',
  master: '#aa44ff',
};

// ============================================================
// COMPONENT
// ============================================================

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  // Handle ESC key to close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={styles.overlay} onClick={onClose}>
      <div className="modal-inner modal-scroll" style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Close X button */}
        <button
          style={styles.closeButton}
          onClick={onClose}
          onMouseOver={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseOut={(e) => (e.currentTarget.style.color = '#888')}
        >
          ×
        </button>

        {/* Title */}
        <div style={styles.title}>Gotta Catch 'Em All!</div>
        <div style={styles.subtitle}>How to Play</div>

        {/* Steps */}
        <div style={styles.stepsContainer}>
          {/* Step 1: Buy Balls */}
          <div style={styles.step}>
            <div style={styles.stepNumber}>1</div>
            <div style={styles.stepContent}>
              <div style={styles.stepTitle}>Buy PokeBalls</div>
              <div style={styles.stepText}>
                Open the <span style={styles.highlight}>SHOP</span> to purchase balls.
                Higher tier balls have better catch rates!
              </div>
              <div style={styles.ballInfo}>
                <div style={styles.ballRow}>
                  <div style={{ ...styles.ballDot, backgroundColor: BALL_COLORS.poke }} />
                  <span style={styles.ballName}>Poke Ball</span>
                  <span style={styles.ballRate}>2% catch rate</span>
                </div>
                <div style={styles.ballRow}>
                  <div style={{ ...styles.ballDot, backgroundColor: BALL_COLORS.great }} />
                  <span style={styles.ballName}>Great Ball</span>
                  <span style={styles.ballRate}>20% catch rate</span>
                </div>
                <div style={styles.ballRow}>
                  <div style={{ ...styles.ballDot, backgroundColor: BALL_COLORS.ultra }} />
                  <span style={styles.ballName}>Ultra Ball</span>
                  <span style={styles.ballRate}>50% catch rate</span>
                </div>
                <div style={styles.ballRow}>
                  <div style={{ ...styles.ballDot, backgroundColor: BALL_COLORS.master }} />
                  <span style={styles.ballName}>Master Ball</span>
                  <span style={styles.ballRate}>99% catch rate</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Move Around */}
          <div style={styles.step}>
            <div style={styles.stepNumber}>2</div>
            <div style={styles.stepContent}>
              <div style={styles.stepTitle}>Move Around the Map</div>
              <div style={styles.stepText}>
                On desktop, use <span style={styles.highlight}>arrow keys</span> or{' '}
                <span style={styles.highlight}>WASD</span> to move your trainer.
                On mobile, <span style={styles.highlight}>tap on the map</span> to move
                in that direction.
              </div>
            </div>
          </div>

          {/* Step 3: Choose a Game Mode */}
          <div style={styles.step}>
            <div style={styles.stepNumber}>3</div>
            <div style={styles.stepContent}>
              <div style={styles.stepTitle}>Choose a Game Mode</div>
              <div style={styles.stepText}>
                Use the <span style={styles.highlight}>toggle at the top</span> to switch
                between Adventure and Encounter mode.
              </div>
              <div style={styles.modeInfo}>
                <div style={styles.modeBullet}>
                  <span style={styles.highlight}>Adventure:</span>{' '}
                  <span style={styles.modeDesc}>Standard gameplay with limited attempts before a Pokemon relocates.</span>
                </div>
                <div style={styles.modeBullet}>
                  <span style={styles.highlight}>Encounter:</span>{' '}
                  <span style={styles.modeDesc}>Friendly mode with unlimited throws and no relocation.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Find Wild Pokemon */}
          <div style={styles.step}>
            <div style={styles.stepNumber}>4</div>
            <div style={styles.stepContent}>
              <div style={styles.stepTitle}>Find Wild Pokemon</div>
              <div style={styles.stepText}>
                Look for <span style={styles.highlight}>rustling grass patches</span> where
                Pokemon are hiding, then move close to them to start a catch.
              </div>
            </div>
          </div>

          {/* Step 5: Throw & Catch */}
          <div style={styles.step}>
            <div style={styles.stepNumber}>5</div>
            <div style={styles.stepContent}>
              <div style={styles.stepTitle}>Throw & Catch</div>
              <div style={styles.stepText}>
                Click or tap on a Pokemon to open the catch menu. Choose a ball and throw!
                Each Pokemon <span style={styles.highlight}>relocates after 3 failed attempts</span>{' '}
                in Adventure mode only, so choose your ball wisely there.
              </div>
            </div>
          </div>

          {/* Step 6: Collect NFT */}
          <div style={styles.step}>
            <div style={styles.stepNumber}>6</div>
            <div style={styles.stepContent}>
              <div style={styles.stepTitle}>Collect Your NFT</div>
              <div style={styles.stepText}>
                When you catch a Pokemon, a{' '}
                <span style={styles.highlight}>random NFT Pokemon card</span> is selected from the
                prize pool and sent directly to your wallet. Every catch is a surprise!
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>Good luck, trainer!</div>

        {/* Close button at bottom */}
        <button
          style={styles.closeButtonBottom}
          onClick={onClose}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#ffdd44')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ffcc00')}
        >
          GOT IT!
        </button>
      </div>
    </div>
  );
}

export default HelpModal;
