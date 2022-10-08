// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
 
 
contract FakeNFTMarketplace {
    /// @dev Mantener un mapping de TokenID falso a las direcciones del propietario
    mapping(uint256 => address) public tokens;
    /// @dev Establece el precio de compra para cada NFT falso
    uint256 nftPrice = 0.1 ether;
 
 
    /// @dev purchase() acepta ETH y marca el propietario del tokenId dado como la dirección de la persona que llama
    /// @param _tokenId - el ID de token NFT falso para comprar
    function purchase(uint256 _tokenId) external payable {
        require(msg.value == nftPrice, "This NFT costs 0.1 ether");
        tokens[_tokenId] = msg.sender;
    }
 
 
    /// @dev getPrice() devuelve el precio de un NFT
    function getPrice() external view returns (uint256) {
        return nftPrice;
    }
 
 
    /// @dev available() comprueba si el tokenId dado ya se ha vendido o no
    /// @param _tokenId - el tokenId que se va a comprobar
    function available(uint256 _tokenId) external view returns (bool) {
        // address(0) = 0x0000000000000000000000000000000000000000
        // Este es el valor predeterminado para las direcciones en Solidity
        if (tokens[_tokenId] == address(0)) {
            return true;
        }
        return false;
    }
}