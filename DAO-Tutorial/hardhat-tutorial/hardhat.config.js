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

/*
FakeNFTMarketplace deployed to:  0x9a3Ceab51702f8bCAa4A741A0897e13C93bc3CE4
AW3DevsDAO deployed to:  0xBf8651761d2bdCE348dD331AA29FeA1413109E62
*/