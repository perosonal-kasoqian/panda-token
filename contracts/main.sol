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
    uint32 supplyTotal = 5555;
    uint8 maxAmount = 5;
    uint8 minAmount = 1;
    uint MintOneForUser = 0.08 ether;
    uint MintOneForWl = 0.06 ether;

    bytes32 public root;
    uint startTime;

    // contract and token
    string public contractURI;
    string baseURI;

    mapping(address => uint8) userHasMint;

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _contranctURI,
        string memory _baseURI,
        uint _startTime
    ) ERC721(_name, _symbol) {
        // init config
        owner = msg.sender;
        contractURI = _contranctURI;
        baseURI = _baseURI;
        startTime = _startTime;

        _tokenIds.increment();
    }

    function mint(address player) private {
        uint tokenId = _tokenIds.current();
        _mint(player, tokenId);
        _tokenIds.increment();
    }

    function mintGuest(uint8 times) external payable onlyMint(times, false) {
        for (uint i = 0; i < times; i++) {
            mint(msg.sender);
        }
    }

    function mintWhiteList(bytes32[] memory proof, uint8 times) external payable onlyMint(times, true) {
        require(isWhiteLists(proof, keccak256(abi.encodePacked(msg.sender))));
        for (uint i = 0; i < maxAmount; i++) {
            mint(msg.sender);
        }
    }

    function isWhiteLists(bytes32[] memory proof, bytes32 leaf) private view returns (bool) {
        return MerkleProof.verify(proof, root, leaf);
    }

    function tokenURI(uint tokenId) public view override returns (string memory) {
        return string.concat(baseURI, Strings.toString(tokenId), ".json");
    }

    function withdraw() external payable onlyOwner {
        (bool success, ) = payable(msg.sender).call{value: address(this).balance}("");
        require(success);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "ERR_ONLY_OWNER");
        _;
    }

    modifier onlyMint(uint8 times, bool isWlType) {
        require((_tokenIds.current() + times) <= supplyTotal && (userHasMint[msg.sender] + times) <= maxAmount, "ERR_MINT_OVERFLOW_MAX");
        require(block.timestamp >= startTime, "ERR_NOT_START");

        if (isWlType) {
            require(msg.value >= MintOneForWl * times, "ERR_NOT_ENOUGH_ETH");
        } else {
            require(msg.value >= MintOneForUser * times, "ERR_NOT_ENOUGH_ETH");
        }
        _;
        userHasMint[msg.sender] += times;
    }

    function setStartTime(uint _startTime) external onlyOwner {
        startTime = _startTime;
    }

    function setContractURI(string memory _contractURI) external {
        contractURI = _contractURI;
    }

    function setBaseURI(string memory _baseURI) external {
        baseURI = _baseURI;
    }

    function setMerkleRoot(bytes32 _root) external onlyOwner {
        root = _root;
    }
}
