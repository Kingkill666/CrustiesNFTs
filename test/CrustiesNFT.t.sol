// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {CrustiesNFT} from "../src/CrustiesNFT.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockPizza is ERC20 {
    constructor() ERC20("Pizza", "PIZZA") {
        _mint(msg.sender, 1_000_000 ether);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract CrustiesNFTTest is Test {
    CrustiesNFT public nft;
    MockPizza public pizza;

    address public owner = address(this);
    address public treasury = makeAddr("treasury");
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    uint256 public constant MIN_ETH_PRICE = 0.001 ether;
    uint256 public constant MIN_TOKEN_PRICE = 1000 ether;

    string public constant TOKEN_URI = "ipfs://QmTestHash123/metadata.json";
    string public constant TOKEN_URI_2 = "ipfs://QmTestHash456/metadata.json";

    function setUp() public {
        pizza = new MockPizza();
        nft = new CrustiesNFT(address(pizza), treasury, MIN_ETH_PRICE, MIN_TOKEN_PRICE);

        pizza.mint(alice, 10_000 ether);
        pizza.mint(bob, 10_000 ether);

        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
    }

    // ==================== Constructor ====================

    function test_Constructor() public view {
        assertEq(nft.name(), "Crusties");
        assertEq(nft.symbol(), "CRUSTIES");
        assertEq(nft.maxSupply(), 3333);
        assertEq(nft.maxMintsPerWallet(), 3);
        assertEq(nft.minEthPrice(), MIN_ETH_PRICE);
        assertEq(nft.minTokenPrice(), MIN_TOKEN_PRICE);
        assertEq(address(nft.paymentToken()), address(pizza));
        assertEq(nft.treasury(), treasury);
        assertEq(nft.totalMinted(), 0);
        assertEq(nft.owner(), owner);
    }

    function test_ConstructorRoyalty() public view {
        (address receiver, uint256 royaltyAmount) = nft.royaltyInfo(1, 10000);
        assertEq(receiver, treasury);
        assertEq(royaltyAmount, 250);
    }

    // ==================== mintWithETH ====================

    function test_MintWithETH() public {
        vm.prank(alice);
        uint256 tokenId = nft.mintWithETH{value: MIN_ETH_PRICE}(TOKEN_URI);

        assertEq(tokenId, 1);
        assertEq(nft.ownerOf(1), alice);
        assertEq(nft.tokenURI(1), TOKEN_URI);
        assertEq(nft.totalMinted(), 1);
        assertEq(nft.mintCount(alice), 1);
        assertEq(treasury.balance, MIN_ETH_PRICE);
    }

    function test_MintWithETH_OverpayAllowed() public {
        uint256 overpay = MIN_ETH_PRICE * 2;
        vm.prank(alice);
        nft.mintWithETH{value: overpay}(TOKEN_URI);

        assertEq(treasury.balance, overpay);
    }

    function test_MintWithETH_EmitsMinted() public {
        vm.expectEmit(true, true, false, true);
        emit CrustiesNFT.Minted(alice, 1, "eth");

        vm.prank(alice);
        nft.mintWithETH{value: MIN_ETH_PRICE}(TOKEN_URI);
    }

    function test_MintWithETH_RevertsBelowMinPrice() public {
        vm.prank(alice);
        vm.expectRevert("Below min ETH price");
        nft.mintWithETH{value: MIN_ETH_PRICE - 1}(TOKEN_URI);
    }

    function test_MintWithETH_RevertsAtWalletCap() public {
        vm.startPrank(alice);
        nft.mintWithETH{value: MIN_ETH_PRICE}("ipfs://1");
        nft.mintWithETH{value: MIN_ETH_PRICE}("ipfs://2");
        nft.mintWithETH{value: MIN_ETH_PRICE}("ipfs://3");

        vm.expectRevert("Cannot mint");
        nft.mintWithETH{value: MIN_ETH_PRICE}("ipfs://4");
        vm.stopPrank();
    }

    // ==================== mintWithToken ====================

    function test_MintWithToken() public {
        vm.startPrank(alice);
        pizza.approve(address(nft), MIN_TOKEN_PRICE);
        uint256 tokenId = nft.mintWithToken(TOKEN_URI, MIN_TOKEN_PRICE);
        vm.stopPrank();

        assertEq(tokenId, 1);
        assertEq(nft.ownerOf(1), alice);
        assertEq(nft.tokenURI(1), TOKEN_URI);
        assertEq(nft.totalMinted(), 1);
        assertEq(nft.mintCount(alice), 1);
        assertEq(pizza.balanceOf(treasury), MIN_TOKEN_PRICE);
    }

    function test_MintWithToken_EmitsMinted() public {
        vm.startPrank(alice);
        pizza.approve(address(nft), MIN_TOKEN_PRICE);

        vm.expectEmit(true, true, false, true);
        emit CrustiesNFT.Minted(alice, 1, "token");

        nft.mintWithToken(TOKEN_URI, MIN_TOKEN_PRICE);
        vm.stopPrank();
    }

    function test_MintWithToken_RevertsBelowMinPrice() public {
        vm.startPrank(alice);
        pizza.approve(address(nft), MIN_TOKEN_PRICE);

        vm.expectRevert("Below min token price");
        nft.mintWithToken(TOKEN_URI, MIN_TOKEN_PRICE - 1);
        vm.stopPrank();
    }

    function test_MintWithToken_RevertsWithoutApproval() public {
        vm.prank(alice);
        vm.expectRevert();
        nft.mintWithToken(TOKEN_URI, MIN_TOKEN_PRICE);
    }

    function test_MintWithToken_RevertsAtWalletCap() public {
        vm.startPrank(alice);
        pizza.approve(address(nft), MIN_TOKEN_PRICE * 4);

        nft.mintWithToken("ipfs://1", MIN_TOKEN_PRICE);
        nft.mintWithToken("ipfs://2", MIN_TOKEN_PRICE);
        nft.mintWithToken("ipfs://3", MIN_TOKEN_PRICE);

        vm.expectRevert("Cannot mint");
        nft.mintWithToken("ipfs://4", MIN_TOKEN_PRICE);
        vm.stopPrank();
    }

    // ==================== Supply Cap ====================

    function test_MintRevertsAtMaxSupply() public {
        // Set max supply to 2 for quick testing
        nft.setMaxMintsPerWallet(10000);

        // Mint up to max supply
        for (uint256 i = 0; i < 3333; i++) {
            address minter = makeAddr(string(abi.encodePacked("minter", i)));
            vm.deal(minter, 1 ether);
            vm.prank(minter);
            nft.mintWithETH{value: MIN_ETH_PRICE}(TOKEN_URI);
        }

        assertEq(nft.totalMinted(), 3333);
        assertEq(nft.remainingSupply(), 0);

        address extraMinter = makeAddr("extra");
        vm.deal(extraMinter, 1 ether);
        vm.prank(extraMinter);
        vm.expectRevert("Cannot mint");
        nft.mintWithETH{value: MIN_ETH_PRICE}(TOKEN_URI);
    }

    // ==================== View Functions ====================

    function test_CanMint() public view {
        assertTrue(nft.canMint(alice));
    }

    function test_CanMint_FalseAtCap() public {
        vm.startPrank(alice);
        nft.mintWithETH{value: MIN_ETH_PRICE}("ipfs://1");
        nft.mintWithETH{value: MIN_ETH_PRICE}("ipfs://2");
        nft.mintWithETH{value: MIN_ETH_PRICE}("ipfs://3");
        vm.stopPrank();

        assertFalse(nft.canMint(alice));
    }

    function test_RemainingMintsForWallet() public {
        assertEq(nft.remainingMintsForWallet(alice), 3);

        vm.prank(alice);
        nft.mintWithETH{value: MIN_ETH_PRICE}(TOKEN_URI);

        assertEq(nft.remainingMintsForWallet(alice), 2);
    }

    function test_RemainingMintsForWallet_Zero() public {
        vm.startPrank(alice);
        nft.mintWithETH{value: MIN_ETH_PRICE}("ipfs://1");
        nft.mintWithETH{value: MIN_ETH_PRICE}("ipfs://2");
        nft.mintWithETH{value: MIN_ETH_PRICE}("ipfs://3");
        vm.stopPrank();

        assertEq(nft.remainingMintsForWallet(alice), 0);
    }

    function test_RemainingSupply() public {
        assertEq(nft.remainingSupply(), 3333);

        vm.prank(alice);
        nft.mintWithETH{value: MIN_ETH_PRICE}(TOKEN_URI);

        assertEq(nft.remainingSupply(), 3332);
    }

    // ==================== Admin Functions ====================

    function test_SetMinEthPrice() public {
        uint256 newPrice = 0.01 ether;
        nft.setMinEthPrice(newPrice);
        assertEq(nft.minEthPrice(), newPrice);
    }

    function test_SetMinEthPrice_RevertsNonOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        nft.setMinEthPrice(0.01 ether);
    }

    function test_SetMinTokenPrice() public {
        uint256 newPrice = 2000 ether;
        nft.setMinTokenPrice(newPrice);
        assertEq(nft.minTokenPrice(), newPrice);
    }

    function test_SetMinTokenPrice_RevertsNonOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        nft.setMinTokenPrice(2000 ether);
    }

    function test_SetMaxMintsPerWallet() public {
        nft.setMaxMintsPerWallet(5);
        assertEq(nft.maxMintsPerWallet(), 5);
    }

    function test_SetMaxMintsPerWallet_RevertsNonOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        nft.setMaxMintsPerWallet(5);
    }

    function test_SetTreasury() public {
        address newTreasury = makeAddr("newTreasury");
        nft.setTreasury(newTreasury);
        assertEq(nft.treasury(), newTreasury);
    }

    function test_SetTreasury_RevertsNonOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        nft.setTreasury(makeAddr("newTreasury"));
    }

    function test_SetDefaultRoyalty() public {
        address newReceiver = makeAddr("royaltyReceiver");
        nft.setDefaultRoyalty(newReceiver, 500);

        (address receiver, uint256 royaltyAmount) = nft.royaltyInfo(1, 10000);
        assertEq(receiver, newReceiver);
        assertEq(royaltyAmount, 500);
    }

    function test_SetDefaultRoyalty_RevertsNonOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        nft.setDefaultRoyalty(makeAddr("royaltyReceiver"), 500);
    }

    // ==================== ERC-165 Interface ====================

    function test_SupportsERC721() public view {
        assertTrue(nft.supportsInterface(0x80ac58cd)); // ERC-721
    }

    function test_SupportsERC721Metadata() public view {
        assertTrue(nft.supportsInterface(0x5b5e139f)); // ERC-721 Metadata
    }

    function test_SupportsERC2981() public view {
        assertTrue(nft.supportsInterface(0x2a55205a)); // ERC-2981
    }

    // ==================== Multiple Minters ====================

    function test_MultipleMintersDifferentPayments() public {
        // Alice mints with ETH
        vm.prank(alice);
        uint256 tokenId1 = nft.mintWithETH{value: MIN_ETH_PRICE}(TOKEN_URI);

        // Bob mints with PIZZA token
        vm.startPrank(bob);
        pizza.approve(address(nft), MIN_TOKEN_PRICE);
        uint256 tokenId2 = nft.mintWithToken(TOKEN_URI_2, MIN_TOKEN_PRICE);
        vm.stopPrank();

        assertEq(tokenId1, 1);
        assertEq(tokenId2, 2);
        assertEq(nft.ownerOf(1), alice);
        assertEq(nft.ownerOf(2), bob);
        assertEq(nft.tokenURI(1), TOKEN_URI);
        assertEq(nft.tokenURI(2), TOKEN_URI_2);
        assertEq(nft.totalMinted(), 2);
        assertEq(treasury.balance, MIN_ETH_PRICE);
        assertEq(pizza.balanceOf(treasury), MIN_TOKEN_PRICE);
    }
}
