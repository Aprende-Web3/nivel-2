// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
 
 
import "@openzeppelin/contracts/access/Ownable.sol";
 
 
// Añadiremos las Interfaces aquí
/**
 * Interface para el FakeNFTMarketplace
 */
interface IFakeNFTMarketplace {
    /// @dev getPrice() devuelve el precio de un NFT del FakeNFTMarketplace
    /// @return Devuelve el precio en Wei para un NFT
    function getPrice() external view returns (uint256);
 
 
    /// @dev available() devuelve si el _tokenId dado ya se ha comprado o no
    /// @return Devuelve un valor booleano: true si está disponible, false si no
    function available(uint256 _tokenId) external view returns (bool);
 
 
    /// @dev purchase() compra un NFT en FakeNFTMarketplace
    /// @param _tokenId - el tokenID NFT falso para comprar
    function purchase(uint256 _tokenId) external payable;
}
 
 
/**
 * Interfaz mínima para AW3DevsNFT que contiene solo dos funciones que nos interesa
 */
interface IAW3DevsNFT {
    /// @dev balanceOf devuelve el número de NFT propiedad de la dirección dada
    /// @param owner - dirección para obtener el número de NFT 
    /// @return devolver el número de NFT que poseen.
    function balanceOf(address owner) external view returns (uint256);
 
 
    /// @dev tokenOfOwnerByIndex devuelve un tokenID en el índice dado para el propietario
    /// @param owner - dirección para obtener el TokenID NFT 
    /// @param index - índice de NFT en el array de tokens propios
    /// @return Devuelve el TokenID de la NFT.
    function tokenOfOwnerByIndex(address owner, uint256 index)
        external
        view
        returns (uint256);
}

 
 
contract AW3DevsDAO is Ownable {
    // Escribiremos el código de contrato aquí
    // Crear una estructura denominada Proposal que contenga toda la información relevante
struct Proposal {
    // nftTokenId - el tokenID del NFT para comprar en FakeNFTMarketplace si la propuesta pasa
    uint256 nftTokenId;
    // deadline - la marca de tiempo UNIX hasta la cual esta propuesta está activa. La propuesta se puede ejecutar después de que se haya superado el plazo.
    uint256 deadline;
    // yayVotes - número de votos a favor de esta propuesta
    uint256 yayVotes;
    // nayVotes - número de votos negativos a favor de esta propuesta
    uint256 nayVotes;
    // executed - si esta propuesta ya se ha ejecutado o no. No se puede ejecutar antes de que se haya superado el plazo.
    bool executed;
    // voters - un mapping de tokens AW3DevsNFT a booleanos que indique si ese NFT ya se ha utilizado para emitir un voto o no
    mapping(uint256 => bool) voters;
}
// Crear un mapping de ID a la propuesta
mapping(uint256 => Proposal) public proposals;
// Número de propuestas que se han creado
uint256 public numProposals;
IFakeNFTMarketplace nftMarketplace;
IAW3DevsNFT aw3DevsNFT;

// Crear un constructor payable que inicialice el contrato
// Instancias para FakeNFTMarketplace y AW3DevsNFT
// Payable permite a este constructor aceptar un depósito ETH cuando se está implementando
constructor(address _nftMarketplace, address _aw3DevsNFT) payable {
    nftMarketplace = IFakeNFTMarketplace(_nftMarketplace);
    aw3DevsNFT = IAW3DevsNFT(_aw3DevsNFT);
}
// Crear un modificador que sólo permita que una función sea
// llamada por alguien que posee al menos 1 AW3DevsNFT
modifier nftHolderOnly() {
    require(aw3DevsNFT.balanceOf(msg.sender) > 0, "NOT_A_DAO_MEMBER");
    _;
}
/// @dev createProposal permite a un titular de AW3DevsNFT crear una nueva propuesta en la DAO
/// @param _nftTokenId - el tokenID del NFT que se comprará en FakeNFTMarketplace si esta propuesta se aprueba
/// @return Devuelve el índice de propuestas de la propuesta recién creada.
function createProposal(uint256 _nftTokenId)
    external
    nftHolderOnly
    returns (uint256)
{
    require(nftMarketplace.available(_nftTokenId), "NFT_NOT_FOR_SALE");
    Proposal storage proposal = proposals[numProposals];
    proposal.nftTokenId = _nftTokenId;
    // Establezca que la fecha límite de votación de la propuesta sea (hora actual + 5 minutos)
    proposal.deadline = block.timestamp + 5 minutes;
 
 
    numProposals++;
 
 
    return numProposals - 1;
}

// Crear un modificador que sólo permita que una función sea
// llamada si el plazo de la propuesta dada aún no se ha excedido
modifier activeProposalOnly(uint256 proposalIndex) {
    require(
        proposals[proposalIndex].deadline > block.timestamp,
        "DEADLINE_EXCEEDED"
    );
    _;
}
// Crear una enumeración denominada Vote que contenga las posibles opciones para una votación
enum Vote {
    YAY, // YAY = 0
    NAY // NAY = 1
}
/// @dev voteOnProposal permite a un titular de AW3DevsNFT emitir su voto sobre una propuesta activa
/// @param proposalIndex - el índice de la propuesta a votar en el array de propuestas
/// @param vote - el tipo de voto que quieren emitir
function voteOnProposal(uint256 proposalIndex, Vote vote)
    external
    nftHolderOnly
    activeProposalOnly(proposalIndex)
{
    Proposal storage proposal = proposals[proposalIndex];
 
 
    uint256 voterNFTBalance = aw3DevsNFT.balanceOf(msg.sender);
    uint256 numVotes = 0;
 
 
    // Calcular cuántos NFT son propiedad del votante
    // que aún no se han utilizado para votar sobre esta propuesta
    for (uint256 i = 0; i < voterNFTBalance; i++) {
        uint256 tokenId = aw3DevsNFT.tokenOfOwnerByIndex(msg.sender, i);
        if (proposal.voters[tokenId] == false) {
            numVotes++;
            proposal.voters[tokenId] = true;
        }
    }
    require(numVotes > 0, "ALREADY_VOTED");
 
 
    if (vote == Vote.YAY) {
        proposal.yayVotes += numVotes;
    } else {
        proposal.nayVotes += numVotes;
    }
}


// Crear un modificador que sólo permita que una función sea
// llamada si se ha superado el plazo de las propuestas dadas
// y si la propuesta aún no se ha ejecutado
modifier inactiveProposalOnly(uint256 proposalIndex) {
    require(
        proposals[proposalIndex].deadline <= block.timestamp,
        "DEADLINE_NOT_EXCEEDED"
    );
    require(
        proposals[proposalIndex].executed == false,
        "PROPOSAL_ALREADY_EXECUTED"
    );
    _;
}
/// @dev executeProposal permite a cualquier titular de AW3DevsNFT ejecutar una propuesta después de que se haya excedido su fecha límite
/// @param proposalIndex - el índice de la propuesta que se va a ejecutar en el array de propuestas
function executeProposal(uint256 proposalIndex)
    external
    nftHolderOnly
    inactiveProposalOnly(proposalIndex)
{
    Proposal storage proposal = proposals[proposalIndex];
 
 
    // Si la propuesta tiene más votos YAY que NAY
    // comprar el NFT en fakeNFTMarketplace
    if (proposal.yayVotes > proposal.nayVotes) {
        uint256 nftPrice = nftMarketplace.getPrice();
        require(address(this).balance >= nftPrice, "NOT_ENOUGH_FUNDS");
        nftMarketplace.purchase{value: nftPrice}(proposal.nftTokenId);
    }
    proposal.executed = true;
}
/// @dev withdrawEther permite al propietario del contrato (desplegador) retirar el ETH del contrato
function withdrawEther() external onlyOwner {
    payable(owner()).transfer(address(this).balance);
}
// Las siguientes dos funciones permiten que el contrato acepte depósitos ETH
// directamente desde un monedero sin llamar a una función
receive() external payable {}
 
 
fallback() external payable {}

}