interface ModeSwitcherProps {
  currentMode: 'adventure' | 'easy';
  onSwitch: (mode: 'adventure' | 'easy') => void;
}

export function ModeSwitcher({ currentMode, onSwitch }: ModeSwitcherProps) {
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
        zIndex: 1500,
        display: 'flex',
        gap: '4px',
      }}
    >
      <button style={btnStyle(currentMode === 'adventure')} onClick={() => onSwitch('adventure')}>
        ADVENTURE
      </button>
      <button style={btnStyle(currentMode === 'easy')} onClick={() => onSwitch('easy')}>
        ENCOUNTER
      </button>
    </div>
  );
}
