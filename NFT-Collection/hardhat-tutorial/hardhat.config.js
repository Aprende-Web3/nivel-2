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

// AW3 Devs Contract Address: 0xcC7775Bb10AC234DFC7b0fCfE801F536186ac4aE