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

// Exchange Contract Address: 0x3C7626063e99aD527835ddfAa5d8D05803751edA