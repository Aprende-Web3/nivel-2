//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
 
 
 
 
contract Whitelist {
 
 
    // Número máximo de direcciones de la whitelist permitidas
    uint8 public maxWhitelistedAddresses;
 
 
    // Crear un mapping de direcciones que estén en la whitelist
    // si una dirección está en la whitelist, la estableceríamos en true, es false de forma predeterminada para todas las demás direcciones.
    mapping(address => bool) public whitelistedAddresses;
 
 
    // numAddressesWhitelisted se utilizaría para realizar un seguimiento de cuántas direcciones se han incluido en la whitelist
    // NOTA: No cambie el nombre de esta variable, ya que formará parte de la verificación
    uint8 public numAddressesWhitelisted;
 
 
    // Configuración del número máximo de direcciones de la whitelist
    // El usuario pondrá el valor en el momento de la implementación
    constructor(uint8 _maxWhitelistedAddresses) {
        maxWhitelistedAddresses =  _maxWhitelistedAddresses;
    }
 
 
    /**
        addAddressToWhitelist - Esta función agrega la dirección del remitente a la whitelist
     */
    function addAddressToWhitelist() public {
        // Comprueba si el usuario ya ha sido incluido en la whitelist
        require(!whitelistedAddresses[msg.sender], "Sender has already been whitelisted");
        // Comprueba que el número de direcciones que están en la whitelist no pase del máximo permitido, si no es así, lanza un error
        require(numAddressesWhitelisted < maxWhitelistedAddresses, "More addresses cant be added, limit reached");
        // Agregue la dirección que llamó a la función al array whitelistedAddress
        whitelistedAddresses[msg.sender] = true;
        // Aumenta el número de direcciones de la whitelist
        numAddressesWhitelisted += 1;
    }
 
 
}