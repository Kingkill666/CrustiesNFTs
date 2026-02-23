// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CrustiesNFT is ERC721, ERC721URIStorage, ERC721Royalty, Ownable {
    uint256 public totalMinted;
    uint256 public maxSupply = 3333;
    uint256 public maxMintsPerWallet = 3;
    uint256 public minEthPrice;
    uint256 public minTokenPrice;

    IERC20 public paymentToken;
    address public treasury;

    mapping(address => uint256) public mintCount;

    event Minted(address indexed to, uint256 indexed tokenId, string paymentType);

    constructor(
        address _paymentToken,
        address _treasury,
        uint256 _minEthPrice,
        uint256 _minTokenPrice
    ) ERC721("Crusties", "CRUSTIES") Ownable(msg.sender) {
        paymentToken = IERC20(_paymentToken);
        treasury = _treasury;
        minEthPrice = _minEthPrice;
        minTokenPrice = _minTokenPrice;
        _setDefaultRoyalty(_treasury, 250);
    }

    function mintWithETH(string calldata _tokenURI) external payable returns (uint256) {
        require(msg.value >= minEthPrice, "Below min ETH price");
        require(canMint(msg.sender), "Cannot mint");
        uint256 tokenId = ++totalMinted;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        mintCount[msg.sender]++;
        (bool sent,) = treasury.call{value: msg.value}("");
        require(sent, "ETH transfer failed");
        emit Minted(msg.sender, tokenId, "eth");
        return tokenId;
    }

    function mintWithToken(string calldata _tokenURI, uint256 tokenAmount) external returns (uint256) {
        require(tokenAmount >= minTokenPrice, "Below min token price");
        require(canMint(msg.sender), "Cannot mint");
        uint256 tokenId = ++totalMinted;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        mintCount[msg.sender]++;
        require(paymentToken.transferFrom(msg.sender, treasury, tokenAmount), "Token transfer failed");
        emit Minted(msg.sender, tokenId, "token");
        return tokenId;
    }

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

    function setMinEthPrice(uint256 _price) external onlyOwner {
        minEthPrice = _price;
    }

    function setMinTokenPrice(uint256 _price) external onlyOwner {
        minTokenPrice = _price;
    }

    function setMaxMintsPerWallet(uint256 _max) external onlyOwner {
        maxMintsPerWallet = _max;
    }

    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }

    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, ERC721Royalty)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _update(address to, uint256 tokenId, address auth) internal override(ERC721) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value) internal override(ERC721) {
        super._increaseBalance(account, value);
    }
}
