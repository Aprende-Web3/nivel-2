require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: ".env" });
 
 
const QUICKNODE_HTTP_URL = process.env.QUICKNODE_HTTP_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
 
 
module.exports = {
  solidity: "0.8.9",
  networks: {
    goerli: {
      url: QUICKNODE_HTTP_URL,
      accounts: [PRIVATE_KEY],
    },
  },
};

// FakeNFTMarketplace deployed to:  0xD6f22c039dC615a0A7541ACB8131CcCA63dfb19E
// AW3DevsDAO deployed to:  0xDf9f6e31F111f7073B76C88b788aD6A26Be03dDA