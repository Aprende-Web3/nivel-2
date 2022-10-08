// SPDX-License-Identifier: MIT
  pragma solidity ^0.8.0;
 
 
  import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
  import "@openzeppelin/contracts/access/Ownable.sol";
  import "./IAW3Devs.sol";
 
 
  contract AW3DevToken is ERC20, Ownable {
      // Precio de un token AW3 Dev
      uint256 public constant tokenPrice = 0.001 ether;
      // Cada NFT le daría al usuario 10 tokens
      // Debe representarse como 10 * (10 ** 18) ya que los tokens ERC20 están representados por la denominación más pequeña posible para el token.
      // De forma predeterminada, los tokens ERC20 tienen la denominación más pequeña de 10^(-18). Esto significa, tener un equilibrio de (1)
      // es en realidad igual a (10 ^ -18) tokens.
      // Poseer 1 token completo es equivalente a poseer tokens (10^18) cuando se tienen en cuenta los decimales.
      // Puede encontrar más información sobre esto en el tutorial de la crea tu propia criptomoneda del nivel 1.
      uint256 public constant tokensPerNFT = 10 * 10**18;
      // El suministro total máximo es de 10000 para AW3 Dev Tokens
      uint256 public constant maxTotalSupply = 10000 * 10**18;
      // Instancia de contrato AW3DevsNFT
      IAW3Devs AW3DevsNFT;
      // Mapping para realizar un seguimiento de los tokenIds que se han reclamado
      mapping(uint256 => bool) public tokenIdsClaimed;
 
 
      constructor(address _aw3DevsContract) ERC20("AW3 Dev Token", "AW3D") {
          AW3DevsNFT = IAW3Devs(_aw3DevsContract);
      }
 
 
      /**
       * @dev Acuña el número de 'cantidad' de AW3DevTokens
       * Requisitos:
       * - `msg.value` debe ser igual o mayor que el tokenPrice * amount
       */
      function mint(uint256 amount) public payable {
          // el valor de ether que debe ser igual o mayor que tokenPrice * amount;
          uint256 _requiredAmount = tokenPrice * amount;
          require(msg.value >= _requiredAmount, "Ether sent is incorrect");
          // total tokens + amount <= 10000, en caso contrario revertir la transacción
          uint256 amountWithDecimals = amount * 10**18;
          require(
              (totalSupply() + amountWithDecimals) <= maxTotalSupply,
              "Exceeds the max total supply available."
          );
          // Llame a la función interna desde el contrato ERC20 de Openzeppelin
          _mint(msg.sender, amountWithDecimals);
      }
 
 
      /**
       * @dev tokens minteados basados en el número de NFTs en poder del remitente
       * Requisitos:
       * El saldo de AW3 Dev NFT propiedad del remitente debe ser mayor que 0
       * Los tokens no deberían haberse reclamado para todos los NFT propiedad del remitente
       */
      function claim() public {
          address sender = msg.sender;
          // 
          uint256 balance = AW3DevsNFT.balanceOf(sender);
          // Si el saldo es cero, revierta la transacción
          require(balance > 0, "You dont own any AW3 Dev NFT's");
          // amount realiza un seguimiento del número de tokenIds no reclamados
          uint256 amount = 0;
          // recorra el saldo y obtenga el ID de token propiedad del 'remitente' en un 'índice' dado de su lista de tokens.
          for (uint256 i = 0; i < balance; i++) {
              uint256 tokenId = AW3DevsNFT.tokenOfOwnerByIndex(sender, i);
              // Si no se ha reclamado el tokenId, aumente el importe
              if (!tokenIdsClaimed[tokenId]) {
                  amount += 1;
                  tokenIdsClaimed[tokenId] = true;
              }
          }
          // Si se han reclamado todos los ID de token, revierta la transacción;
          require(amount > 0, "You have already claimed all the tokens");
          // Llame a la función interna desde el contrato ERC20 de Openzeppelin
          // mintea (amount * 10) por cada NFT
          _mint(msg.sender, amount * tokensPerNFT);
      }
 
 
      /**
        * @dev retira todos los ETH y tokens enviados al contrato
        * Requisitos:
        * la billetera conectada debe ser la dirección del propietario
        */
      function withdraw() public onlyOwner {
        address _owner = owner();
        uint256 amount = address(this).balance;
        (bool sent, ) = _owner.call{value: amount}("");
        require(sent, "Failed to send Ether");
      }
 
 
      // Función receive para recibir Ether. msg.data debe estar vacío
      receive() external payable {}
 
 
      // Función Fallback se llama cuando msg.data no está vacío
      fallback() external payable {}
  }