import { Contract, providers } from "ethers";
import { formatEther } from "ethers/lib/utils";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import {
  AW3DEVS_DAO_ABI,
  AW3DEVS_DAO_CONTRACT_ADDRESS,
  AW3DEVS_NFT_ABI,
  AW3DEVS_NFT_CONTRACT_ADDRESS,
} from "../constants";
import styles from "../styles/Home.module.css";

export default function Home() {
  //  ETH Saldo del contrato DAO
  const [treasuryBalance, setTreasuryBalance] = useState("0");
  // Número de propuestas creadas en la DAO
  const [numProposals, setNumProposals] = useState("0");
  //  Array de todas las propuestas creadas en la DAO
  const [proposals, setProposals] = useState([]);
  // Saldo del usuario de NFT de AW3Devs
  const [nftBalance, setNftBalance] = useState(0);
  // ID de token NFT falso para comprar. Se utiliza al crear una propuesta.
  const [fakeNftTokenId, setFakeNftTokenId] = useState("");
  // Uno de "Crear propuesta" o "Ver propuestas"
  const [selectedTab, setSelectedTab] = useState("");
  // True si está esperando a que se extraiga una transacción, false en caso contrario.
  const [loading, setLoading] = useState(false);
  // True si está esperando a que se extraiga una transacción, false en caso contrario.
  const [walletConnected, setWalletConnected] = useState(false);
  const web3ModalRef = useRef();

  // Función auxiliar para conectar la billetera
  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (error) {
      console.error(error);
    }
  };

  // Lee el saldo ETH del contrato DAO y establece la variable de estado 'treasuryBalance'
  const getDAOTreasuryBalance = async () => {
    try {
      const provider = await getProviderOrSigner();
      const balance = await provider.getBalance(
        AW3DEVS_DAO_CONTRACT_ADDRESS
      );
      setTreasuryBalance(balance.toString());
    } catch (error) {
      console.error(error);
    }
  };

  // Lee el número de propuestas en el contrato DAO y establece la variable de estado 'numProposals'
  const getNumProposalsInDAO = async () => {
    try {
      const provider = await getProviderOrSigner();
      const contract = getDaoContractInstance(provider);
      const daoNumProposals = await contract.numProposals();
      setNumProposals(daoNumProposals.toString());
    } catch (error) {
      console.error(error);
    }
  };

  // Lee el saldo de los NFT de AW3Devs del usuario y establece la variable de estado 'nftBalance'
  const getUserNFTBalance = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = getAW3devsNFTContractInstance(signer);
      const balance = await nftContract.balanceOf(signer.getAddress());
      setNftBalance(parseInt(balance.toString()));
    } catch (error) {
      console.error(error);
    }
  };

  // Llama a la función 'createProposal' en el contrato, utilizando el tokenId de 'fakeNftTokenId'
  const createProposal = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const daoContract = getDaoContractInstance(signer);
      const txn = await daoContract.createProposal(fakeNftTokenId);
      setLoading(true);
      await txn.wait();
      await getNumProposalsInDAO();
      setLoading(false);
    } catch (error) {
      console.error(error);
      window.alert(error.data.message);
    }
  };

  // Función auxiliar para obtener y analizar una propuesta del contrato DAO
  // Dado el ID de la propuesta
  // y convierte los datos devueltos en un objeto Javascript con valores que podemos usar
  const fetchProposalById = async (id) => {
    try {
      const provider = await getProviderOrSigner();
      const daoContract = getDaoContractInstance(provider);
      const proposal = await daoContract.proposals(id);
      const parsedProposal = {
        proposalId: id,
        nftTokenId: proposal.nftTokenId.toString(),
        deadline: new Date(parseInt(proposal.deadline.toString()) * 1000),
        yayVotes: proposal.yayVotes.toString(),
        nayVotes: proposal.nayVotes.toString(),
        executed: proposal.executed,
      };
      return parsedProposal;
    } catch (error) {
      console.error(error);
    }
  };

 
  // Ejecuta un bucle 'numProposals' times para obtener todas las propuestas en la DAO
  // y establece la variable de estado 'proposals'
  const fetchAllProposals = async () => {
    try {
      const proposals = [];
      for (let i = 0; i < numProposals; i++) {
        const proposal = await fetchProposalById(i);
        proposals.push(proposal);
      }
      setProposals(proposals);
      return proposals;
    } catch (error) {
      console.error(error);
    }
  };

  // Llama a la función 'voteOnProposal' en el contrato, utilizando el aprobado
  // identificación de la propuesta y voto
  const voteOnProposal = async (proposalId, _vote) => {
    try {
      const signer = await getProviderOrSigner(true);
      const daoContract = getDaoContractInstance(signer);

      let vote = _vote === "YAY" ? 0 : 1;
      const txn = await daoContract.voteOnProposal(proposalId, vote);
      setLoading(true);
      await txn.wait();
      setLoading(false);
      await fetchAllProposals();
    } catch (error) {
      console.error(error);
      window.alert(error.data.message);
    }
  };

  // Llama a la función 'executeProposal' en el contrato, utilizando
  // el ID de propuesta aprobado
  const executeProposal = async (proposalId) => {
    try {
      const signer = await getProviderOrSigner(true);
      const daoContract = getDaoContractInstance(signer);
      const txn = await daoContract.executeProposal(proposalId);
      setLoading(true);
      await txn.wait();
      setLoading(false);
      await fetchAllProposals();
    } catch (error) {
      console.error(error);
      window.alert(error.data.message);
    }
  };

  // Función auxiliar para obtener una instancia de provider/signer de Metamask
  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("¡Por favor, cambie a la red Goerli!");
      throw new Error("Por favor, cambie a la red Goerli");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  // Función auxiliar para devolver una instancia de contrato DAO
  // dado un provider/signer
  const getDaoContractInstance = (providerOrSigner) => {
    return new Contract(
      AW3DEVS_DAO_CONTRACT_ADDRESS,
      AW3DEVS_DAO_ABI,
      providerOrSigner
    );
  };

  // Función auxiliar para devolver una instancia de contrato NFT de AW3Devs
  // dado un provider/signer
  const getAW3devsNFTContractInstance = (providerOrSigner) => {
    return new Contract(
      AW3DEVS_NFT_CONTRACT_ADDRESS,
      AW3DEVS_NFT_ABI,
      providerOrSigner
    );
  };

  // fragmento de código que se ejecuta cada vez que cambia el valor de 'walletConnected'
  // así que cuando una billetera se conecta o desconecta
  // Solicita al usuario que conecte la billetera si no está conectado
  // y, a continuación, llama a las funciones auxiliares para obtener el
  // Saldo de tesorería de DAO, saldo de NFT de usuario y número de propuestas en el DAO
  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });

      connectWallet().then(() => {
        getDAOTreasuryBalance();
        getUserNFTBalance();
        getNumProposalsInDAO();
      });
    }
  }, [walletConnected]);

  // Fragmento de código que se ejecuta cada vez que cambia el valor de 'selectedTab'
  // Se utiliza para volver a buscar todas las propuestas en el DAO cuando el usuario cambia
  // a la pestaña 'Ver propuestas'
  useEffect(() => {
    if (selectedTab === "View Proposals") {
      fetchAllProposals();
    }
  }, [selectedTab]);

  // Representar el contenido de la ficha adecuada en función de 'selectedTab'
  function renderTabs() {
    if (selectedTab === "Create Proposal") {
      return renderCreateProposalTab();
    } else if (selectedTab === "View Proposals") {
      return renderViewProposalsTab();
    }
    return null;
  }

  // Representa el contenido de la pestaña 'Crear propuesta'
  function renderCreateProposalTab() {
    if (loading) {
      return (
        <div className={styles.description}>
           Cargando... Esperando la transacción...
        </div>
      );
    } else if (nftBalance === 0) {
      return (
        <div className={styles.description}>
               Usted no posee ningún NFT de AW3Devs.<br />
          <b>No se pueden crear ni votar propuestas</b>
        </div>
      );
    } else {
      return (
        <div className={styles.container}>
            <label>ID de token NFT falso para comprar: </label>
          <input
            placeholder="0"
            type="number"
            onChange={(e) => setFakeNftTokenId(e.target.value)}
          />
          <button className={styles.button2} onClick={createProposal}>
            Crear
          </button>
        </div>
      );
    }
  }

  // Representa el contenido de la pestaña 'Ver propuestas'
  function renderViewProposalsTab() {
    if (loading) {
      return (
        <div className={styles.description}>
             Cargando... Esperando la transacción...
        </div>
      );
    } else if (proposals.length === 0) {
      return (
        <div className={styles.description}>No se han creado propuestas</div>
      );
    } else {
      return (
        <div>
          {proposals.map((p, index) => (
            <div key={index} className={styles.proposalCard}>
            <p>ID de propuesta: {p.proposalId}</p>
              <p>NFT falso para comprar: {p.nftTokenId}</p>
              <p>Fecha tope: {p.deadline.toLocaleString()}</p>
              <p>Votos Yay: {p.yayVotes}</p>
              <p>Votos negativos: {p.nayVotes}</p>
              <p>Executed?: {p.executed.toString()}</p>
              {p.deadline.getTime() > Date.now() && !p.executed ? (
                <div className={styles.flex}>
                  <button
                    className={styles.button2}
                    onClick={() => voteOnProposal(p.proposalId, "YAY")}
                  >
                    Vota YAY
                  </button>
                  <button
                    className={styles.button2}
                    onClick={() => voteOnProposal(p.proposalId, "NAY")}
                  >
                    Vota NAY
                  </button>
                </div>
              ) : p.deadline.getTime() < Date.now() && !p.executed ? (
                <div className={styles.flex}>
                  <button
                    className={styles.button2}
                    onClick={() => executeProposal(p.proposalId)}
                  >
                     Ejecuta propuesta{" "}
                    {p.yayVotes > p.nayVotes ? "(YAY)" : "(NAY)"}
                  </button>
                </div>
              ) : (
                <div className={styles.description}>Propuesta ejecutada</div>
              )}
            </div>
          ))}
        </div>
      );
    }
  }

  return (
    <div>
      <Head>
        <title>AW3Devs DAO</title>
        <meta name="description" content="AW3Devs DAO" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Bienvenido a AW3 Devs!</h1>
          <div className={styles.description}>Bienvenido a la DAO!</div>
          <div className={styles.description}>
          Su saldo NFT de AW3Devs:  {nftBalance}
            <br />
            Saldo del Tesoro:  {formatEther(treasuryBalance)} ETH
            <br />
            Número total de propuestas: {numProposals}
          </div>
          <div className={styles.flex}>
            <button
              className={styles.button}
              onClick={() => setSelectedTab("Create Proposal")}
            >
                Crear propuesta
            </button>
            <button
              className={styles.button}
              onClick={() => setSelectedTab("View Proposals")}
            >
                 Ver propuestas
            </button>
          </div>
          {renderTabs()}
        </div>
        <div>
          <img className={styles.image} src="/aw3devs/0.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by AW3 Devs
      </footer>
    </div>
  );
}