import Head from "next/head";
import styles from "../styles/Home.module.css";
import Web3Modal from "web3modal";
import { providers, Contract } from "ethers";
import { useEffect, useRef, useState } from "react";
import { WHITELIST_CONTRACT_ADDRESS, abi } from "../constants";
 
 
export default function Home() {
  // walletConnected realizar un seguimiento de si la billetera del usuario está conectada o no
  const [walletConnected, setWalletConnected] = useState(false);
  // joinedWhitelist realiza un seguimiento de si la dirección de metamask actual se ha unido a la whitelist o no
  const [joinedWhitelist, setJoinedWhitelist] = useState(false);
  // loading se establece en true cuando estamos esperando a que se extraiga una transacción
  const [loading, setLoading] = useState(false);
  // numberOfWhitelisted realiza un seguimiento del número de direcciones que están en la Whitelist
  const [numberOfWhitelisted, setNumberOfWhitelisted] = useState(0);
  // Crea una referencia al modal Web3 (utilizado para conectarse a Metamask) que persista mientras la página esté abierta
  const web3ModalRef = useRef();
 
 
  /**
   * Devuelve un objeto Provider o Signer representando el RPC de Ethereum con o sin el  
   * capacidades de firma de metamask adjunta
   * 
   * Se necesita un "Provider" para interactuar con la cadena de bloques: lectura de transacciones, lectura de saldos, estado de lectura, etc.
   * 
   * Un "Signer" es un tipo especial de provider utilizado en caso de que se deba realizar una transacción de 'escritura' a la cadena de bloques, que involucra la cuenta conectada.
   * necesidad de realizar una firma digital para autorizar la transacción que se está enviando. Metamask expone una API de signer para permitir que su sitio web solicite firmas del usuario mediante las funciones de signer.
   *
   * @param {*} needSigner - True si necesita el signer, valor predeterminado false de lo contrario
   */
  const getProviderOrSigner = async (needSigner = false) => {
    // Conectarse a Metamask
    // Dado que almacenamos 'web3Modal' como referencia, necesitamos acceder al valor 'current' para obtener acceso al objeto subyacente
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);
 
 
    // Si el usuario no está conectado a la red Goerli, hágaselo saber y arroje un error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Cambie la red a Goerli");
      throw new Error("Cambie la red a Goerli");
    }
 
 
    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };
 
 
  /**
   * addAddressToWhitelist: Agrega la dirección conectada actual a la whitelist
   */
  const addAddressToWhitelist = async () => {
    try {
      // Necesitamos un signer aquí ya que esta es una transacción de "escritura".
      const signer = await getProviderOrSigner(true);
      // Creamos una nueva instancia del Contrato con un signer, que permite
      // métodos de actualización
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        signer
      );
      // Llame a AddAddressToWhitelist desde el contrato
      const tx = await whitelistContract.addAddressToWhitelist();
      setLoading(true);
      // Espere a que se extraiga la transacción
      await tx.wait();
      setLoading(false);
      // Obtener el número actualizado de direcciones en la whitelist
      await getNumberOfWhitelisted();
      setJoinedWhitelist(true);
    } catch (err) {
      console.error(err);
    }
  };
 
 
  /**
   * getNumberOfWhitelisted: obtiene el número de direcciones incluidas en la whitelist
   */
  const getNumberOfWhitelisted = async () => {
    try {
      // Obtenga el provider de web3Modal, que en nuestro caso es MetaMask
      // No hay necesidad del signer aquí, ya que solo estamos leyendo el estado de la cadena de bloques
      const provider = await getProviderOrSigner();
      // Nos conectamos al Contrato utilizando un provider, por lo que solo
      // tiene acceso de solo lectura al Contrato
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        provider
      );
      // Llame a numAddressesWhitelisted desde el contrato
      const _numberOfWhitelisted =
        await whitelistContract.numAddressesWhitelisted();
      setNumberOfWhitelisted(_numberOfWhitelisted);
    } catch (err) {
      console.error(err);
    }
  };
 
 
  /**
   * checkIfAddressInWhitelist: Comprueba si la dirección está en la whitelist
   */
  const checkIfAddressInWhitelist = async () => {
    try {
      // Necesitaremos al signer más adelante para obtener la dirección del usuario
      // A pesar de que es una transacción de lectura, ya que los signers son solo tipos especiales de providers,
      // Podemos usarlo en su lugar
      const signer = await getProviderOrSigner(true);
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        signer
      );
      // Obtener la dirección asociada al signer que está conectado a MetaMask
      const address = await signer.getAddress();
      // llamar a la lista whitelistedAddresses del contrato
      const _joinedWhitelist = await whitelistContract.whitelistedAddresses(
        address
      );
      setJoinedWhitelist(_joinedWhitelist);
    } catch (err) {
      console.error(err);
    }
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
 
 
      checkIfAddressInWhitelist();
      getNumberOfWhitelisted();
    } catch (err) {
      console.error(err);
    }
  };
 
 
  /*
    renderButton: Devuelve un botón basado en el estado de la dapp.
  */
  const renderButton = () => {
    if (walletConnected) {
      if (joinedWhitelist) {
        return (
          <div className={styles.description}>
           Gracias por unirse a la Whitelist!
          </div>
        );
      } else if (loading) {
        return <button className={styles.button}>Cargando...</button>;
      } else {
        return (
          <button onClick={addAddressToWhitelist} className={styles.button}>
          Únase a la Whitelist
          </button>
        );
      }
    } else {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Conecta tu wallet
        </button>
      );
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
    }
  }, [walletConnected]);
 
 
  return (
    <div>
      <Head>
        <title>Whitelist Dapp</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Bienvenido a AW3 Devs!</h1>
          <div className={styles.description}>
          Es una colección NFT para desarrolladores en crypto.
          </div>
          <div className={styles.description}>
            {numberOfWhitelisted} ya se han unido a la Whitelist
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./aw3-devs.png" />
        </div>
      </div>
 
 
      <footer className={styles.footer}>
        Hecho con &#10084; por AW3 Devs
      </footer>
    </div>
  );
}