// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
 
 
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";
 
 
contract AW3Devs is ERC721Enumerable, Ownable {
    /**
      * @dev _baseTokenURI para calcular {tokenURI}. Si se establece, el URI resultante para cada uno
      * token será la concatenación de `baseURI` y el `tokenId`.
      */
    string _baseTokenURI;
 
 
    //  _price es el precio de un AW3 Dev NFT
    uint256 public _price = 0.01 ether;
 
 
    // _paused se utiliza para pausar el contrato en caso de emergencia
    bool public _paused;
 
 
    // número máximo de AW3Devs
    uint256 public maxTokenIds = 20;
 
 
    // número total de tokenIds minteados
    uint256 public tokenIds;
 
 
    // Instancia del contrato Whitelist
    IWhitelist whitelist;
 
 
    // boolean para realizar un seguimiento de si la preventa comenzó o no
    bool public presaleStarted;
 
 
    // marca de tiempo para cuando terminaría la preventa
    uint256 public presaleEnded;
 
 
    modifier onlyWhenNotPaused {
        require(!_paused, "Contract currently paused");
        _;
    }
 
 
    /**
      * @dev ERC721 constructor toma un 'nombre' y un 'símbolo' para la colección de tokens.
      * el nombre en nuestro caso es 'AW3 Devs' y el símbolo es 'AW3'.
      * Constructor para AW3 Devs toma el baseURI para establecer el _baseTokenURI para la colección.
      * También inicializa una instancia de interfaz de la Whitelist.
      */
    constructor (string memory baseURI, address whitelistContract) ERC721("AW3 Devs", "AW3") {
        _baseTokenURI = baseURI;
        whitelist = IWhitelist(whitelistContract);
    }
 
 
    /**
    * @dev startPresale inicia una preventa para las direcciones de la Whitelist
      */
    function startPresale() public onlyOwner {
        presaleStarted = true;
        // Establece el tiempo de presaleEnded como marca de tiempo actual + 5 minutos
        // Solidity tiene una sintaxis genial para marcas de tiempo (segundos, minutos, horas, días, años)
        presaleEnded = block.timestamp + 5 minutes;
    }
 
 
    /**
      * @dev presaleMint permite a un usuario mintear un NFT por transacción durante la preventa.
      */
    function presaleMint() public payable onlyWhenNotPaused {
        require(presaleStarted && block.timestamp < presaleEnded, "Presale is not running");
        require(whitelist.whitelistedAddresses(msg.sender), "You are not whitelisted");
        require(tokenIds < maxTokenIds, "Exceeded maximum AW3 Devs supply");
        require(msg.value >= _price, "Ether sent is not correct");
        tokenIds += 1;
        //_safeMint es una versión más segura de la función _mint, ya que garantiza que
        // Si la dirección a la que se minteó es un contrato, entonces sabe cómo lidiar con el token ERC721
        // Si la dirección a la que se minteó no es un contrato, funciona de la misma manera que _mint
        _safeMint(msg.sender, tokenIds);
    }
 
 
    /**
    * @dev mint permite a un usuario mintear 1 NFT por transacción después de que la preventa haya finalizado.
    */
    function mint() public payable onlyWhenNotPaused {
        require(presaleStarted && block.timestamp >=  presaleEnded, "Presale has not ended yet");
        require(tokenIds < maxTokenIds, "Exceed maximum AW3 Devs supply");
        require(msg.value >= _price, "Ether sent is not correct");
        tokenIds += 1;
        _safeMint(msg.sender, tokenIds);
    }
 
 
    /**
    * @dev _baseURI prevalece sobre la implementación ERC721 de Openzeppelin que por defecto
    * devolvió una cadena vacía para el baseURI
    */
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }
 
 
    /**
    * @dev setPaused hace que el contrato esté en pausa o sin dejar de usar
      */
    function setPaused(bool val) public onlyOwner {
        _paused = val;
    }
 
 
    /**
    * @dev withdraw envía todo el ether en el contrato
    * al titular del contrato
      */
    function withdraw() public onlyOwner  {
        address _owner = owner();
        uint256 amount = address(this).balance;
        (bool sent, ) =  _owner.call{value: amount}("");
        require(sent, "Failed to send Ether");
    }
 
 
      // Función receive para recibir Ether. msg.data debe estar vacío
    receive() external payable {}
 
 
    // Función fallback es llamada cuando msg.data no está vacío
    fallback() external payable {}
}