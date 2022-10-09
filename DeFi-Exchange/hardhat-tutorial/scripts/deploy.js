const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });
const { AW3_DEV_TOKEN_CONTRACT_ADDRESS } = require("../constants");


async function main() {
  const aw3DevTokenAddress = AW3_DEV_TOKEN_CONTRACT_ADDRESS;
  /*
 Una ContractFactory en ethers.js es una abstracción utilizada para implementar nuevos contratos inteligentes,
   entonces exchangeContract aquí es una fábrica de instancias de nuestro contrato de intercambio.
  */
  const exchangeContract = await ethers.getContractFactory("Exchange");


// aquí desplegamos el contrato
  const deployedExchangeContract = await exchangeContract.deploy(
    aw3DevTokenAddress
  );
  await deployedExchangeContract.deployed();


  // imprime la dirección del contrato desplegado
  console.log("Exchange Contract Address:", deployedExchangeContract.address);
}


// Llamar a la función principal y detectar si hay algún error
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });