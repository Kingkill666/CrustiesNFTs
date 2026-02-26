// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {ERC721URIStorageUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import {ERC721RoyaltyUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol";
import {ERC721EnumerableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {EIP712Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import {NoncesUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/NoncesUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ReentrancyGuardTransient} from "@openzeppelin/contracts/utils/ReentrancyGuardTransient.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC4906} from "@openzeppelin/contracts/interfaces/IERC4906.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

contract CrustiesNFT is
    Initializable,
    IERC4906,
    ERC721Upgradeable,
    ERC721URIStorageUpgradeable,
    ERC721RoyaltyUpgradeable,
    ERC721EnumerableUpgradeable,
    Ownable2StepUpgradeable,
    PausableUpgradeable,
    EIP712Upgradeable,
    NoncesUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardTransient
{
    // ==================== Custom Errors ====================

    error BelowMinEthPrice();
    error BelowMinTokenPrice();
    error CannotMint();
    error EthTransferFailed();
    error TokenTransferFailed();
    error InvalidSignature();
    error MetadataIsFrozen();
    error ZeroAddress();

    // ==================== State Variables ====================

    uint256 public totalMinted;
    uint256 public maxSupply;
    uint256 public maxMintsPerWallet;
    uint256 public minEthPrice;
    uint256 public minTokenPrice;

    IERC20 public paymentToken;
    address public treasury;

    mapping(address => uint256) public mintCount;

    // V2 state variables
    address public signer;
    bool public metadataFrozen;
    string public contractURI;

    // ==================== Events ====================

    event Minted(address indexed to, uint256 indexed tokenId, string paymentType);
    event SignerUpdated(address indexed oldSigner, address indexed newSigner);
    event MetadataFrozen();

    // ==================== Constants ====================

    bytes32 private constant MINT_PERMIT_TYPEHASH =
        keccak256("MintPermit(address minter,string tokenURI,uint256 nonce)");

    // ==================== Constructor ====================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // ==================== Initializers ====================

    function initialize(
        address _paymentToken,
        address _treasury,
        uint256 _minEthPrice,
        uint256 _minTokenPrice,
        address _signer
    ) public initializer {
        __ERC721_init("Crusties", "CRUSTIES");
        __ERC721URIStorage_init();
        __ERC721Royalty_init();
        __ERC721Enumerable_init();
        __Ownable_init(msg.sender);
        __Ownable2Step_init();
        __Pausable_init();
        __EIP712_init("CrustiesNFT", "1");
        __Nonces_init();

        if (_signer == address(0)) revert ZeroAddress();

        paymentToken = IERC20(_paymentToken);
        treasury = _treasury;
        minEthPrice = _minEthPrice;
        minTokenPrice = _minTokenPrice;
        maxSupply = 500;
        maxMintsPerWallet = 3;
        signer = _signer;
        _setDefaultRoyalty(_treasury, 250);
    }

    /// @notice Re-initializer for upgrading from V1 to V2
    function initializeV2(address _signer) public reinitializer(2) {
        __ERC721Enumerable_init();
        __Ownable2Step_init();
        __Pausable_init();
        __EIP712_init("CrustiesNFT", "1");
        __Nonces_init();

        if (_signer == address(0)) revert ZeroAddress();
        signer = _signer;
    }

    // ==================== Signature Verification ====================

    function _verifyMintPermit(
        address minter,
        string calldata _tokenURI,
        bytes calldata signature
    ) private {
        uint256 currentNonce = _useNonce(minter);

        bytes32 structHash = keccak256(
            abi.encode(
                MINT_PERMIT_TYPEHASH,
                minter,
                keccak256(bytes(_tokenURI)),
                currentNonce
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address recovered = ECDSA.recover(digest, signature);

        if (recovered != signer) revert InvalidSignature();
    }

    // ==================== Mint Functions ====================

    function mintWithETH(
        string calldata _tokenURI,
        bytes calldata signature
    ) external payable whenNotPaused nonReentrant returns (uint256) {
        if (msg.value < minEthPrice) revert BelowMinEthPrice();
        if (!canMint(msg.sender)) revert CannotMint();

        _verifyMintPermit(msg.sender, _tokenURI, signature);

        uint256 tokenId = ++totalMinted;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        mintCount[msg.sender]++;

        (bool sent,) = treasury.call{value: msg.value}("");
        if (!sent) revert EthTransferFailed();

        emit Minted(msg.sender, tokenId, "eth");
        emit MetadataUpdate(tokenId);
        return tokenId;
    }

    function mintWithToken(
        string calldata _tokenURI,
        uint256 tokenAmount,
        bytes calldata signature
    ) external whenNotPaused nonReentrant returns (uint256) {
        if (tokenAmount < minTokenPrice) revert BelowMinTokenPrice();
        if (!canMint(msg.sender)) revert CannotMint();

        _verifyMintPermit(msg.sender, _tokenURI, signature);

        uint256 tokenId = ++totalMinted;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        mintCount[msg.sender]++;

        bool transferred = paymentToken.transferFrom(msg.sender, treasury, tokenAmount);
        if (!transferred) revert TokenTransferFailed();

        emit Minted(msg.sender, tokenId, "token");
        emit MetadataUpdate(tokenId);
        return tokenId;
    }

    // ==================== View Functions ====================

    function canMint(address wallet) public view returns (bool) {
        return mintCount[wallet] < maxMintsPerWallet && totalMinted < maxSupply;
    }

    function remainingMintsForWallet(address wallet) external view returns (uint256) {
        if (mintCount[wallet] >= maxMintsPerWallet) return 0;
        return maxMintsPerWallet - mintCount[wallet];
    }

    function remainingSupply() external view returns (uint256) {
        return maxSupply - totalMinted;
    }

    // ==================== Admin Functions (onlyOwner) ====================

    function setMinEthPrice(uint256 _price) external onlyOwner {
        minEthPrice = _price;
    }

    function setMinTokenPrice(uint256 _price) external onlyOwner {
        minTokenPrice = _price;
    }

    function setMaxMintsPerWallet(uint256 _max) external onlyOwner {
        maxMintsPerWallet = _max;
    }

    function setMaxSupply(uint256 _max) external onlyOwner {
        maxSupply = _max;
    }

    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }

    function setPaymentToken(address _token) external onlyOwner {
        paymentToken = IERC20(_token);
    }

    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function setSigner(address _signer) external onlyOwner {
        if (_signer == address(0)) revert ZeroAddress();
        emit SignerUpdated(signer, _signer);
        signer = _signer;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function freezeMetadata() external onlyOwner {
        metadataFrozen = true;
        emit MetadataFrozen();
        if (totalMinted > 0) {
            emit BatchMetadataUpdate(1, totalMinted);
        }
    }

    function setContractURI(string calldata _contractURI) external onlyOwner {
        contractURI = _contractURI;
    }

    // ==================== Metadata Freeze Override ====================

    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal override {
        if (metadataFrozen) revert MetadataIsFrozen();
        super._setTokenURI(tokenId, _tokenURI);
    }

    // ==================== UUPS Upgrade Authorization ====================

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // ==================== Required Overrides ====================

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(IERC165, ERC721Upgradeable, ERC721URIStorageUpgradeable, ERC721RoyaltyUpgradeable, ERC721EnumerableUpgradeable)
        returns (bool)
    {
        return
            interfaceId == bytes4(0x49064906) || // ERC-4906
            super.supportsInterface(interfaceId);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
    {
        super._increaseBalance(account, value);
    }

    // ==================== Storage Gap ====================
    // Original 50 reduced by 3 new state variables (signer, metadataFrozen, contractURI).
    uint256[47] private __gap;
}
