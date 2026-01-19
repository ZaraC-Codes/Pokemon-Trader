import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function WalletConnector() {
  return (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 1000,
      }}
    >
      <ConnectButton />
    </div>
  );
}
