// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CrustiesNFT} from "../src/CrustiesNFT.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {IERC4906} from "@openzeppelin/contracts/interfaces/IERC4906.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {
        _mint(msg.sender, 1_000_000e6);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }
}

contract CrustiesNFTTest is Test {
    CrustiesNFT public nft;
    CrustiesNFT public implementation;
    MockUSDC public usdc;

    // Signer key pair for EIP-712
    uint256 public signerPrivateKey = 0xA11CE;
    address public signerAddress;

    address public owner = address(this);
    address public treasury = makeAddr("treasury");
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    uint256 public constant MIN_ETH_PRICE = 0.001 ether;
    uint256 public constant MIN_TOKEN_PRICE = 3e6; // $3 USDC (6 decimals)

    string public constant TOKEN_URI = "ipfs://QmTestHash123/metadata.json";
    string public constant TOKEN_URI_2 = "ipfs://QmTestHash456/metadata.json";

    // EIP-712 constants (must match contract)
    bytes32 constant MINT_PERMIT_TYPEHASH =
        keccak256("MintPermit(address minter,string tokenURI,uint256 nonce)");

    function setUp() public {
        signerAddress = vm.addr(signerPrivateKey);
        usdc = new MockUSDC();

        // Deploy as UUPS proxy (same as production)
        implementation = new CrustiesNFT();
        bytes memory initData = abi.encodeCall(
            CrustiesNFT.initialize,
            (address(usdc), treasury, MIN_ETH_PRICE, MIN_TOKEN_PRICE, signerAddress)
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        nft = CrustiesNFT(address(proxy));

        usdc.mint(alice, 10_000e6);
        usdc.mint(bob, 10_000e6);

        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
    }

    // ==================== EIP-712 Signature Helper ====================

    function _domainSeparator() internal view returns (bytes32) {
        return keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256("CrustiesNFT"),
                keccak256("1"),
                block.chainid,
                address(nft)
            )
        );
    }

    function _signMintPermit(
        uint256 privateKey,
        address minter,
        string memory tokenURI_,
        uint256 nonce
    ) internal view returns (bytes memory) {
        bytes32 structHash = keccak256(
            abi.encode(
                MINT_PERMIT_TYPEHASH,
                minter,
                keccak256(bytes(tokenURI_)),
                nonce
            )
        );

        bytes32 digest = MessageHashUtils.toTypedDataHash(_domainSeparator(), structHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        return abi.encodePacked(r, s, v);
    }

    // ==================== Initialize ====================

    function test_Initialize() public view {
        assertEq(nft.name(), "Crusties");
        assertEq(nft.symbol(), "CRUSTIES");
        assertEq(nft.maxSupply(), 3333);
        assertEq(nft.maxMintsPerWallet(), 3);
        assertEq(nft.minEthPrice(), MIN_ETH_PRICE);
        assertEq(nft.minTokenPrice(), MIN_TOKEN_PRICE);
        assertEq(address(nft.paymentToken()), address(usdc));
        assertEq(nft.treasury(), treasury);
        assertEq(nft.totalMinted(), 0);
        assertEq(nft.owner(), owner);
        assertEq(nft.signer(), signerAddress);
        assertFalse(nft.metadataFrozen());
        assertFalse(nft.paused());
    }

    function test_InitializeRoyalty() public view {
        (address receiver, uint256 royaltyAmount) = nft.royaltyInfo(1, 10000);
        assertEq(receiver, treasury);
        assertEq(royaltyAmount, 250);
    }

    function test_CannotInitializeTwice() public {
        vm.expectRevert();
        nft.initialize(address(usdc), treasury, MIN_ETH_PRICE, MIN_TOKEN_PRICE, signerAddress);
    }

    function test_ImplementationCannotBeInitialized() public {
        vm.expectRevert();
        implementation.initialize(address(usdc), treasury, MIN_ETH_PRICE, MIN_TOKEN_PRICE, signerAddress);
    }

    function test_InitializeRevertsZeroSigner() public {
        CrustiesNFT newImpl = new CrustiesNFT();
        bytes memory initData = abi.encodeCall(
            CrustiesNFT.initialize,
            (address(usdc), treasury, MIN_ETH_PRICE, MIN_TOKEN_PRICE, address(0))
        );
        vm.expectRevert(CrustiesNFT.ZeroAddress.selector);
        new ERC1967Proxy(address(newImpl), initData);
    }

    // ==================== mintWithETH ====================

    function test_MintWithETH() public {
        bytes memory sig = _signMintPermit(signerPrivateKey, alice, TOKEN_URI, 0);

        vm.prank(alice);
        uint256 tokenId = nft.mintWithETH{value: MIN_ETH_PRICE}(TOKEN_URI, sig);

        assertEq(tokenId, 1);
        assertEq(nft.ownerOf(1), alice);
        assertEq(nft.tokenURI(1), TOKEN_URI);
        assertEq(nft.totalMinted(), 1);
        assertEq(nft.mintCount(alice), 1);
        assertEq(treasury.balance, MIN_ETH_PRICE);
        assertEq(nft.nonces(alice), 1);
    }

    function test_MintWithETH_OverpayAllowed() public {
        uint256 overpay = MIN_ETH_PRICE * 2;
        bytes memory sig = _signMintPermit(signerPrivateKey, alice, TOKEN_URI, 0);

        vm.prank(alice);
        nft.mintWithETH{value: overpay}(TOKEN_URI, sig);

        assertEq(treasury.balance, overpay);
    }

    function test_MintWithETH_EmitsMinted() public {
        bytes memory sig = _signMintPermit(signerPrivateKey, alice, TOKEN_URI, 0);

        vm.expectEmit(true, true, false, true);
        emit CrustiesNFT.Minted(alice, 1, "eth");

        vm.prank(alice);
        nft.mintWithETH{value: MIN_ETH_PRICE}(TOKEN_URI, sig);
    }

    function test_MintWithETH_RevertsBelowMinPrice() public {
        bytes memory sig = _signMintPermit(signerPrivateKey, alice, TOKEN_URI, 0);

        vm.prank(alice);
        vm.expectRevert(CrustiesNFT.BelowMinEthPrice.selector);
        nft.mintWithETH{value: MIN_ETH_PRICE - 1}(TOKEN_URI, sig);
    }

    function test_MintWithETH_RevertsAtWalletCap() public {
        vm.startPrank(alice);
        bytes memory s0 = _signMintPermit(signerPrivateKey, alice, "ipfs://1", 0);
        bytes memory s1 = _signMintPermit(signerPrivateKey, alice, "ipfs://2", 1);
        bytes memory s2 = _signMintPermit(signerPrivateKey, alice, "ipfs://3", 2);
        bytes memory s3 = _signMintPermit(signerPrivateKey, alice, "ipfs://4", 3);

        nft.mintWithETH{value: MIN_ETH_PRICE}("ipfs://1", s0);
        nft.mintWithETH{value: MIN_ETH_PRICE}("ipfs://2", s1);
        nft.mintWithETH{value: MIN_ETH_PRICE}("ipfs://3", s2);

        vm.expectRevert(CrustiesNFT.CannotMint.selector);
        nft.mintWithETH{value: MIN_ETH_PRICE}("ipfs://4", s3);
        vm.stopPrank();
    }

    // ==================== mintWithToken (USDC) ====================

    function test_MintWithToken() public {
        bytes memory sig = _signMintPermit(signerPrivateKey, alice, TOKEN_URI, 0);

        vm.startPrank(alice);
        usdc.approve(address(nft), MIN_TOKEN_PRICE);
        uint256 tokenId = nft.mintWithToken(TOKEN_URI, MIN_TOKEN_PRICE, sig);
        vm.stopPrank();

        assertEq(tokenId, 1);
        assertEq(nft.ownerOf(1), alice);
        assertEq(nft.tokenURI(1), TOKEN_URI);
        assertEq(nft.totalMinted(), 1);
        assertEq(nft.mintCount(alice), 1);
        assertEq(usdc.balanceOf(treasury), MIN_TOKEN_PRICE);
        assertEq(nft.nonces(alice), 1);
    }

    function test_MintWithToken_EmitsMinted() public {
        bytes memory sig = _signMintPermit(signerPrivateKey, alice, TOKEN_URI, 0);

        vm.startPrank(alice);
        usdc.approve(address(nft), MIN_TOKEN_PRICE);

        vm.expectEmit(true, true, false, true);
        emit CrustiesNFT.Minted(alice, 1, "token");

        nft.mintWithToken(TOKEN_URI, MIN_TOKEN_PRICE, sig);
        vm.stopPrank();
    }

    function test_MintWithToken_RevertsBelowMinPrice() public {
        bytes memory sig = _signMintPermit(signerPrivateKey, alice, TOKEN_URI, 0);

        vm.startPrank(alice);
        usdc.approve(address(nft), MIN_TOKEN_PRICE);

        vm.expectRevert(CrustiesNFT.BelowMinTokenPrice.selector);
        nft.mintWithToken(TOKEN_URI, MIN_TOKEN_PRICE - 1, sig);
        vm.stopPrank();
    }

    function test_MintWithToken_RevertsWithoutApproval() public {
        bytes memory sig = _signMintPermit(signerPrivateKey, alice, TOKEN_URI, 0);

        vm.prank(alice);
        vm.expectRevert();
        nft.mintWithToken(TOKEN_URI, MIN_TOKEN_PRICE, sig);
    }

    function test_MintWithToken_RevertsAtWalletCap() public {
        vm.startPrank(alice);
        usdc.approve(address(nft), MIN_TOKEN_PRICE * 4);

        bytes memory s0 = _signMintPermit(signerPrivateKey, alice, "ipfs://1", 0);
        bytes memory s1 = _signMintPermit(signerPrivateKey, alice, "ipfs://2", 1);
        bytes memory s2 = _signMintPermit(signerPrivateKey, alice, "ipfs://3", 2);
        bytes memory s3 = _signMintPermit(signerPrivateKey, alice, "ipfs://4", 3);

        nft.mintWithToken("ipfs://1", MIN_TOKEN_PRICE, s0);
        nft.mintWithToken("ipfs://2", MIN_TOKEN_PRICE, s1);
        nft.mintWithToken("ipfs://3", MIN_TOKEN_PRICE, s2);

        vm.expectRevert(CrustiesNFT.CannotMint.selector);
        nft.mintWithToken("ipfs://4", MIN_TOKEN_PRICE, s3);
        vm.stopPrank();
    }

    // ==================== EIP-712 Signature Verification ====================

    function test_MintRevertsInvalidSignature() public {
        uint256 wrongKey = 0xBAD;
        bytes memory badSig = _signMintPermit(wrongKey, alice, TOKEN_URI, 0);

        vm.prank(alice);
        vm.expectRevert(CrustiesNFT.InvalidSignature.selector);
        nft.mintWithETH{value: MIN_ETH_PRICE}(TOKEN_URI, badSig);
    }

    function test_MintRevertsWrongMinter() public {
        // Sign for alice but bob tries to use it
        bytes memory sig = _signMintPermit(signerPrivateKey, alice, TOKEN_URI, 0);

        vm.prank(bob);
        vm.expectRevert(CrustiesNFT.InvalidSignature.selector);
        nft.mintWithETH{value: MIN_ETH_PRICE}(TOKEN_URI, sig);
    }

    function test_MintRevertsWrongTokenURI() public {
        // Sign for TOKEN_URI but pass TOKEN_URI_2
        bytes memory sig = _signMintPermit(signerPrivateKey, alice, TOKEN_URI, 0);

        vm.prank(alice);
        vm.expectRevert(CrustiesNFT.InvalidSignature.selector);
        nft.mintWithETH{value: MIN_ETH_PRICE}(TOKEN_URI_2, sig);
    }

    function test_MintRevertsReplayedSignature() public {
        bytes memory sig = _signMintPermit(signerPrivateKey, alice, TOKEN_URI, 0);

        vm.prank(alice);
        nft.mintWithETH{value: MIN_ETH_PRICE}(TOKEN_URI, sig);

        // Same signature replayed — nonce consumed
        vm.prank(alice);
        vm.expectRevert();
        nft.mintWithETH{value: MIN_ETH_PRICE}(TOKEN_URI, sig);
    }

    function test_NonceIncrements() public {
        assertEq(nft.nonces(alice), 0);

        bytes memory sig0 = _signMintPermit(signerPrivateKey, alice, TOKEN_URI, 0);
        vm.prank(alice);
        nft.mintWithETH{value: MIN_ETH_PRICE}(TOKEN_URI, sig0);
        assertEq(nft.nonces(alice), 1);

        bytes memory sig1 = _signMintPermit(signerPrivateKey, alice, TOKEN_URI_2, 1);
        vm.prank(alice);
        nft.mintWithETH{value: MIN_ETH_PRICE}(TOKEN_URI_2, sig1);
        assertEq(nft.nonces(alice), 2);
    }

    function test_MintWithToken_SignatureRequired() public {
        bytes memory sig = _signMintPermit(signerPrivateKey, alice, TOKEN_URI, 0);

        vm.startPrank(alice);
        usdc.approve(address(nft), MIN_TOKEN_PRICE);
        uint256 tokenId = nft.mintWithToken(TOKEN_URI, MIN_TOKEN_PRICE, sig);
        vm.stopPrank();

        assertEq(tokenId, 1);
        assertEq(nft.nonces(alice), 1);
    }

    // ==================== Supply Cap ====================

    function test_MintRevertsAtMaxSupply() public {
        // Use a smaller supply for this test to keep it fast
        nft.setMaxSupply(10);
        nft.setMaxMintsPerWallet(10000);

        for (uint256 i = 0; i < 10; i++) {
            address minter = makeAddr(string(abi.encodePacked("minter", i)));
            vm.deal(minter, 1 ether);
            string memory uri = string(abi.encodePacked("ipfs://", vm.toString(i)));
            bytes memory sig = _signMintPermit(signerPrivateKey, minter, uri, 0);
            vm.prank(minter);
            nft.mintWithETH{value: MIN_ETH_PRICE}(uri, sig);
        }

        assertEq(nft.totalMinted(), 10);
        assertEq(nft.remainingSupply(), 0);

        address extraMinter = makeAddr("extra");
        vm.deal(extraMinter, 1 ether);
        bytes memory extraSig = _signMintPermit(signerPrivateKey, extraMinter, TOKEN_URI, 0);
        vm.prank(extraMinter);
        vm.expectRevert(CrustiesNFT.CannotMint.selector);
        nft.mintWithETH{value: MIN_ETH_PRICE}(TOKEN_URI, extraSig);
    }

    // ==================== View Functions ====================

    function test_CanMint() public view {
        assertTrue(nft.canMint(alice));
    }

    function test_CanMint_FalseAtCap() public {
        vm.startPrank(alice);
        bytes memory s0 = _signMintPermit(signerPrivateKey, alice, "ipfs://1", 0);
        bytes memory s1 = _signMintPermit(signerPrivateKey, alice, "ipfs://2", 1);
        bytes memory s2 = _signMintPermit(signerPrivateKey, alice, "ipfs://3", 2);

        nft.mintWithETH{value: MIN_ETH_PRICE}("ipfs://1", s0);
        nft.mintWithETH{value: MIN_ETH_PRICE}("ipfs://2", s1);
        nft.mintWithETH{value: MIN_ETH_PRICE}("ipfs://3", s2);
        vm.stopPrank();

        assertFalse(nft.canMint(alice));
    }

    function test_RemainingMintsForWallet() public {
        assertEq(nft.remainingMintsForWallet(alice), 3);

        bytes memory sig = _signMintPermit(signerPrivateKey, alice, TOKEN_URI, 0);
        vm.prank(alice);
        nft.mintWithETH{value: MIN_ETH_PRICE}(TOKEN_URI, sig);

        assertEq(nft.remainingMintsForWallet(alice), 2);
    }

    function test_RemainingMintsForWallet_Zero() public {
        vm.startPrank(alice);
        bytes memory s0 = _signMintPermit(signerPrivateKey, alice, "ipfs://1", 0);
        bytes memory s1 = _signMintPermit(signerPrivateKey, alice, "ipfs://2", 1);
        bytes memory s2 = _signMintPermit(signerPrivateKey, alice, "ipfs://3", 2);

        nft.mintWithETH{value: MIN_ETH_PRICE}("ipfs://1", s0);
        nft.mintWithETH{value: MIN_ETH_PRICE}("ipfs://2", s1);
        nft.mintWithETH{value: MIN_ETH_PRICE}("ipfs://3", s2);
        vm.stopPrank();

        assertEq(nft.remainingMintsForWallet(alice), 0);
    }

    function test_RemainingSupply() public {
        assertEq(nft.remainingSupply(), 3333);

        bytes memory sig = _signMintPermit(signerPrivateKey, alice, TOKEN_URI, 0);
        vm.prank(alice);
        nft.mintWithETH{value: MIN_ETH_PRICE}(TOKEN_URI, sig);

        assertEq(nft.remainingSupply(), 3332);
    }

    // ==================== Pausable ====================

    function test_Pause_BlocksMinting() public {
        nft.pause();
        assertTrue(nft.paused());

        bytes memory sig = _signMintPermit(signerPrivateKey, alice, TOKEN_URI, 0);
        vm.prank(alice);
        vm.expectRevert(PausableUpgradeable.EnforcedPause.selector);
        nft.mintWithETH{value: MIN_ETH_PRICE}(TOKEN_URI, sig);
    }

    function test_Pause_BlocksTokenMint() public {
        nft.pause();

        bytes memory sig = _signMintPermit(signerPrivateKey, alice, TOKEN_URI, 0);
        vm.startPrank(alice);
        usdc.approve(address(nft), MIN_TOKEN_PRICE);
        vm.expectRevert(PausableUpgradeable.EnforcedPause.selector);
        nft.mintWithToken(TOKEN_URI, MIN_TOKEN_PRICE, sig);
        vm.stopPrank();
    }

    function test_Unpause_AllowsMinting() public {
        nft.pause();
        nft.unpause();
        assertFalse(nft.paused());

        bytes memory sig = _signMintPermit(signerPrivateKey, alice, TOKEN_URI, 0);
        vm.prank(alice);
        nft.mintWithETH{value: MIN_ETH_PRICE}(TOKEN_URI, sig);
        assertEq(nft.totalMinted(), 1);
    }

    function test_Pause_RevertsNonOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        nft.pause();
    }

    function test_Unpause_RevertsNonOwner() public {
        nft.pause();
        vm.prank(alice);
        vm.expectRevert();
        nft.unpause();
    }

    // ==================== Ownable2Step ====================

    function test_TransferOwnership_TwoStep() public {
        nft.transferOwnership(alice);
        assertEq(nft.pendingOwner(), alice);
        assertEq(nft.owner(), owner); // still owner until accepted

        vm.prank(alice);
        nft.acceptOwnership();
        assertEq(nft.owner(), alice);
        assertEq(nft.pendingOwner(), address(0));
    }

    function test_AcceptOwnership_RevertsWrongCaller() public {
        nft.transferOwnership(alice);

        vm.prank(bob);
        vm.expectRevert();
        nft.acceptOwnership();
    }

    // ==================== ERC721Enumerable ====================

    function test_Enumerable_TokenOfOwnerByIndex() public {
        bytes memory s0 = _signMintPermit(signerPrivateKey, alice, TOKEN_URI, 0);
        bytes memory s1 = _signMintPermit(signerPrivateKey, alice, TOKEN_URI_2, 1);

        vm.startPrank(alice);
        nft.mintWithETH{value: MIN_ETH_PRICE}(TOKEN_URI, s0);
        nft.mintWithETH{value: MIN_ETH_PRICE}(TOKEN_URI_2, s1);
        vm.stopPrank();

        assertEq(nft.tokenOfOwnerByIndex(alice, 0), 1);
        assertEq(nft.tokenOfOwnerByIndex(alice, 1), 2);
        assertEq(nft.balanceOf(alice), 2);
    }

    function test_Enumerable_TotalSupply() public {
        bytes memory sig = _signMintPermit(signerPrivateKey, alice, TOKEN_URI, 0);
        vm.prank(alice);
        nft.mintWithETH{value: MIN_ETH_PRICE}(TOKEN_URI, sig);

        assertEq(nft.totalSupply(), 1);
    }

    function test_Enumerable_TokenByIndex() public {
        bytes memory sig = _signMintPermit(signerPrivateKey, alice, TOKEN_URI, 0);
        vm.prank(alice);
        nft.mintWithETH{value: MIN_ETH_PRICE}(TOKEN_URI, sig);

        assertEq(nft.tokenByIndex(0), 1);
    }

    function test_SupportsERC721Enumerable() public view {
        assertTrue(nft.supportsInterface(0x780e9d63));
    }

    // ==================== Metadata Freeze ====================

    function test_FreezeMetadata() public {
        bytes memory sig = _signMintPermit(signerPrivateKey, alice, TOKEN_URI, 0);
        vm.prank(alice);
        nft.mintWithETH{value: MIN_ETH_PRICE}(TOKEN_URI, sig);

        nft.freezeMetadata();
        assertTrue(nft.metadataFrozen());
    }

    function test_FreezeMetadata_BlocksMinting() public {
        nft.freezeMetadata();

        bytes memory sig = _signMintPermit(signerPrivateKey, alice, TOKEN_URI, 0);
        vm.prank(alice);
        vm.expectRevert(CrustiesNFT.MetadataIsFrozen.selector);
        nft.mintWithETH{value: MIN_ETH_PRICE}(TOKEN_URI, sig);
    }

    function test_FreezeMetadata_Irreversible() public {
        nft.freezeMetadata();
        assertTrue(nft.metadataFrozen());
        // No unfreeze function — metadata is permanently locked
    }

    function test_FreezeMetadata_RevertsNonOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        nft.freezeMetadata();
    }

    function test_FreezeMetadata_EmitsBatchMetadataUpdate() public {
        bytes memory sig = _signMintPermit(signerPrivateKey, alice, TOKEN_URI, 0);
        vm.prank(alice);
        nft.mintWithETH{value: MIN_ETH_PRICE}(TOKEN_URI, sig);

        vm.expectEmit(false, false, false, true);
        emit IERC4906.BatchMetadataUpdate(1, 1);
        nft.freezeMetadata();
    }

    // ==================== contractURI ====================

    function test_SetContractURI() public {
        string memory uri = "ipfs://QmContractMetadata";
        nft.setContractURI(uri);
        assertEq(nft.contractURI(), uri);
    }

    function test_SetContractURI_RevertsNonOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        nft.setContractURI("ipfs://QmFoo");
    }

    // ==================== Signer Admin ====================

    function test_SetSigner() public {
        address newSigner = makeAddr("newSigner");
        nft.setSigner(newSigner);
        assertEq(nft.signer(), newSigner);
    }

    function test_SetSigner_RevertsZeroAddress() public {
        vm.expectRevert(CrustiesNFT.ZeroAddress.selector);
        nft.setSigner(address(0));
    }

    function test_SetSigner_RevertsNonOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        nft.setSigner(makeAddr("newSigner"));
    }

    function test_SetSigner_OldSignerInvalid() public {
        uint256 newSignerKey = 0xBEEF;
        nft.setSigner(vm.addr(newSignerKey));

        // Old signer's signature should fail
        bytes memory oldSig = _signMintPermit(signerPrivateKey, alice, TOKEN_URI, 0);
        vm.prank(alice);
        vm.expectRevert(CrustiesNFT.InvalidSignature.selector);
        nft.mintWithETH{value: MIN_ETH_PRICE}(TOKEN_URI, oldSig);

        // New signer's signature should work
        bytes memory newSig = _signMintPermit(newSignerKey, alice, TOKEN_URI, 0);
        vm.prank(alice);
        nft.mintWithETH{value: MIN_ETH_PRICE}(TOKEN_URI, newSig);
        assertEq(nft.totalMinted(), 1);
    }

    function test_SetSigner_EmitsEvent() public {
        address newSigner = makeAddr("newSigner");

        vm.expectEmit(true, true, false, false);
        emit CrustiesNFT.SignerUpdated(signerAddress, newSigner);

        nft.setSigner(newSigner);
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
        uint256 newPrice = 5e6;
        nft.setMinTokenPrice(newPrice);
        assertEq(nft.minTokenPrice(), newPrice);
    }

    function test_SetMinTokenPrice_RevertsNonOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        nft.setMinTokenPrice(5e6);
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

    function test_SetMaxSupply() public {
        nft.setMaxSupply(5000);
        assertEq(nft.maxSupply(), 5000);
    }

    function test_SetMaxSupply_RevertsNonOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        nft.setMaxSupply(5000);
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

    function test_SetPaymentToken() public {
        address newToken = makeAddr("newToken");
        nft.setPaymentToken(newToken);
        assertEq(address(nft.paymentToken()), newToken);
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
        assertTrue(nft.supportsInterface(0x80ac58cd));
    }

    function test_SupportsERC721Metadata() public view {
        assertTrue(nft.supportsInterface(0x5b5e139f));
    }

    function test_SupportsERC2981() public view {
        assertTrue(nft.supportsInterface(0x2a55205a));
    }

    function test_SupportsERC4906() public view {
        assertTrue(nft.supportsInterface(0x49064906));
    }

    // ==================== ERC-4906 Events ====================

    function test_MintEmitsMetadataUpdate() public {
        bytes memory sig = _signMintPermit(signerPrivateKey, alice, TOKEN_URI, 0);

        vm.expectEmit(false, false, false, true);
        emit IERC4906.MetadataUpdate(1);

        vm.prank(alice);
        nft.mintWithETH{value: MIN_ETH_PRICE}(TOKEN_URI, sig);
    }

    // ==================== UUPS Upgrade ====================

    function test_UpgradeWorks() public {
        // Mint a token first
        bytes memory sig = _signMintPermit(signerPrivateKey, alice, TOKEN_URI, 0);
        vm.prank(alice);
        nft.mintWithETH{value: MIN_ETH_PRICE}(TOKEN_URI, sig);

        // Deploy new implementation
        CrustiesNFT newImpl = new CrustiesNFT();

        // Upgrade
        nft.upgradeToAndCall(address(newImpl), "");

        // State is preserved through the proxy
        assertEq(nft.totalMinted(), 1);
        assertEq(nft.ownerOf(1), alice);
        assertEq(nft.tokenURI(1), TOKEN_URI);
        assertEq(nft.name(), "Crusties");
        assertEq(nft.signer(), signerAddress);
    }

    function test_UpgradeRevertsNonOwner() public {
        CrustiesNFT newImpl = new CrustiesNFT();

        vm.prank(alice);
        vm.expectRevert();
        nft.upgradeToAndCall(address(newImpl), "");
    }

    // ==================== Multiple Minters ====================

    function test_MultipleMintersDifferentPayments() public {
        bytes memory sigAlice = _signMintPermit(signerPrivateKey, alice, TOKEN_URI, 0);
        bytes memory sigBob = _signMintPermit(signerPrivateKey, bob, TOKEN_URI_2, 0);

        vm.prank(alice);
        uint256 tokenId1 = nft.mintWithETH{value: MIN_ETH_PRICE}(TOKEN_URI, sigAlice);

        vm.startPrank(bob);
        usdc.approve(address(nft), MIN_TOKEN_PRICE);
        uint256 tokenId2 = nft.mintWithToken(TOKEN_URI_2, MIN_TOKEN_PRICE, sigBob);
        vm.stopPrank();

        assertEq(tokenId1, 1);
        assertEq(tokenId2, 2);
        assertEq(nft.ownerOf(1), alice);
        assertEq(nft.ownerOf(2), bob);
        assertEq(nft.tokenURI(1), TOKEN_URI);
        assertEq(nft.tokenURI(2), TOKEN_URI_2);
        assertEq(nft.totalMinted(), 2);
        assertEq(treasury.balance, MIN_ETH_PRICE);
        assertEq(usdc.balanceOf(treasury), MIN_TOKEN_PRICE);
    }
}
