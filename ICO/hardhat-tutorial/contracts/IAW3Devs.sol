// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
 
 
interface IAW3Devs {
    /**
     * @dev Devuelve un token ID propiedad del 'propietario' en un 'índice' determinado de su lista de tokens.
     * Úselo junto con {balanceOf} para enumerar todos los tokens del ''propietario''.
     */
    function tokenOfOwnerByIndex(address owner, uint256 index)
        external
        view
        returns (uint256 tokenId);
 
 
    /**
     * @dev Devuelve el número de tokens en la cuenta del ''propietario''
     */
    function balanceOf(address owner) external view returns (uint256 balance);
}