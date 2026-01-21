/**
 * UUPS Upgrade Script: PokeballGame v1.1.0 → v1.2.0
 *
 * This script upgrades the PokeballGame proxy to the new implementation
 * that supports 20 active Pokemon instead of 3.
 *
 * IMPORTANT: Run this with the owner wallet that deployed the original proxy.
 *
 * Usage:
 *   npx hardhat run contracts/deployment/upgrade_PokeballGameV2.cjs --network apechain
 *
 * Before running:
 * 1. Ensure PRIVATE_KEY in .env.local is the owner wallet
 * 2. Verify you have enough APE for gas
 * 3. The contract should NOT be paused during upgrade
 */

const { ethers, upgrades } = require("hardhat");

// Load addresses from addresses.json
const addresses = require("../addresses.json");

async function main() {
  console.log("=".repeat(60));
  console.log("PokeballGame UUPS Upgrade: v1.1.0 → v1.2.0");
  console.log("=".repeat(60));

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("\nDeployer address:", deployer.address);

  // Get deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "APE");

  // Proxy address from addresses.json
  const proxyAddress = addresses.contracts.PokeballGame;
  console.log("\nProxy address:", proxyAddress);

  // Verify deployer is the owner
  const existingContract = await ethers.getContractAt(
    "PokeballGame",
    proxyAddress
  );
  const currentOwner = await existingContract.owner();
  console.log("Current owner:", currentOwner);

  if (currentOwner.toLowerCase() !== deployer.address.toLowerCase()) {
    console.error("\n❌ ERROR: Deployer is not the contract owner!");
    console.error("   Owner required:", currentOwner);
    console.error("   Your address:", deployer.address);
    process.exit(1);
  }
  console.log("✓ Deployer is the owner");

  // Check current state before upgrade
  console.log("\n--- Pre-Upgrade State ---");
  const currentMaxPokemon = await existingContract.MAX_ACTIVE_POKEMON();
  console.log("Current MAX_ACTIVE_POKEMON:", currentMaxPokemon.toString());

  // Get current active Pokemon (slots 0-2)
  const preUpgradePokemons = [];
  for (let i = 0; i < 3; i++) {
    try {
      const pokemon = await existingContract.getPokemon(i);
      if (pokemon.isActive) {
        preUpgradePokemons.push({
          slot: i,
          id: pokemon.id.toString(),
          x: pokemon.positionX.toString(),
          y: pokemon.positionY.toString(),
        });
      }
    } catch (e) {
      // Slot empty or error
    }
  }
  console.log("Active Pokemon before upgrade:", preUpgradePokemons.length);
  preUpgradePokemons.forEach((p) => {
    console.log(`  Slot ${p.slot}: ID=${p.id}, pos=(${p.x}, ${p.y})`);
  });

  // Get the new implementation contract factory
  // NOTE: The contract file is PokeballGameV2.sol but the contract name is still "PokeballGame"
  console.log("\n--- Deploying New Implementation ---");
  const PokeballGameV2 = await ethers.getContractFactory("PokeballGame", {
    libraries: {},
  });

  // Upgrade using OpenZeppelin upgrades plugin
  console.log("Upgrading proxy to new implementation...");
  const upgraded = await upgrades.upgradeProxy(proxyAddress, PokeballGameV2, {
    kind: "uups",
  });

  await upgraded.waitForDeployment();
  const newImplAddress = await upgrades.erc1967.getImplementationAddress(
    proxyAddress
  );

  console.log("✓ Upgrade complete!");
  console.log("  Proxy address (unchanged):", proxyAddress);
  console.log("  New implementation:", newImplAddress);

  // Verify post-upgrade state
  console.log("\n--- Post-Upgrade Verification ---");
  const newMaxPokemon = await upgraded.MAX_ACTIVE_POKEMON();
  console.log("New MAX_ACTIVE_POKEMON:", newMaxPokemon.toString());

  if (newMaxPokemon.toString() !== "20") {
    console.error("❌ ERROR: MAX_ACTIVE_POKEMON should be 20!");
    process.exit(1);
  }
  console.log("✓ MAX_ACTIVE_POKEMON correctly upgraded to 20");

  // Verify existing Pokemon preserved
  console.log("\nVerifying existing Pokemon preserved...");
  for (const p of preUpgradePokemons) {
    const pokemon = await upgraded.getPokemon(p.slot);
    if (
      pokemon.id.toString() === p.id &&
      pokemon.positionX.toString() === p.x &&
      pokemon.positionY.toString() === p.y &&
      pokemon.isActive
    ) {
      console.log(`  ✓ Slot ${p.slot}: Pokemon ${p.id} preserved`);
    } else {
      console.error(`  ❌ Slot ${p.slot}: Data mismatch!`);
    }
  }

  // Test new functions
  console.log("\nTesting new functions...");
  const activeCount = await upgraded.getActivePokemonCount();
  console.log("  getActivePokemonCount():", activeCount.toString());

  const activeSlots = await upgraded.getActivePokemonSlots();
  console.log(
    "  getActivePokemonSlots():",
    activeSlots.map((s) => s.toString())
  );

  // Test that new slots (3-19) are accessible and empty
  console.log("\nVerifying new slots 3-19 are accessible...");
  let emptySlots = 0;
  for (let i = 3; i < 20; i++) {
    const pokemon = await upgraded.getPokemon(i);
    if (!pokemon.isActive && pokemon.id.toString() === "0") {
      emptySlots++;
    }
  }
  console.log(`  ✓ Slots 3-19: ${emptySlots}/17 empty (expected: 17)`);

  console.log("\n" + "=".repeat(60));
  console.log("UPGRADE SUCCESSFUL!");
  console.log("=".repeat(60));
  console.log("\nNext steps:");
  console.log("1. Update frontend ABI to use abi_PokeballGameV2.json");
  console.log("2. Update TypeScript types for Pokemon[20] return type");
  console.log("3. Spawn Pokemon in slots 3-19 as needed");
  console.log("\nRemember: PokemonSpawned event slotIndex is now 0-19");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
