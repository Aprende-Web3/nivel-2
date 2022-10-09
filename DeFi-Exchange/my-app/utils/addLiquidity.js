import { Contract, utils } from "ethers";
import {
  EXCHANGE_CONTRACT_ABI,
  EXCHANGE_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../constants";
 
 
/**
* addLiquidity ayuda a agregar liquidez al intercambio,
  * Si el usuario está agregando liquidez inicial, el usuario decide los tokens de ether y AW3D que desea agregar
  * al intercambio. Si está agregando la liquidez después de que ya se haya agregado la liquidez inicial
  * luego calculamos los tokens AW3 Dev que puede agregar, dado el Eth que quiere agregar manteniendo las proporciones
  * constantes
 */
export const addLiquidity = async (
  signer,
  addAW3DAmountWei,
  addEtherAmountWei
) => {
  try {
    // crea una nueva instancia del contrato de token
    const tokenContract = new Contract(
      TOKEN_CONTRACT_ADDRESS,
      TOKEN_CONTRACT_ABI,
      signer
    );
   // crea una nueva instancia del contrato de intercambio
    const exchangeContract = new Contract(
      EXCHANGE_CONTRACT_ADDRESS,
      EXCHANGE_CONTRACT_ABI,
      signer
    );
  // Debido a que los tokens de AW3D son un ERC20, el usuario deberá otorgar la asignación del contrato
     // para sacar el número requerido de tokens de AW3D de su contrato
    let tx = await tokenContract.approve(
      EXCHANGE_CONTRACT_ADDRESS,
      addAW3DAmountWei.toString()
    );
    await tx.wait();
   // Después de que el contrato tenga la aprobación, agregue los tokens ether y aw3d en la liquidez
    tx = await exchangeContract.addLiquidity(addAW3DAmountWei, {
      value: addEtherAmountWei,
    });
    await tx.wait();
  } catch (err) {
    console.error(err);
  }
};
 
 
/**
* calculeAW3D calcula los tokens de AW3D que deben agregarse a la liquidez
  * dada `_addEtherAmountWei` cantidad de ether
 */
export const calculateAW3D = async (
  _addEther = "0",
  etherBalanceContract,
  aw3dTokenReserve
) => {
// `_addEther` es una cadena, necesitamos convertirla en un Bignumber antes de poder hacer nuestros cálculos
   // Lo hacemos usando la función `parseEther` de `ethers.js`
  const _addEtherAmountWei = utils.parseEther(_addEther);
 
// La relación debe mantenerse cuando agregamos liquidez.
   // Necesitamos que el usuario sepa cuántos tokens `AW3D` para una cantidad específica de ether
   // Puede agregar para que el impacto en el precio no sea grande
   // La relación que seguimos es (cantidad de tokens AW3 Dev a agregar) / (saldo de tokens AW3 Dev) = (Eth que se agregaría) / (Reserva Eth en el contrato)
   // Entonces, por matemáticas, obtenemos (cantidad de tokens AW3 Dev que se agregarán) = (Eth que se agregaría * Saldo de tokens AW3 Dev) / (Reserva Eth en el contrato)
 
 
 
  const aw3DevTokenAmount = _addEtherAmountWei
    .mul(aw3dTokenReserve)
    .div(etherBalanceContract);
  return aw3DevTokenAmount;
};
