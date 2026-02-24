interface ModeSwitcherProps {
  currentMode: 'adventure' | 'easy';
  onSwitch: (mode: 'adventure' | 'easy') => void;
  onShowHelp?: () => void;
}

export function ModeSwitcher({ currentMode, onSwitch, onShowHelp }: ModeSwitcherProps) {
  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    backgroundColor: active ? '#1a3a1a' : '#1a1a1a',
    color: active ? '#00ff88' : '#666',
    border: `2px solid ${active ? '#00ff88' : '#333'}`,
    fontFamily: "'Courier New', monospace",
    fontSize: '11px',
    fontWeight: 'bold',
    cursor: 'pointer',
    letterSpacing: '1px',
    transition: 'all 0.1s',
  });

  return (
    <div
      style={{
        position: 'fixed',
        top: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 900,
        display: 'flex',
        gap: '4px',
        alignItems: 'center',
      }}
    >
      <button style={btnStyle(currentMode === 'adventure')} onClick={() => onSwitch('adventure')}>
        ADVENTURE
      </button>
      <button style={btnStyle(currentMode === 'easy')} onClick={() => onSwitch('easy')}>
        ENCOUNTER
      </button>
      {onShowHelp && (
        <button
          onClick={onShowHelp}
          title="How to Play"
          style={{
            padding: '4px 10px',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            border: '2px solid #ffcc00',
            color: '#ffcc00',
            fontFamily: "'Courier New', monospace",
            fontSize: '13px',
            fontWeight: 'bold',
            cursor: 'pointer',
            lineHeight: 1,
            transition: 'all 0.1s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 204, 0, 0.15)';
            e.currentTarget.style.borderColor = '#ffdd44';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
            e.currentTarget.style.borderColor = '#ffcc00';
          }}
        >
          ?
        </button>
      )}
    </div>
  );
}
