import { BigNumber, Contract, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import {
  NFT_CONTRACT_ABI,
  NFT_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../constants";
import styles from "../styles/Home.module.css";
 
 
export default function Home() {
  // Crear un BigNumber '0'
  const zero = BigNumber.from(0);
  // walletConnected realiza un seguimiento de si la billetera del usuario está conectada o no
  const [walletConnected, setWalletConnected] = useState(false);
  // loading se establece en true cuando estamos esperando a que se extraiga una transacción
  const [loading, setLoading] = useState(false);
  // tokensToBeClaimed realiza un seguimiento del número de tokens que se pueden reclamar
  // Basado en los NFT de AW3 Dev en poder del usuario para los que no han reclamado los tokens
  const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);
  // balanceOfAW3DevTokens realiza un seguimiento del número de tokens AW3 Dev propiedad de una dirección
  const [balanceOfAW3DevTokens, setBalanceOfAW3DevTokens] =
    useState(zero);
  // cantidad de los tokens que el usuario desea mintear
  const [tokenAmount, setTokenAmount] = useState(zero);
  // tokensMinted es el número total de tokens que se han minteado hasta ahora de 10000 (suministro total máximo)
  const [tokensMinted, setTokensMinted] = useState(zero);
  // isOwner obtiene el propietario del contrato a través de la dirección firmada
  const [isOwner, setIsOwner] = useState(false);
  // Cree una referencia al modal Web3 (utilizado para conectarse a Metamask) que persista mientras la página esté abierta
  const web3ModalRef = useRef();
 
 
  /**
   * getTokensToBeClaimed:  Comprueba el saldo de tokens que puede reclamar el usuario
  */
  const getTokensToBeClaimed = async () => {
    try {
      // Obtenga el provider de web3Modal, que en nuestro caso es MetaMask
      // No hay necesidad del signer aquí, ya que solo estamos leyendo el estado de la cadena de bloques
      const provider = await getProviderOrSigner();
      // Crear una instancia de contrato NFT
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );
      // Crear una instancia de tokenContract
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );
      // Conseguiremos que el signer extraiga la dirección de la cuenta de MetaMask actualmente conectada
      const signer = await getProviderOrSigner(true);
      // Obtener la dirección asociada al signer que está conectado a MetaMask
      const address = await signer.getAddress();
      // llame al balanceOf del contrato NFT para obtener el número de NFT en poder del usuario
      const balance = await nftContract.balanceOf(address);
      // balance es un Big number y por lo tanto, compararíamos con el Big Number 'zero'
      if (balance === zero) {
        setTokensToBeClaimed(zero);
      } else {
        // amount realiza un seguimiento del número de tokens no reclamados
        var amount = 0;
        // Para todos los NFT, verifique si los tokens ya han sido reclamados
        // Solo aumente la cantidad si los tokens no han sido reclamados
        // para un NFT(para un tokenId determinado)
        for (var i = 0; i < balance; i++) {
          const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
          const claimed = await tokenContract.tokenIdsClaimed(tokenId);
          if (!claimed) {
            amount++;
          }
        }
        //tokensToBeClaimed se ha inicializado a un Big Number, por lo que convertiríamos la amount
        // a un big number y, a continuación, establecer su valor
        setTokensToBeClaimed(BigNumber.from(amount));
      }
    } catch (err) {
      console.error(err);
      setTokensToBeClaimed(zero);
    }
  };
 
 
  /**
   * getBalanceOfAW3DevTokens: comprueba el saldo de los tokens de AW3 Dev en poder de una dirección
   */
  const getBalanceOfAW3DevTokens = async () => {
    try {
      // Obtenga el provider de web3Modal, que en nuestro caso es MetaMask
      // No hay necesidad del signer aquí, ya que solo estamos leyendo el estado de la cadena de bloques
      const provider = await getProviderOrSigner();
      // Crear una instancia de contrato de token
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );
      // Conseguiremos que el signer extraiga la dirección de la cuenta de MetaMask actualmente conectada
      const signer = await getProviderOrSigner(true);
      // Obtener la dirección asociada al signer que está conectado a MetaMask
      const address = await signer.getAddress();
      // Llame al balanceOf desde el contrato de token para obtener el número de tokens en poder del usuario
      const balance = await tokenContract.balanceOf(address);
      // balance ya es un big number, por lo que no necesitamos convertirlo antes de configurarlo
      setBalanceOfAW3DevTokens(balance);
    } catch (err) {
      console.error(err);
      setBalanceOfAW3DevTokens(zero);
    }
  };
 
 
  /**
   * mintAW3DevToken: acuña el número de tokens a una dirección determinada
   */
  const mintAW3DevToken = async (amount) => {
    try {
      // Necesitamos un signer aquí ya que esta es una transacción de "escritura".
      // Crear una instancia de tokenContract
      const signer = await getProviderOrSigner(true);
      // Crear una instancia de tokenContract
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );
      // Cada token es de '0.001 ether'. El valor que necesitamos enviar es '0.001 * amount'
      const value = 0.001 * amount;
      const tx = await tokenContract.mint(amount, {
        // value significa el costo de un token de aw3 que es "0.001" eth.
        // Estamos pasando la cadena '0.001' a ether usando la biblioteca utils de ethers.js
        value: utils.parseEther(value.toString()),
      });
      setLoading(true);
      // Espere a que se extraiga la transacción
      await tx.wait();
      setLoading(false);
      window.alert("Tokens AW3 Dev minteados con éxito");
      await getBalanceOfAW3DevTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
    } catch (err) {
      console.error(err);
    }
  };
 
 
  /**
   * claimAW3DevTokens: Ayuda al usuario a reclamar tokens AW3 Dev
   */
  const claimAW3DevTokens = async () => {
    try {
      // Necesitamos un signer aquí ya que esta es una transacción de "escritura".
      // Crear una instancia de tokenContract
      const signer = await getProviderOrSigner(true);
      // Crear una instancia de tokenContract
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );
      const tx = await tokenContract.claim();
      setLoading(true);
      // Espere a que se extraiga la transacción
      await tx.wait();
      setLoading(false);
      window.alert("Tokens de AW3 Dev reclamados con éxito");
      await getBalanceOfAW3DevTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
    } catch (err) {
      console.error(err);
    }
  };
 
 
  /**
   * getTotalTokensMinted: Recupera cuántos tokens se han acuñado hasta ahora
   * fuera de la oferta total
   */
  const getTotalTokensMinted = async () => {
    try {
      // Obtenga el provider de web3Modal, que en nuestro caso es MetaMask
      // No hay necesidad del signer aquí, ya que solo estamos leyendo el estado de la cadena de bloques
      const provider = await getProviderOrSigner();
      // Crear una instancia de contrato de token
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );
      // Obtén todos los tokens que se han acuñado
      const _tokensMinted = await tokenContract.totalSupply();
      setTokensMinted(_tokensMinted);
    } catch (err) {
      console.error(err);
    }
  };
 
 
  /**
   * getOwner: obtiene el propietario del contrato por dirección conectada
   */
  const getOwner = async () => {
    try {
      const provider = await getProviderOrSigner();
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );
      // Llamar a la función Owner desde el contrato
      const _owner = await tokenContract.owner();
      // conseguimos que el signer extraiga la dirección de la cuenta de Metamask actualmente conectada
      const signer = await getProviderOrSigner(true);
      // Obtener la dirección asociada al signer que está conectado a Metamask
      const address = await signer.getAddress();
      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.error(err.message);
    }
  };
 
 
  /**
   * withdrawCoins: retira ether y tokens llamando
   * la función withdraw en el contrato
   */
  const withdrawCoins = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );
 
 
      const tx = await tokenContract.withdraw();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      await getOwner();
    } catch (err) {
      console.error(err);
    }
  };
 
 
  /**
   * Devuelve un objeto Provider o Signer que representa el RPC de Ethereum con o sin las 
   * capacidades de firma de metamask adjunta
   *
   * Se necesita un "provider" para interactuar con la cadena de bloques: lectura de transacciones, lectura de saldos, estado de lectura, etc.
   *
   * Un 'signer' es un tipo especial de provider utilizado en caso de que se deba realizar una transacción de 'escritura' a la cadena de bloques, que involucra la cuenta conectada.
   * necesidad de realizar una firma digital para autorizar la transacción que se está enviando. Metamask expone una API de signer para permitir que su sitio web
   * solicite firmas del usuario utilizando las funciones de signer.
   *
   * @param {*} needSigner - True Si necesita el signer, de lo contrario, false predeterminado
   */
  const getProviderOrSigner = async (needSigner = false) => {
    // Conectarse a Metamask
    // Dado que almacenamos 'web3Modal' como referencia, necesitamos acceder al valor 'current' para obtener acceso al objeto subyacente
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);
 
 
    // Si el usuario no está conectado a la red Goerli, hágaselo saber y arroje un error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Cambiar la red a Goerli");
      throw new Error("Cambiar la red a Goerli");
    }
 
 
    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };
 
 
  /*
        connectWallet: Conecta el monedero MetaMask
      */
  const connectWallet = async () => {
    try {
      // Obtenga el provider de web3Modal, que en nuestro caso es MetaMask
      // Cuando se usa por primera vez, solicita al usuario que conecte su billetera
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };
 
 
  // useEffects se utilizan para reaccionar a los cambios en el estado del sitio web
  // El array al final de la llamada a la función representa qué cambios de estado desencadenarán este efecto
  // En este caso, siempre que cambie el valor de 'walletConnected', este efecto se denominará
  useEffect(() => {
    // Si la cartera no está conectada, cree una nueva instancia de Web3Modal y conecte la cartera MetaMask
    if (!walletConnected) {
      // Asigne la clase Web3Modal al objeto de referencia estableciendo su valor 'current'
      // El valor 'current' se conserva durante todo el tiempo que esta página esté abierta
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
      getTotalTokensMinted();
      getBalanceOfAW3DevTokens();
      getTokensToBeClaimed();
      withdrawCoins();
    }
  }, [walletConnected]);
 
 
  /*
        renderButton: Devuelve un botón basado en el estado de la dapp.
      */
  const renderButton = () => {
    // Si actualmente estamos esperando algo, devolvemos un botón de carga
    if (loading) {
      return (
        <div>
          <button className={styles.button}>Cargando...</button>
        </div>
      );
    }
    // Si el propietario está conectado, se llama withdrawCoins()
    if (walletConnected && isOwner) {
      return (
        <div>
          <button className={styles.button1} onClick={withdrawCoins}>
            Retirar monedas
          </button>
        </div>
      );
    }
    // Si los tokens que se van a reclamar son mayores que 0, devuelva un botón de notificación
    if (tokensToBeClaimed > 0) {
      return (
        <div>
          <div className={styles.description}>
            {tokensToBeClaimed * 10} ¡Los tokens se pueden reclamar!
          </div>
          <button className={styles.button} onClick={claimAW3DevTokens}>
           Tokens de reclamación
          </button>
        </div>
      );
    }
    // Si el usuario no tiene ningún token para reclamar, muestre el botón de minteo
    return (
      <div style={{ display: "flex-col" }}>
        <div>
          <input
            type="number"
            placeholder="Cantidad de tokens"
            // BigNumber.from convierte el `e.target.value` a un BigNumber
            onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}
            className={styles.input}
          />
        </div>
 
 
        <button
          className={styles.button}
          disabled={!(tokenAmount > 0)}
          onClick={() => mintAW3DevToken(tokenAmount)}
        >
          Mintear Tokens
        </button>
      </div>
    );
  };
 
 
  return (
    <div>
      <Head>
        <title>AW3 Devs</title>
        <meta name="description" content="ICO-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Bienvenido a AW3 Devs ICO!</h1>
          <div className={styles.description}>
           Puede reclamar o acuñar tokens AW3 Dev aquí
          </div>
          {walletConnected ? (
            <div>
              <div className={styles.description}>
                {/* Format Ether nos ayuda a convertir un BigNumber en cadena */}
                Has minteado {utils.formatEther(balanceOfAW3DevTokens)} AW3
                Dev Tokens
              </div>
              <div className={styles.description}>
                {/* Format Ether nos ayuda a convertir un BigNumber en cadena */}
                {utils.formatEther(tokensMinted)}/10000 han sido minteados!!!
              </div>
              {renderButton()}
            </div>
          ) : (
            <button onClick={connectWallet} className={styles.button}>
            Conecta tu monedero
            </button>
          )}
        </div>
        <div>
          <img className={styles.image} src="./0.svg" />
        </div>
      </div>
 
 
      <footer className={styles.footer}>
        Made with &#10084; by AW3 Devs
      </footer>
    </div>
  );
}