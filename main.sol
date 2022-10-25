// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract Main is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    address owner;

    // config
    uint32 supplyTotal = 10000;
    uint8 maxAmount = 5;
    uint8 minAmount = 1;
    uint MintOneForUser = 0.0088 ether;
    uint MintOneForWl = 0.0088 ether;

    bytes32 public root;

    // contract and token
    string contractURI;
    string baseURI;

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _contranctURI,
        string memory _baseURI,
        bytes32 _rootNode
    ) ERC721(_name, _symbol) {
        // init config
        owner = msg.sender;
        contractURI = _contranctURI;
        baseURI = _baseURI;
        root = _rootNode;

        _tokenIds.increment();
    }

    function mint(address player) private {
        uint256 tokenId = _tokenIds.current();
        _mint(player, tokenId);
        _tokenIds.increment();
    }

    function mintGuest(address player, uint8 times) external payable {
        require((_tokenIds.current() + times) <= supplyTotal, "ERR_MINT_OVERFLOW_MAX");
        require(msg.value >= MintOneForUser * times, "ERR_NOT_ENOUGH_ETH");
        require(minAmount <= times && times <= maxAmount);

        for (uint i = 0; i < times; i++) {
            mint(player);
        }
    }

    function mintWhiteList(address player, bytes32[] memory proof, uint8 times) external {
        require((_tokenIds.current() + times) <= supplyTotal, "ERR_MINT_OVERFLOW_MAX");
        require(isWhiteLists(proof, keccak256(abi.encodePacked(player))));
        for (uint i = 0; i < maxAmount; i++) {
            mint(player);
        }
    }

    function mintMore(address player, uint8 times) external onlyOwner {
        require((_tokenIds.current() + times) <= supplyTotal, "ERR_MINT_OVERFLOW_MAX");
        for (uint key = 0; key < times; key++) {
            mint(player);
        }
    }

    function setMintTotal(uint32 _supplyTotal) external onlyOwner {
        supplyTotal = _supplyTotal;
    }

    function setMerkleTreeRoot(bytes32 _root) external onlyOwner {
        root = _root;
    }

    function isWhiteLists(bytes32[] memory proof, bytes32 leaf)
        private
        view
        returns (bool)
    {
        return MerkleProof.verify(proof, root, leaf);
    }

    function setContractURI(string memory _contractURI) external {
        contractURI = _contractURI;
    }

    function setBaseURI(string memory _baseURI) external {
        baseURI = _baseURI;
    }

    function tokenURI(uint256 randomIndex)
        public
        view
        override
        returns (string memory)
    {
        return string.concat(baseURI, Strings.toString(randomIndex), ".json");
    }

    function withdraw() public payable onlyOwner {
        (bool success, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(success);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "ERR_ONLY_OWNER");
        _;
    }
}
