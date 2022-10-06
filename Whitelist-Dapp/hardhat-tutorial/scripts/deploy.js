const { ethers } = require("hardhat");
 
 
async function main() {
  /*
   Un ContractFactory en ethers.js es una abstracción utilizada para implementar nuevos contratos inteligentes, así que whitelistContract aquí es una fábrica para instancias de nuestro contrato de Whitelist.
 
  */ 
  const whitelistContract = await ethers.getContractFactory("Whitelist");
 
 
  // aquí desplegamos el contrato
  const deployedWhitelistContract = await whitelistContract.deploy(10);
  // 10 es el número máximo de direcciones incluidas en la whitelist permitidas
 
 
  // Espere a que termine de implementarse
  await deployedWhitelistContract.deployed();
 
 
  // Imprimir la dirección del contrato implementado
  console.log("Whitelist Contract Address:", deployedWhitelistContract.address);
}
 
 
// Llamamos a la función main y controlamos si hubiera cualquier error
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });