const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });
const { WHITELIST_CONTRACT_ADDRESS, METADATA_URL } = require("../constants");
 
 
async function main() {
  // Dirección del contrato de la Whitelist que implementó en el módulo anterior
  const whitelistContract = WHITELIST_CONTRACT_ADDRESS;
  // URL desde donde podemos extraer los metadatos para un AW3 Dev NFT
  const metadataURL = METADATA_URL;
  /*
Un ContractFactory en ethers.js es una abstracción utilizada para implementar nuevos contratos inteligentes, así que aw3DevsContract aquí es una fábrica para instancias de nuestro contrato de AW3Devs.
  */
  const aw3DevsContract = await ethers.getContractFactory("AW3Devs");
 
 
  // aquí desplegamos el contrato
  const deployedAW3DevsContract = await aw3DevsContract.deploy(
    metadataURL,
    whitelistContract
  );
 
 
  // Imprimir la dirección del contrato implementado
  console.log(
    "AW3 Devs Contract Address:",
    deployedAW3DevsContract.address
  );
}
 
 
// Llamamos a la función main y controlamos si hubiera cualquier error
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
});
