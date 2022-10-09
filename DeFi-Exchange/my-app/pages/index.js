import { BigNumber, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import styles from "../styles/Home.module.css";
import { addLiquidity, calculateAW3D } from "../utils/addLiquidity";
import {
  getAW3DTokensBalance,
  getEtherBalance,
  getLPTokensBalance,
  getReserveOfAW3DTokens,
} from "../utils/getAmounts";
import {
  getTokensAfterRemove,
  removeLiquidity,
} from "../utils/removeLiquidity";
import { swapTokens, getAmountOfTokensReceivedFromSwap } from "../utils/swap";
 
 
export default function Home() {
  /** Variables generales de estado */
   // loading se establece en verdadero cuando la transacción está minando y se establece en falso cuando
   // la transacción ha minado
  const [loading, setLoading] = useState(false);
 // Tenemos dos pestañas en este dapp, la pestaña Liquidez y la pestaña Swap. esta variable
   // realiza un seguimiento de en qué pestaña está el usuario. Si se establece en verdadero, esto significa
   // que el usuario está en la pestaña `liquidez`, de lo contrario, está en la pestaña `swap`
  const [liquidityTab, setLiquidityTab] = useState(true);
// Esta variable es el número `0` en forma de BigNumber
  const zero = BigNumber.from(0);
/** Variables para realizar un seguimiento de la cantidad */
   // `ethBalance` realiza un seguimiento de la cantidad de Eth en poder de la cuenta del usuario
  const [ethBalance, setEtherBalance] = useState(zero);
// `reservedAW3D` realiza un seguimiento del saldo de reserva de tokens AW3 Dev en el contrato de intercambio
  const [reservedAW3D, setReservedAW3D] = useState(zero);
// Realiza un seguimiento del saldo de ether en el contrato
  const [etherBalanceContract, setEtherBalanceContract] = useState(zero);
// aw3dBalance es la cantidad de tokens `AW3D` ayudados por la cuenta del usuario
  const [aw3dBalance, setAW3DBalance] = useState(zero);
// `lpBalance` es la cantidad de tokens LP que tiene la cuenta del usuario
  const [lpBalance, setLPBalance] = useState(zero);
/** Variables para realizar un seguimiento de la liquidez que se agregarán o eliminarán */
   // addEther es la cantidad de Ether que el usuario quiere agregar a la liquidez
  const [addEther, setAddEther] = useState(zero);
// addAW3DTokens realiza un seguimiento de la cantidad de tokens de AW3D que el usuario desea agregar a la liquidez
   // en caso de que no haya liquidez inicial y después de que se agregue la liquidez, realiza un seguimiento de los
   // tokens de AW3D que el usuario puede agregar dada una cierta cantidad de ether
  const [addAW3DTokens, setAddAW3DTokens] = useState(zero);
  // removeEther es la cantidad de 'Ether' que se devolvería al usuario en función de una cierta cantidad de tokens 'LP'
  const [removeEther, setRemoveEther] = useState(zero);
  // removeAW3D es la cantidad de tokens `AW3 Dev` que se devolverían al usuario en función de una cierta cantidad de tokens `LP`
   // que quiere retirar
  const [removeAW3D, setRemoveAW3D] = useState(zero);
// cantidad de tokens LP que el usuario quiere retirar de la liquidez
  const [removeLPTokens, setRemoveLPTokens] = useState("0");
/** Variables para realizar un seguimiento de la funcionalidad de intercambio */
   // Cantidad que el usuario quiere intercambiar
  const [swapAmount, setSwapAmount] = useState("");
 // Esto realiza un seguimiento de la cantidad de tokens que el usuario recibiría después de que se complete un intercambio
  const [tokenToBeReceivedAfterSwap, settokenToBeReceivedAfterSwap] =
    useState(zero);
// Realiza un seguimiento de si se selecciona el token `Eth` o `AW3 Dev`. Si se selecciona `Eth`, significa que el usuario
   // quiere intercambiar algo de `Eth` por algunos tokens de `AW3 Dev` y viceversa si `Eth` no está seleccionado
  const [ethSelected, setEthSelected] = useState(true);
/** Conexión de billetera */
   // Cree una referencia a Web3 Modal (utilizado para conectarse a Metamask) que persiste mientras la página esté abierta
  const web3ModalRef = useRef();
// walletConnected realiza un seguimiento de si la billetera del usuario está conectada o no
  const [walletConnected, setWalletConnected] = useState(false);
 
 
  /**
  * getAmounts llama a varias funciones para recuperar cantidades para el saldo eth, * tokens LP, etc.
   */
  const getAmounts = async () => {
    try {
      const provider = await getProviderOrSigner(false);
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
    // obtener la cantidad de eth en la cuenta del usuario
      const _ethBalance = await getEtherBalance(provider, address);
   // obtener la cantidad de tokens `AW3 Dev` que tiene el usuario
      const _aw3dBalance = await getAW3DTokensBalance(provider, address);
     // obtener la cantidad de tokens LP `AW3 Dev` que tiene el usuario
      const _lpBalance = await getLPTokensBalance(provider, address);
   // obtiene la cantidad de tokens `AW3D` que están presentes en la reserva del `Contrato de intercambio`
      const _reservedAW3D = await getReserveOfAW3DTokens(provider);
    // Obtener las reservas de ether en el contrato
      const _ethBalanceContract = await getEtherBalance(provider, null, true);
      setEtherBalance(_ethBalance);
      setAW3DBalance(_aw3dBalance);
      setLPBalance(_lpBalance);
      setReservedAW3D(_reservedAW3D);
      setReservedAW3D(_reservedAW3D);
      setEtherBalanceContract(_ethBalanceContract);
    } catch (err) {
      console.error(err);
    }
  };
 
/**** FUNCIONES DE INTERCAMBIO ****/
/**
    * swapTokens: Intercambia `swapAmountWei` de tokens Eth/AW3 Dev con `tokenToBeReceivedAfterSwap` cantidad de tokens Eth/AW3 Dev.
    */
 
 
  const _swapTokens = async () => {
    try {
   // Convierte la cantidad ingresada por el usuario a un BigNumber usando la biblioteca `parseEther` de `ethers.js`
      const swapAmountWei = utils.parseEther(swapAmount);
   // Compruebe si el usuario ingresó cero
     // Estamos aquí usando el método `eq` de la clase BigNumber en `ethers.js`
      if (!swapAmountWei.eq(zero)) {
        const signer = await getProviderOrSigner(true);
        setLoading(true);
      // Llamar a la función swapTokens desde la carpeta `utils`
        await swapTokens(
          signer,
          swapAmountWei,
          tokenToBeReceivedAfterSwap,
          ethSelected
        );
        setLoading(false);
      // Obtenga todas las cantidades actualizadas después del intercambio
        await getAmounts();
        setSwapAmount("");
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setSwapAmount("");
    }
  };
 
/**
    * _getAmountOfTokensReceivedFromSwap: Devuelve la cantidad de tokens Eth/AW3 Dev que se pueden recibir
    * cuando el usuario intercambia la cantidad `_swapAmountWEI` de tokens Eth/AW3 Dev.
    */
 
  const _getAmountOfTokensReceivedFromSwap = async (_swapAmount) => {
    try {
    // Convierte la cantidad ingresada por el usuario a un BigNumber usando la biblioteca `parseEther` de `ethers.js`
      const _swapAmountWEI = utils.parseEther(_swapAmount.toString());
    // Comprobar si el usuario ingresó cero
       // Estamos aquí usando el método `eq` de la clase BigNumber en `ethers.js`
      if (!_swapAmountWEI.eq(zero)) {
        const provider = await getProviderOrSigner();
     // Obtener la cantidad de ether en el contrato
        const _ethBalance = await getEtherBalance(provider, null, true);
      // Llame a `getAmountOfTokensReceivedFromSwap` desde la carpeta utils
        const amountOfTokens = await getAmountOfTokensReceivedFromSwap(
          _swapAmountWEI,
          provider,
          ethSelected,
          _ethBalance,
          reservedAW3D
        );
        settokenToBeReceivedAfterSwap(amountOfTokens);
      } else {
        settokenToBeReceivedAfterSwap(zero);
      }
    } catch (err) {
      console.error(err);
    }
  };
/*** FINAL ***/
 
 
   /**** AÑADIR FUNCIONES DE LIQUIDEZ ****/
 
 
   /**
    * _addLiquidity ayuda a agregar liquidez al intercambio,
    * Si el usuario está agregando liquidez inicial, el usuario decide los tokens de ether y AW3D que desea agregar
    * al intercambio. Si está agregando la liquidez después de que ya se haya agregado la liquidez inicial
    * luego calculamos los tokens AW3D que puede agregar, dado el Eth que quiere agregar manteniendo las proporciones
    * constante
    */
  const _addLiquidity = async () => {
    try {
    // Convierte la cantidad de ether ingresada por el usuario a Bignumber
      const addEtherWei = utils.parseEther(addEther.toString());
    // Comprobar si los valores son cero
      if (!addAW3DTokens.eq(zero) && !addEtherWei.eq(zero)) {
        const signer = await getProviderOrSigner(true);
        setLoading(true);
      // llamar a la función addLiquidity desde la carpeta utils
        await addLiquidity(signer, addAW3DTokens, addEtherWei);
        setLoading(false);
      // Reinicializar los tokens de AW3D
        setAddAW3DTokens(zero);
     // Obtenga montos para todos los valores después de que se haya agregado la liquidez
        await getAmounts();
      } else {
        setAddAW3DTokens(zero);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setAddAW3DTokens(zero);
    }
  };
/**** FINAL ****/
 
 
   /**** QUITAR FUNCIONES DE LIQUIDEZ ****/
 
 
   /**
    * _removeLiquidity: elimina la cantidad `removeLPTokensWei` de tokens LP de
    * liquidez y también la cantidad calculada de tokens `ether` y `AW3D`
    */
  const _removeLiquidity = async () => {
    try {
      const signer = await getProviderOrSigner(true);
     // Convierte los tokens LP ingresados por el usuario a un BigNumber
      const removeLPTokensWei = utils.parseEther(removeLPTokens);
      setLoading(true);
     // Llamar a la función removeLiquidity desde la carpeta `utils`
      await removeLiquidity(signer, removeLPTokensWei);
      setLoading(false);
      await getAmounts();
      setRemoveAW3D(zero);
      setRemoveEther(zero);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setRemoveAW3D(zero);
      setRemoveEther(zero);
    }
  };
/**
    * _getTokensAfterRemove: Calcula la cantidad de tokens `Ether` y `AW3D`
    * que se devolvería al usuario después de que elimine la cantidad `removeLPTokenWei`
    * de tokens LP del contrato
    */
 
  const _getTokensAfterRemove = async (_removeLPTokens) => {
    try {
      const provider = await getProviderOrSigner();
    // Convierte los tokens LP ingresados por el usuario a un BigNumber
      const removeLPTokenWei = utils.parseEther(_removeLPTokens);
      // Obtenga las reservas de Eth dentro del contrato de intercambio
      const _ethBalance = await getEtherBalance(provider, null, true);
     // obtener las reservas de tokens de AW3 Dev del contrato
      const aw3DevTokenReserve = await getReserveOfAW3DTokens(provider);
    // llamar a getTokensAfterRemove desde la carpeta utils
      const { _removeEther, _removeAW3D } = await getTokensAfterRemove(
        provider,
        removeLPTokenWei,
        _ethBalance,
        aw3DevTokenReserve
      );
      setRemoveEther(_removeEther);
      setRemoveAW3D(_removeAW3D);
    } catch (err) {
      console.error(err);
    }
  };
/**** FINAL ****/
 
 
   /**
    * connectWallet: conecta la billetera MetaMask
    */
 
  const connectWallet = async () => {
    try {
     // Obtener el proveedor de web3Modal, que en nuestro caso es MetaMask
       // Cuando se usa por primera vez, solicita al usuario que conecte su billetera
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };
/**
    * Devuelve un objeto Provider o Signer que representa el Ethereum RPC con o
    * sin las capacidades de firma de Metamask adjuntas
    *
    * Se necesita un 'Provider' para interactuar con la cadena de bloques - lectura
    * transacciones, lectura de saldos, estado de lectura, etc.
    *
    * Un 'Signer' es un tipo especial de provider que se usa en caso de una transacción de 'escritura'
    * debe hacerse a la cadena de bloques, lo que involucra la cuenta conectada
    * necesidad de hacer una firma digital para autorizar la transacción que se está realizando
    * enviado. Metamask expone una API de signer para permitir que su sitio web solicite
    * firmas del usuario que utiliza funciones de signer.
    *
    * @param {*} needSigner - Verdadero si necesita el signer, predeterminado falso
    * de lo contrario
    */
 
 
  const getProviderOrSigner = async (needSigner = false) => {
 // Conectar a Metamask
     // Dado que almacenamos `web3Modal` como referencia, necesitamos acceder al valor `actual` para obtener acceso al objeto subyacente
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);
 
 
  // Si el usuario no está conectado a la red Goerli, hágale saber y arroje un error
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
 
 
// useEffects se utilizan para reaccionar a los cambios en el estado del sitio web
   // El array al final de la llamada a la función representa qué cambios de estado activarán este efecto
   // En este caso, siempre que cambie el valor de `walletConnected`, se llamará a este efecto
  useEffect(() => {
    // si la billetera no está conectada, crea una nueva instancia de Web3Modal y conecta la billetera MetaMask
    if (!walletConnected) {
   // Asigna la clase Web3Modal al objeto de referencia estableciendo su valor `actual`
       // El valor `actual` se conserva mientras esta página esté abierta
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
      getAmounts();
    }
  }, [walletConnected]);
 
/*
       renderButton: Devuelve un botón basado en el estado de la dapp
   */
 
  const renderButton = () => {
   // Si la billetera no está conectada, devuelve un botón que les permite conectar su billetera
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
         Conecta tu billetera
        </button>
      );
    }
 
 
  // Si actualmente estamos esperando algo, devuelve un botón de carga
    if (loading) {
      return <button className={styles.button}>Cargando...</button>;
    }
 
 
    if (liquidityTab) {
      return (
        <div>
          <div className={styles.description}>
         Tienes:
            <br />
           {/* Convierte el BigNumber en una cadena con la función formatEther de ethers.js */}
            {utils.formatEther(aw3dBalance)} AW3 Dev Tokens
            <br />
            {utils.formatEther(ethBalance)} Ether
            <br />
            {utils.formatEther(lpBalance)} AW3 Dev LP tokens
          </div>
          <div>
           {/* Si el AW3D reservado es cero, el estado de liquidez es cero donde le preguntamos al usuario
             cuánta liquidez inicial quiere agregar; de lo contrario, simplemente represente el estado donde la liquidez no es cero y
             calculamos en función de la cantidad "Eth" especificada por el usuario cuántos tokens "AW3D" se pueden agregar */}
            {utils.parseEther(reservedAW3D.toString()).eq(zero) ? (
              <div>
                <input
                  type="number"
                  placeholder="Cantidad de Ether"
                  onChange={(e) => setAddEther(e.target.value || "0")}
                  className={styles.input}
                />
                <input
                  type="number"
                  placeholder="Cantidad de AW3Dev tokens"
                  onChange={(e) =>
                    setAddAW3DTokens(
                      BigNumber.from(utils.parseEther(e.target.value || "0"))
                    )
                  }
                  className={styles.input}
                />
                <button className={styles.button1} onClick={_addLiquidity}>
                  Agregar
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="number"
                  placeholder="Cantidad de Ether"
                  onChange={async (e) => {
                    setAddEther(e.target.value || "0");
                   // calcular el número de tokens de AW3D que
                     // se puede agregar dada la cantidad de Eth `e.target.value`
                    const _addAW3DTokens = await calculateAW3D(
                      e.target.value || "0",
                      etherBalanceContract,
                      reservedAW3D
                    );
                    setAddAW3DTokens(_addAW3DTokens);
                  }}
                  className={styles.input}
                />
                <div className={styles.inputDiv}>
              {/* Convierte el BigNumber en una cadena con la función formatEther de ethers.js */}
                  {`Necesitas ${utils.formatEther(addAW3DTokens)} AW3     Dev
                  Tokens`}
                </div>
                <button className={styles.button1} onClick={_addLiquidity}>
                  Agregar
                </button>
              </div>
            )}
            <div>
              <input
                type="number"
                placeholder="Cantidad de LP Tokens"
                onChange={async (e) => {
                  setRemoveLPTokens(e.target.value || "0");
              // Calcular la cantidad de tokens Ether y AW3D que recibiría el usuario
                   // Después de que elimine la cantidad `e.target.value` de tokens `LP`
                  await _getTokensAfterRemove(e.target.value || "0");
                }}
                className={styles.input}
              />
              <div className={styles.inputDiv}>
             {/* Convierte el BigNumber en una cadena con la función formatEther de ethers.js */}
                {`Conseguirás ${utils.formatEther(removeAW3D)} AW3
              Dev Tokens y ${utils.formatEther(removeEther)} Eth`}
              </div>
              <button className={styles.button1} onClick={_removeLiquidity}>
               Eliminar
              </button>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div>
          <input
            type="number"
            placeholder="Cantidad"
            onChange={async (e) => {
              setSwapAmount(e.target.value || "");
            // Calcular la cantidad de tokens que el usuario recibiría después del intercambio
              await _getAmountOfTokensReceivedFromSwap(e.target.value || "0");
            }}
            className={styles.input}
            value={swapAmount}
          />
          <select
            className={styles.select}
            name="dropdown"
            id="dropdown"
            onChange={async () => {
              setEthSelected(!ethSelected);
           // Inicializar los valores de nuevo a cero
              await _getAmountOfTokensReceivedFromSwap(0);
              setSwapAmount("");
            }}
          >
            <option value="eth">Ethereum</option>
            <option value="aw3DevToken">AW3 Dev Token</option>
          </select>
          <br />
          <div className={styles.inputDiv}>
          {/* Convierte el BigNumber en una cadena con la función formatEther de ethers.js */}
            {ethSelected
              ? `Conseguirás ${utils.formatEther(
                  tokenToBeReceivedAfterSwap
                )} AW3 Dev Tokens`
              : `Conseguirás ${utils.formatEther(
                  tokenToBeReceivedAfterSwap
                )} Eth`}
          </div>
          <button className={styles.button1} onClick={_swapTokens}>
            Swap
          </button>
        </div>
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
          <h1 className={styles.title}>Bienvenido a AW3 Devs Exchange!</h1>
          <div className={styles.description}>
            Intercambia Ethereum &#60;&#62; AW3 Dev Tokens
          </div>
          <div>
            <button
              className={styles.button}
              onClick={() => {
                setLiquidityTab(true);
              }}
            >
              Liquidity
            </button>
            <button
              className={styles.button}
              onClick={() => {
                setLiquidityTab(false);
              }}
            >
              Swap
            </button>
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./aw3dev.svg" />
        </div>
      </div>
 
 
      <footer className={styles.footer}>
        Made with &#10084; by AW3 Devs
      </footer>
    </div>
  );
}