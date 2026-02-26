// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {CrustiesNFT} from "../src/CrustiesNFT.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/// @notice Deploys CrustiesNFT as a UUPS upgradeable proxy on Base Mainnet.
/// @dev Usage: forge script script/Deploy.s.sol --rpc-url base --broadcast --verify
contract DeployScript is Script {
    function run() public {
        address paymentToken = vm.envAddress("USDC_TOKEN_ADDRESS");
        address treasury = vm.envAddress("TREASURY_ADDRESS");
        uint256 minEthPrice = vm.envUint("MIN_ETH_PRICE");
        uint256 minTokenPrice = vm.envUint("MIN_TOKEN_PRICE");
        address signerAddr = vm.envAddress("SIGNER_ADDRESS");

        vm.startBroadcast();

        // 1. Deploy the implementation contract
        CrustiesNFT implementation = new CrustiesNFT();

        // 2. Encode the initialize call
        bytes memory initData = abi.encodeCall(
            CrustiesNFT.initialize,
            (paymentToken, treasury, minEthPrice, minTokenPrice, signerAddr)
        );

        // 3. Deploy the ERC1967 proxy pointing to the implementation
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);

        // The proxy address is the one users interact with
        CrustiesNFT nft = CrustiesNFT(address(proxy));

        console.log("=== CrustiesNFT Deployed (UUPS Proxy) ===");
        console.log("Proxy address:         ", address(proxy));
        console.log("Implementation address:", address(implementation));
        console.log("Payment token (USDC):  ", paymentToken);
        console.log("Treasury:              ", treasury);
        console.log("Owner:                 ", nft.owner());
        console.log("Signer:                ", nft.signer());
        console.log("Min ETH price:         ", nft.minEthPrice());
        console.log("Min token price:       ", nft.minTokenPrice());

        vm.stopBroadcast();
    }
}

/// @notice Upgrades an existing CrustiesNFT proxy to V2 (adds EIP-712 signatures, Enumerable, Pausable, etc).
/// @dev Usage: PROXY_ADDRESS=0x... SIGNER_ADDRESS=0x... forge script script/Deploy.s.sol:UpgradeScript --rpc-url base --broadcast
contract UpgradeScript is Script {
    function run() public {
        address proxyAddress = vm.envAddress("PROXY_ADDRESS");
        address signerAddr = vm.envAddress("SIGNER_ADDRESS");

        vm.startBroadcast();

        // Deploy the new implementation
        CrustiesNFT newImplementation = new CrustiesNFT();

        // Encode the V2 re-initializer call
        bytes memory initV2Data = abi.encodeCall(
            CrustiesNFT.initializeV2,
            (signerAddr)
        );

        // Upgrade the proxy and call initializeV2
        CrustiesNFT proxy = CrustiesNFT(proxyAddress);
        proxy.upgradeToAndCall(address(newImplementation), initV2Data);

        console.log("=== CrustiesNFT Upgraded to V2 ===");
        console.log("Proxy address:             ", proxyAddress);
        console.log("New implementation address: ", address(newImplementation));
        console.log("Signer:                    ", proxy.signer());

        vm.stopBroadcast();
    }
}
