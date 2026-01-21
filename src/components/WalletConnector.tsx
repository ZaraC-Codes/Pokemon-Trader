import { ConnectButton } from '@rainbow-me/rainbowkit';

/**
 * WalletConnector Component
 *
 * Renders the RainbowKit wallet connect button in the top-right corner.
 * Uses CSS class for positioning to coordinate with GameHUD layout.
 */
export default function WalletConnector() {
  return (
    <div className="wallet-connector">
      <ConnectButton />
    </div>
  );
}
