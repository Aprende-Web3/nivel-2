const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });
const { AW3_DEVS_NFT_CONTRACT_ADDRESS } = require("../constants");
 
 
async function main() {
  // Dirección del contrato NFT de AW3 Devs que implementó en el módulo anterior
  const aw3DevsNFTContract = AW3_DEVS_NFT_CONTRACT_ADDRESS;
 
 
  /*
Un ContractFactory en ethers.js es una abstracción utilizada para implementar nuevos contratos inteligentes, por lo que aw3DevsTokenContract aquí es una fábrica para instancias de nuestro contrato AW3DevToken.
   
    */
  const aw3DevsTokenContract = await ethers.getContractFactory(
    "AW3DevToken"
  );
 
 
  // implementar el contrato
  const deployedAW3DevsTokenContract = await aw3DevsTokenContract.deploy(
    aw3DevsNFTContract
  );
 
 
  await deployedAW3DevsTokenContract.deployed();
  // Imprimir la dirección del contrato implementado
  console.log(
    "AW3 Devs Token Contract Address:",
    deployedAW3DevsTokenContract.address
  );
}
 
 
// Llame a la función principal y detecte si hay algún error
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });