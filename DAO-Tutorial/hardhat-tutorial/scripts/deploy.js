const { ethers } = require("hardhat");
const { AW3DEVS_NFT_CONTRACT_ADDRESS } = require("../constants");
 
 
async function main() {
  // Implemente primero el contrato fakeNFTMarketplace
  const FakeNFTMarketplace = await ethers.getContractFactory(
    "FakeNFTMarketplace"
  );
  const fakeNftMarketplace = await FakeNFTMarketplace.deploy();
  await fakeNftMarketplace.deployed();
 
 
  console.log("FakeNFTMarketplace deployed to: ", fakeNftMarketplace.address);
 
 
  // Ahora implemente el contrato AW3DevsDAO
  const AW3DevsDAO = await ethers.getContractFactory("AW3DevsDAO");
  const aw3DevsDAO = await AW3DevsDAO.deploy(
    fakeNftMarketplace.address,
    AW3DEVS_NFT_CONTRACT_ADDRESS,
    {
      // Esto supone que su cuenta tiene al menos 0.1 ETH 
      // Cambie este valor como desee
      value: ethers.utils.parseEther("0.1"),
    }
  );
  await aw3DevsDAO.deployed();
 
 
  console.log("AW3DevsDAO deployed to: ", aw3DevsDAO.address);
}
 
 
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });