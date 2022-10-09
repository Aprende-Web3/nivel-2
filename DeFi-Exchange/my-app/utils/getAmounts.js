import { Contract } from "ethers";
import {
  EXCHANGE_CONTRACT_ABI,
  EXCHANGE_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../constants";
 
 
/**
* getEtherBalance: Recupera el saldo ether del usuario o del contrato
 */
export const getEtherBalance = async (provider, address, contract = false) => {
  try {
 // Si la persona que llama ha establecido el booleano `contract` en verdadero, recuperar el saldo de
     // ether en el `exchange contract`, si se establece en falso, recuperar el saldo
     // de la dirección del usuario
    if (contract) {
      const balance = await provider.getBalance(EXCHANGE_CONTRACT_ADDRESS);
      return balance;
    } else {
      const balance = await provider.getBalance(address);
      return balance;
    }
  } catch (err) {
    console.error(err);
    return 0;
  }
};
 
 
/**
* getAW3DTokensBalance: recupera los tokens AW3 Dev en la cuenta
  * de la `dirección` proporcionada
 */
export const getAW3DTokensBalance = async (provider, address) => {
  try {
    const tokenContract = new Contract(
      TOKEN_CONTRACT_ADDRESS,
      TOKEN_CONTRACT_ABI,
      provider
    );
    const balanceOfAW3DevTokens = await tokenContract.balanceOf(address);
    return balanceOfAW3DevTokens;
  } catch (err) {
    console.error(err);
  }
};
 
 
/**
* getLPTokensBalance: Recupera la cantidad de tokens LP en la cuenta
  * de la `dirección` proporcionada
 */
export const getLPTokensBalance = async (provider, address) => {
  try {
    const exchangeContract = new Contract(
      EXCHANGE_CONTRACT_ADDRESS,
      EXCHANGE_CONTRACT_ABI,
      provider
    );
    const balanceOfLPTokens = await exchangeContract.balanceOf(address);
    return balanceOfLPTokens;
  } catch (err) {
    console.error(err);
  }
};
 
 
/**
 * getReserveOfAW3DTokens: Recupera la cantidad de tokens de AW3D en la
  * dirección de contrato de intercambio
 */
export const getReserveOfAW3DTokens = async (provider) => {
  try {
    const exchangeContract = new Contract(
      EXCHANGE_CONTRACT_ADDRESS,
      EXCHANGE_CONTRACT_ABI,
      provider
    );
    const reserve = await exchangeContract.getReserve();
    return reserve;
  } catch (err) {
    console.error(err);
  }
};