const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const calGasUsed = require("./utils/calGasUsed.js");

const { BigNumber } = require("ethers");

describe("NFT_ERC721", async function () {
  let owner;
  let otherUser;
  let whiteUser1;
  let whiteUser2;
  let nft;

  beforeEach(async () => {
    const Signers = await ethers.getSigners();
    owner = Signers[0];
    otherUser = Signers[1];
    whiteUser1 = Signers[2];
    whiteUser2 = Signers[2];

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
        Root: "0x05416460deb76d57af601be17e777b93592d8d4d4a4096c57876a91c84f4a712",
        StartSaleTime: 10000,
        ContractURI: "https://support.apple.com/metadata/contractURI.json",
        BaseURI: "https://support.apple.com/contractURI/",
      })
      .catch((e) => {
        expect(e.message).to.include("Ownable: caller is not the owner");
      });

    await nft.setCustomConfig({
      Root: "0x05416460deb76d57af601be17e777b93592d8d4d4a4096c57876a91c84f4a712",
      StartSaleTime: 10000,
      ContractURI: "https://support.apple.com/metadata/contractURI.json",
      BaseURI: "https://support.apple.com/contractURI/",
    });

    const customConfig = await nft.customConfig();
    expect(customConfig.Root).to.equal(
      "0x05416460deb76d57af601be17e777b93592d8d4d4a4096c57876a91c84f4a712"
    );
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
});
