import { Contract } from "ethers";
import {
  EXCHANGE_CONTRACT_ABI,
  EXCHANGE_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../constants";
 
 
/*
 getAmountOfTokensReceivedFromSwap: devuelve la cantidad de tokens Eth/AW3 Dev que se pueden recibir
     cuando el usuario intercambia la cantidad `_swapAmountWei` de tokens Eth/AW3 Dev.
*/
export const getAmountOfTokensReceivedFromSwap = async (
  _swapAmountWei,
  provider,
  ethSelected,
  ethBalance,
  reservedAW3D
) => {
// Crear una nueva instancia del contrato de intercambio
  const exchangeContract = new Contract(
    EXCHANGE_CONTRACT_ADDRESS,
    EXCHANGE_CONTRACT_ABI,
    provider
  );
  let amountOfTokens;
 // Si se selecciona `Eth`, esto significa que nuestro valor de entrada es `Eth`, lo que significa que nuestra cantidad de entrada sería
   // `_swapAmountWei`, la reserva de entrada sería el `ethBalance` del contrato y la reserva de salida
   // sería la reserva del token `AW3 Dev`
  if (ethSelected) {
    amountOfTokens = await exchangeContract.getAmountOfTokens(
      _swapAmountWei,
      ethBalance,
      reservedAW3D
    );
  } else {
   // Si no se selecciona `Eth`, esto significa que nuestro valor de entrada son tokens `AW3 Dev`, lo que significa que nuestra cantidad de entrada sería
     // `_swapAmountWei`, la reserva de entrada sería la reserva del token `AW3 Dev` del contrato y la reserva de salida
     // sería el `ethBalance`
    amountOfTokens = await exchangeContract.getAmountOfTokens(
      _swapAmountWei,
      reservedAW3D,
      ethBalance
    );
  }
 
 
  return amountOfTokens;
};
 
 
/*
swapTokens: Intercambia `swapAmountWei` de tokens Eth/AW3 Dev con `tokenToBeReceivedAfterSwap` cantidad de tokens Eth/AW3 Dev.
*/
export const swapTokens = async (
  signer,
  swapAmountWei,
  tokenToBeReceivedAfterSwap,
  ethSelected
) => {
// Crear una nueva instancia del contrato de intercambio
  const exchangeContract = new Contract(
    EXCHANGE_CONTRACT_ADDRESS,
    EXCHANGE_CONTRACT_ABI,
    signer
  );
  const tokenContract = new Contract(
    TOKEN_CONTRACT_ADDRESS,
    TOKEN_CONTRACT_ABI,
    signer
  );
  let tx;
 // Si se selecciona Eth, llame a la función `ethToAW3DevToken` de lo contrario
   // llamar a la función `aw3DevTokenToEth` desde el contrato
   // Como puede ver, necesita pasar `swapAmount` como un valor a la función porque
   // es el ether que estamos pagando al contrato, en lugar de un valor que estamos pasando a la función
  if (ethSelected) {
    tx = await exchangeContract.ethToAW3DevToken(
      tokenToBeReceivedAfterSwap,
      {
        value: swapAmountWei,
      }
    );
  } else {
   // El usuario tiene que aprobar `swapAmountWei` para el contrato porque el token `AW3 Dev`
     // es un ERC20
    tx = await tokenContract.approve(
      EXCHANGE_CONTRACT_ADDRESS,
      swapAmountWei.toString()
    );
    await tx.wait();
// llamar a la función aw3DevTokenToEth que tomaría `swapAmountWei` de tokens `AW3 Dev` y
     // devuelve `tokenToBeReceivedAfterSwap` cantidad de `Eth` al usuario
    tx = await exchangeContract.aw3DevTokenToEth(
      swapAmountWei,
      tokenToBeReceivedAfterSwap
    );
  }
  await tx.wait();
};
