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

// AW3 Devs Token Contract Address: 0x2A13d800BA950A11efD76952B744Db635757574f