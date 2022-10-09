import { Contract, providers, utils, BigNumber } from "ethers";
import {
  EXCHANGE_CONTRACT_ABI,
  EXCHANGE_CONTRACT_ADDRESS,
} from "../constants";
 
 
/**
 * removeLiquidity: elimina la cantidad `removeLPTokensWei` de tokens LP de
  * liquidez y también la cantidad calculada de tokens `ether` y `AW3D`
 */
export const removeLiquidity = async (signer, removeLPTokensWei) => {
  // Crear una nueva instancia del contrato de intercambio
  const exchangeContract = new Contract(
    EXCHANGE_CONTRACT_ADDRESS,
    EXCHANGE_CONTRACT_ABI,
    signer
  );
  const tx = await exchangeContract.removeLiquidity(removeLPTokensWei);
  await tx.wait();
};
 
 
/**
* getTokensAfterRemove: Calcula la cantidad de tokens `Eth` y `AW3D`
  * que se devolvería al usuario después de que elimine la cantidad `removeLPTokenWei`
  * de tokens LP del contrato
 */
export const getTokensAfterRemove = async (
  provider,
  removeLPTokenWei,
  _ethBalance,
  aw3DevTokenReserve
) => {
  try {
   // Crear una nueva instancia del contrato de intercambio
    const exchangeContract = new Contract(
      EXCHANGE_CONTRACT_ADDRESS,
      EXCHANGE_CONTRACT_ABI,
      provider
    );
  // Obtenga el suministro total de tokens LP `AW3 Dev`
    const _totalSupply = await exchangeContract.totalSupply();
 // Aquí estamos usando los métodos BigNumber de multiplicación y división
     // La cantidad de Eth que se devolvería al usuario después de retirar el token LP
     // se calcula en base a una relación,
     // La proporción es -> (cantidad de Eth que se devolvería al usuario / reserva de Eth) = (tokens LP retirados) / (suministro total de tokens LP)
     // Por algunas matemáticas obtenemos -> (cantidad de Eth que se devolvería al usuario) = (Reserva Eth * tokens LP retirados) / (suministro total de tokens LP)
     // Del mismo modo, también mantenemos una relación para los tokens `AW3D`, así que aquí en nuestro caso
     // La proporción es -> (cantidad de tokens de AW3D devueltos al usuario / reserva de tokens de AW3D) = (tokens de LP retirados) / (suministro total de tokens de LP)
     // Luego (cantidad de tokens de AW3D devueltos al usuario) = (reserva de tokens de AW3D * tokens LP retirados) / (suministro total de tokens LP)
    const _removeEther = _ethBalance.mul(removeLPTokenWei).div(_totalSupply);
    const _removeAW3D = aw3DevTokenReserve
      .mul(removeLPTokenWei)
      .div(_totalSupply);
    return {
      _removeEther,
      _removeAW3D,
    };
  } catch (err) {
    console.error(err);
  }
};