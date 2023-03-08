// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers } = require("hardhat");
const hre = require("hardhat");

const toWei = (value) => value.toString() + "1000000000000000000";

async function main() {
  const Signers = await ethers.getSigners();
  const NFT = await hre.ethers.getContractFactory("PandaNFT");
  const nft = await NFT.deploy("Test_NFT", "TN");
  await nft.deployed();

  const Token = await hre.ethers.getContractFactory("PandaToken");
  const token = await Token.deploy();
  await token.deployed();

  await token.mint(Signers[0].address, toWei(1000000000));
  await token.transfer(nft.address, toWei(2023 * 500));
  await nft.setTokenInfo({
    PandaToken: token.address,
    PreReward: toWei(500),
  });

  console.log(token.address);
  console.log(nft.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
