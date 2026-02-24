// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {CrustiesNFT} from "../src/CrustiesNFT.sol";

contract DeployScript is Script {
    function run() public {
        address paymentToken = vm.envAddress("USDC_TOKEN_ADDRESS");
        address treasury = vm.envAddress("TREASURY_ADDRESS");
        uint256 minEthPrice = vm.envUint("MIN_ETH_PRICE");
        uint256 minTokenPrice = vm.envUint("MIN_TOKEN_PRICE");

        vm.startBroadcast();

        CrustiesNFT nft = new CrustiesNFT(paymentToken, treasury, minEthPrice, minTokenPrice);

        console.log("CrustiesNFT deployed to:", address(nft));
        console.log("Payment token:", paymentToken);
        console.log("Treasury:", treasury);

        vm.stopBroadcast();
    }
}
