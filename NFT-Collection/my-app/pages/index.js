import { Contract, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { abi, NFT_CONTRACT_ADDRESS } from "../constants";
import styles from "../styles/Home.module.css";
 
 
export default function Home() {
  // walletConnected realiza un seguimiento de si la billetera del usuario está conectada o no
  const [walletConnected, setWalletConnected] = useState(false);
  // presaleStarted realiza un seguimiento de si la preventa ha comenzado o no
  const [presaleStarted, setPresaleStarted] = useState(false);
  // presaleEnded realiza un seguimiento de si la preventa finalizó
  const [presaleEnded, setPresaleEnded] = useState(false);
  // loading se establece en true cuando estamos esperando a que se extraiga una transacción
  const [loading, setLoading] = useState(false);
  // comprueba si el monedero MetaMask conectado actualmente es el propietario del contrato
  const [isOwner, setIsOwner] = useState(false);
  // tokenIdsMinted realiza un seguimiento del número de tokenIds que se han minteado
  const [tokenIdsMinted, setTokenIdsMinted] = useState("0");
  // Cree una referencia al modal Web3 (utilizado para conectarse a Metamask) que persista mientras la página esté abierta
  const web3ModalRef = useRef();
 
 
  /**
   * presaleMint: Mintea un NFT durante la preventa
   */
  const presaleMint = async () => {
    try {
      // Necesitamos un Signer aquí ya que esta es una transacción de "escritura".
      const signer = await getProviderOrSigner(true);
      // Crea una nueva instancia del Contrato con un signer, que permite
      // métodos de actualización
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      // Llame a la presaleMint del contrato, solo las direcciones de la Whitelist podrían mintear
      const tx = await nftContract.presaleMint({
        // value significa el costo de un aw3 dev que es "0.01" eth.
        // Estamos pasando la cadena '0.01' a ether usando la biblioteca utils de ethers.js
        value: utils.parseEther("0.01"),
      });
      setLoading(true);
      // Espere a que se extraiga la transacción
      await tx.wait();
      setLoading(false);
      window.alert("Tu minteaste un AW3 Dev con éxito!");
    } catch (err) {
      console.error(err);
    }
  };
 
 
  /**
   * publicMint: Mintea un NFT después de la preventa
   */
  const publicMint = async () => {
    try {
      // Necesitamos un Signer aquí ya que esta es una transacción de "escritura".
      const signer = await getProviderOrSigner(true);
      // Crea una nueva instancia del Contrato con un signer, que permite
      // métodos de actualización
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      // llame a mint desde el contrato para mintear el AW3 Dev
      const tx = await nftContract.mint({
        // value significa el costo de un aw3 dev que es "0.01" eth.
        // Estamos pasando la cadena '0.01' a ether usando la biblioteca utils de ethers.js
        value: utils.parseEther("0.01"),
      });
      setLoading(true);
      // Espere a que se extraiga la transacción
      await tx.wait();
      setLoading(false);
      window.alert("Tu minteaste un AW3 Dev con éxito!");
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
    } catch (err) {
      console.error(err);
    }
  };
 
 
  /**
   * startPresale: inicia la preventa de la colección NFT
   */
  const startPresale = async () => {
    try {
      // Necesitamos un Signer aquí ya que esta es una transacción de "escritura".
      const signer = await getProviderOrSigner(true);
      // Crea una nueva instancia del Contrato con un signer, que permite
      // métodos de actualización
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      // llama a startPresale desde el contrato
      const tx = await nftContract.startPresale();
      setLoading(true);
      // Espere a que se extraiga la transacción
      await tx.wait();
      setLoading(false);
      // Establezca que la preventa comenzó en True
      await checkIfPresaleStarted();
    } catch (err) {
      console.error(err);
    }
  };
 
 
  /**
   * checkIfPresaleStarted: comprueba si la preventa se ha iniciado llamando a la opción 'presaleStarted'
   * variable en el contrato
   */
  const checkIfPresaleStarted = async () => {
    try {
      // Obtenga el provider de web3Modal, que en nuestro caso es MetaMask
      // No hay necesidad del signer aquí, ya que solo estamos leyendo el estado de la cadena de bloques
      const provider = await getProviderOrSigner();
      // Nos conectamos al Contrato utilizando un provider , por lo que solo
      // tenemos acceso de solo lectura al Contrato
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // llama a presaleStarted desde el contrato
      const _presaleStarted = await nftContract.presaleStarted();
      if (!_presaleStarted) {
        await getOwner();
      }
      setPresaleStarted(_presaleStarted);
      return _presaleStarted;
    } catch (err) {
      console.error(err);
      return false;
    }
  };
 
 
  /**
   * checkIfPresaleEnded: comprueba si la preventa ha finalizado llamando a la 'presaleStarted'
   * variable en el contrato
   */
  const checkIfPresaleEnded = async () => {
    try {
      // Obtenga el provider de web3Modal, que en nuestro caso es MetaMask
      // No hay necesidad del signer aquí, ya que solo estamos leyendo el estado de la cadena de bloques
      const provider = await getProviderOrSigner();
      // Nos conectamos al Contrato utilizando un provider , por lo que solo
      // tenemos acceso de solo lectura al Contrato
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // llama a presaleEnded desde el contrato
      const _presaleEnded = await nftContract.presaleEnded();
      // _presaleEnded es un Big Number, por lo que estamos usando la función lt (menos que) en lugar de '<'
      // Date.now()/1000 devuelve la hora actual en segundos
      // Comparamos si la marca de tiempo _presaleEnded es menor que la hora actual
      // lo que significa que la preventa ha finalizado
      const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000));
      if (hasEnded) {
        setPresaleEnded(true);
      } else {
        setPresaleEnded(false);
      }
      return hasEnded;
    } catch (err) {
      console.error(err);
      return false;
    }
  };
 
 
  /**
   * getOwner: Llama al contrato para recuperar el propietario
   */
  const getOwner = async () => {
    try {
      // Obtenga el provider de web3Modal, que en nuestro caso es MetaMask
      // No hay necesidad del signer aquí, ya que solo estamos leyendo el estado de la cadena de bloques
      const provider = await getProviderOrSigner();
      // Nos conectamos al Contrato utilizando un provider , por lo que solo
      // tenemos acceso de solo lectura al Contrato
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // llama a la función owner desde el contrato
      const _owner = await nftContract.owner();
      // Conseguiremos que el signer extraiga la dirección de la cuenta de MetaMask actualmente conectada
      const signer = await getProviderOrSigner(true);
      // Obtener la dirección asociada al signer que está conectado a MetaMask
      const address = await signer.getAddress();
      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.error(err.message);
    }
  };
 
 
  /**
   * getTokenIdsMinted: obtiene el número de tokenIds que se han minteado
   */
  const getTokenIdsMinted = async () => {
    try {
      // Obtenga el provider de web3Modal, que en nuestro caso es MetaMask
      // No hay necesidad del signer aquí, ya que solo estamos leyendo el estado de la cadena de bloques
      const provider = await getProviderOrSigner();
      // Nos conectamos al Contrato utilizando un provider , por lo que solo
      // tenemos acceso de solo lectura al Contrato
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // llama a los tokenIds desde el contrato
      const _tokenIds = await nftContract.tokenIds();
      //_tokenIds es un `Big Number`. Necesitamos convertir el Big Number en una cadena
      setTokenIdsMinted(_tokenIds.toString());
    } catch (err) {
      console.error(err);
    }
  };
 
 
  /**
   * Devuelve un objeto Provider o Signer que representa el RPC de Ethereum con o sin las
   * capacidades de firma de metamask adjunta 
   *
   * Se necesita un "provider" para interactuar con la cadena de bloques: transacciones de lectura, saldos de lectura, estado de lectura, etc. 
   *
   * Un 'signer' es un tipo especial de provider utilizado en caso de que se deba realizar una transacción de 'escritura' a la cadena de bloques, que involucra la cuenta conectada. 
   * necesidad de realizar una firma digital para autorizar la transacción que se está enviando. Metamask expone una API de signer para permitir que su sitio web
   * solicitar firmas del usuario mediante las funciones de signer.
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
      window.alert("Cambia la red a Goerli");
      throw new Error("Cambia la red a Goerli");
    }
 
 
    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };
 
 
  // useEffects se utilizan para reaccionar a los cambios en el estado del sitio web
 // El array al final de la llamada a la función representa qué cambios de estado desencadenarán este efecto 
// En este caso, siempre que cambie el valor de 'walletConnected', este efecto se denominará
  useEffect(() => {
    // Si la cartera no está conectada, cree una nueva instancia de Web3Modal y conecte la cartera MetaMask
    if (!walletConnected) {
   // Asigne la clase Web3Modal al objeto de referencia estableciendo su valor 'current' 
  // El valor 'actual' se conserva durante todo el tiempo que esta página esté abierta
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
 
 
      // Compruebe si la preventa ha comenzado y finalizado
      const _presaleStarted = checkIfPresaleStarted();
      if (_presaleStarted) {
        checkIfPresaleEnded();
      }
 
 
      getTokenIdsMinted();
 
 
      // Establezca un intervalo al que se llama cada 5 segundos para comprobar que la preventa ha finalizado
      const presaleEndedInterval = setInterval(async function () {
        const _presaleStarted = await checkIfPresaleStarted();
        if (_presaleStarted) {
          const _presaleEnded = await checkIfPresaleEnded();
          if (_presaleEnded) {
            clearInterval(presaleEndedInterval);
          }
        }
      }, 5 * 1000);
 
 
      // Establezca un intervalo para obtener el número de identificadores de token minteados cada 5 segundos
      setInterval(async function () {
        await getTokenIdsMinted();
      }, 5 * 1000);
    }
  }, [walletConnected]);
 
 
  /*
      renderButton: Devuelve un botón basado en el estado de la dapp.
    */
  const renderButton = () => {
    // Si la billetera no está conectada, devuelva un botón que les permita conectar su billetera
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Conecta tu wallet
        </button>
      );
    }
 
 
    // Si actualmente estamos esperando algo, devolvemos un botón de carga
    if (loading) {
      return <button className={styles.button}>Cargando...</button>;
    }
 
 
    // Si el usuario conectado es el propietario y la preventa aún no ha comenzado, permítale iniciar la preventa
    if (isOwner && !presaleStarted) {
      return (
        <button className={styles.button} onClick={startPresale}>
          Comienza la preventa!
        </button>
      );
    }
 
 
    // Si el usuario conectado no es el propietario pero la preventa aún no ha comenzado, dígale que
    if (!presaleStarted) {
      return (
        <div>
          <div className={styles.description}>La preventa no ha comenzado!</div>
        </div>
      );
    }
 
 
    // Si la preventa comenzó, pero aún no ha terminado, permita el minteo durante el período de preventa
    if (presaleStarted && !presaleEnded) {
      return (
        <div>
          <div className={styles.description}>
        La preventa ha comenzado!!! Si su dirección está en la Whitelist, mintea un AW3 Dev 🥳
          </div>
          <button className={styles.button} onClick={presaleMint}>
           Minteo preventa 🚀
          </button>
        </div>
      );
    }
 
 
    // Si la preventa comenzó y ha terminado, es hora del minteo público
    if (presaleStarted && presaleEnded) {
      return (
        <button className={styles.button} onClick={publicMint}>
          Minteo público 🚀
        </button>
      );
    }
  };
 
 
  return (
    <div>
      <Head>
        <title>AW3 Devs</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Bienvenido a AW3 Devs!</h1>
          <div className={styles.description}>
          Es una colección NFT para desarrolladores en Crypto.
          </div>
          <div className={styles.description}>
            {tokenIdsMinted}/20 han sido minteados
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./aw3devs/0.svg" />
        </div>
      </div>
 
 
      <footer className={styles.footer}>
       Hecho con &#10084; by AW3 Devs
      </footer>
    </div>
  );
}