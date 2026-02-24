interface ComingSoonProps {
  onBack: () => void;
}

export function ComingSoon({ onBack }: ComingSoonProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
        fontFamily: "'Courier New', monospace",
        zIndex: 100,
      }}
    >
      <h1
        style={{
          color: '#ffcc00',
          fontSize: '36px',
          letterSpacing: '3px',
          marginBottom: '16px',
          textShadow: '2px 2px 0 #aa8800',
        }}
      >
        ENCOUNTER MODE
      </h1>
      <p style={{ color: '#888', fontSize: '16px', marginBottom: '32px' }}>
        Coming Soon
      </p>
      <button
        onClick={onBack}
        style={{
          padding: '12px 24px',
          backgroundColor: '#1a3a1a',
          color: '#00ff88',
          border: '2px solid #00ff88',
          fontFamily: "'Courier New', monospace",
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
          letterSpacing: '2px',
        }}
      >
        BACK TO ADVENTURE
      </button>
    </div>
  );
}
