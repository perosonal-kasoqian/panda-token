const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const calGasUsed = require("./utils/calGasUsed.js");
const { MerkleTree } = require("merkletreejs");
const SHA256 = require("crypto-js/sha256");
const keccak256 = require("keccak256");

const Buffer = require("buffer/").Buffer;
const { BigNumber } = require("ethers");

describe("NFT_ERC721", async function () {
  let owner;
  let otherUser;
  let whiteUser1;
  let whiteUser2;
  let nft;

  // whitelist
  let root;
  let whiteUser1Proof;
  let whiteUser2Proof;

  beforeEach(async () => {
    const Signers = await ethers.getSigners();
    owner = Signers[0];
    otherUser = Signers[1];
    whiteUser1 = Signers[2];

    whiteUser2 = Signers[3];

    const whiteList = [whiteUser1, whiteUser2];
    const leaves = whiteList.map((addr) => keccak256(addr.address));
    const tree = new MerkleTree(leaves, keccak256, { sort: true });
    root = tree.getHexRoot();

    whiteUser1Proof = tree.getHexProof(keccak256(whiteUser1.address));
    whiteUser2Proof = tree.getHexProof(keccak256(whiteUser2.address));

    const NFT = await ethers.getContractFactory("NFT_ERC721");
    nft = await NFT.deploy("TEST_NFT", "TN");

    return nft;
  });

  it("deployment information check", async function () {
    expect(await nft.name()).to.equal("TEST_NFT");
    expect(await nft.symbol()).to.equal("TN");
  });

  it("send native token and withdrew", async () => {
    await owner.sendTransaction({
      to: nft.address,
      value: "10000",
    });

    const bBal = await otherUser.getBalance();
    await nft
      .connect(whiteUser1)
      .withdraw(otherUser.address)
      .catch((e) => {
        expect(e.message).to.include("Ownable: caller is not the owner");
      });
    await nft.withdraw(otherUser.address);
    const aBal = await otherUser.getBalance();
    expect(aBal.sub(bBal)).to.equal(10000);
  });

  it("check contractURI and base URI", async () => {
    await nft
      .connect(otherUser)
      .setCustomConfig({
        Root: root,
        StartSaleTime: 10000,
        ContractURI: "https://support.apple.com/metadata/contractURI.json",
        BaseURI: "https://support.apple.com/contractURI/",
      })
      .catch((e) => {
        expect(e.message).to.include("Ownable: caller is not the owner");
      });

    await nft.setCustomConfig({
      Root: root,
      StartSaleTime: 10000,
      ContractURI: "https://support.apple.com/metadata/contractURI.json",
      BaseURI: "https://support.apple.com/contractURI/",
    });

    const customConfig = await nft.customConfig();
    expect(customConfig.Root).to.equal(root);
    expect(customConfig.StartSaleTime).to.equal(10000);
    expect(customConfig.ContractURI).to.equal(
      "https://support.apple.com/metadata/contractURI.json"
    );
    expect(customConfig.BaseURI).to.equal(
      "https://support.apple.com/contractURI/"
    );
    expect(await nft.contractURI()).to.equal(
      "https://support.apple.com/metadata/contractURI.json"
    );
    expect(await nft.tokenURI(0)).to.equal(
      "https://support.apple.com/contractURI/0.json"
    );
  });

  it("mint maximum amount is matched", async () => {
    await nft
      .connect(otherUser)
      .setSaleConfig({
        SupplyMaximum: 5555,
        MaximumMint: 5,
        PublicSale: 2000,
        WhiteSale: 0,
      })
      .catch((e) => {
        expect(e.message).to.include("Ownable: caller is not the owner");
      });

    await nft.setSaleConfig({
      SupplyMaximum: 5555,
      MaximumMint: 5,
      PublicSale: 2000,
      WhiteSale: 0,
    });

    await nft
      .connect(otherUser)
      .adminMint(owner.address, 1000)
      .catch((e) => {
        expect(e.message).to.include("Ownable: caller is not the owner");
      });

    await nft.adminMint(owner.address, 1000);
    await nft.adminMint(owner.address, 1000);
    await nft.adminMint(owner.address, 1000);
    await nft.adminMint(owner.address, 1000);
    await nft.adminMint(owner.address, 1000);
    await nft.adminMint(owner.address, 555);
    await nft.adminMint(owner.address, 1).catch((e) => {
      expect(e.message).to.include("OVERFLOW");
    });
  });
  it("whitelist mint", async () => {
    await nft
      .connect(otherUser)
      .setRoot(root)
      .catch((e) => {
        expect(e.message).to.include("Ownable: caller is not the owner");
      });

    await nft.setRoot(root);
    await nft.setSaleConfig({
      SupplyMaximum: 5555,
      MaximumMint: 5,
      PublicSale: 2000,
      WhiteSale: 100,
    });

    await nft
      .connect(whiteUser1)
      .whiteMint(whiteUser1Proof, 5)
      .catch((e) => {
        expect(e.message).to.include("ERR_NOT_ENOUGH_ETH");
      });

    await nft.whiteMint(whiteUser1Proof, 5, { value: 500 }).catch((e) => {
      expect(e.message).to.include("NOT_WHITELIST");
    });
    await nft.connect(whiteUser1).whiteMint(whiteUser1Proof, 5, { value: 500 });
    await nft.connect(whiteUser2).whiteMint(whiteUser2Proof, 5, { value: 500 });
    await nft
      .connect(whiteUser2)
      .whiteMint(whiteUser2Proof, 1, { value: 100 })
      .catch((e) => {
        expect(e.message).to.include("ERR_MINT_OVERFLOW_MAX");
      });
  });
  it("public sales", async function () {
    await nft.setSaleConfig({
      SupplyMaximum: 5555,
      MaximumMint: 5,
      PublicSale: 2000,
      WhiteSale: 100,
    });
    await nft.publicMint(5).catch((e) => {
      expect(e.message).to.include("ERR_NOT_ENOUGH_ETH");
    });
    await nft.publicMint(6, { value: 12000 }).catch((e) => {
      expect(e.message).to.include("ERR_MINT_OVERFLOW_MAX");
    });
    await nft.publicMint(5, { value: 10000 });
    await nft.publicMint(1, { value: 2000 }).catch((e) => {
      expect(e.message).to.include("ERR_MINT_OVERFLOW_MAX");
    });
  });
});
