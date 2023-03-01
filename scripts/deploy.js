// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const config = {
    name: "TEST NFT",
    symbol: "TN",
    contractURI: "none",
    baseURI: "none",
    startTime: 0,
  };

  const NFT = await hre.ethers.getContractFactory("NFT_ERC721");
  const nft = await NFT.deploy(
    config.name,
    config.symbol,
    // config.contractURI,
    // config.baseURI,
    // config.startTime
  );

  await nft.deployed();

  console.log(nft.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
