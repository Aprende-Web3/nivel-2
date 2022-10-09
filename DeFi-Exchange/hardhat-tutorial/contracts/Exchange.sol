// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
 
 
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
 
 
contract Exchange is ERC20 {

    address public aw3DevTokenAddress;
 
   // Exchange hereda ERC20, porque nuestro intercambio realizaría un seguimiento de los tokens AW3 Dev LP
    constructor(address _AW3Devtoken) ERC20("AW3Dev LP Token", "AW3DLP") {
        require(_AW3Devtoken != address(0), "Token address passed is a null address");
        aw3DevTokenAddress = _AW3Devtoken;
    }
/**
* @dev Devuelve la cantidad de 'AW3 Dev Tokens' en poder del contrato
*/
function getReserve() public view returns (uint) {
    return ERC20(aw3DevTokenAddress).balanceOf(address(this));
}

/**
* @dev Agrega liquidez al intercambio.
*/
function addLiquidity(uint _amount) public payable returns (uint) {
    uint liquidity;
    uint ethBalance = address(this).balance;
    uint aw3DevTokenReserve = getReserve();
    ERC20 aw3DevToken = ERC20(aw3DevTokenAddress);
    /*
    Si la reserva está vacía, toma cualquier valor proporcionado por el usuario para
         Tokens `Ether` y `AW3 Dev` porque actualmente no hay una proporción
    */
    if(aw3DevTokenReserve == 0) {
        // Transferir el `aw3DevToken` de la cuenta del usuario al contrato
        aw3DevToken.transferFrom(msg.sender, address(this), _amount);
        // Tome el ethBalance actual y acumule la cantidad de tokens LP `ethBalance` para el usuario.
        // `liquidity` proporcionada es igual a `ethBalance` porque esta es la primera vez que el usuario
        // está agregando 'Eth' al contrato, por lo que cualquier contrato 'Eth' que tenga es igual al suministrado
        // Por el usuario en la llamada actual `addLiquidity`
        // Los tokens de `liquidity` que deben acuñarse para el usuario en la llamada `addLiquidity` siempre deben ser proporcionales
        // Al Eth especificado por el usuario.
        liquidity = ethBalance;
        _mint(msg.sender, liquidity);
        // _mint es la función de contrato inteligente ERC20.sol para acuñar tokens ERC20
    } else {
        /*
           Si la reserva no está vacía, toma cualquier valor proporcionado por el usuario para
             `Ether` y determine según la proporción cuántos tokens `AW3 Dev`
             deben suministrarse para evitar grandes impactos en los precios debido a la
             liquidez
        */
        // EthReserve debe ser el ethBalance actual restado por el valor de ether enviado por el usuario
        // en la llamada `addLiquidity` actual
        uint ethReserve =  ethBalance - msg.value;
        // La relación siempre debe mantenerse para que no haya grandes impactos en los precios al agregar liquidez
        // La relación aquí es -> (aw3DevTokenAmount que el usuario puede agregar/aw3DevTokenReserve en el contrato) = (Eth enviado por el usuario/Eth Reserve en el contrato);
        // Entonces, haciendo algunos cálculos, (aw3DevTokenAmount que el usuario puede agregar) = (Eth Enviado por el usuario * aw3DevTokenReserve /Eth Reserve);
        uint aw3DevTokenAmount = (msg.value * aw3DevTokenReserve)/(ethReserve);
        require(_amount >= aw3DevTokenAmount, "Amount of tokens sent is less than the minimum tokens required");
        // transfiera solo (aw3DevTokenAmount que el usuario puede agregar) la cantidad de "tokens de AW3 Dev" de la cuenta de los usuarios
        // al contrato
        aw3DevToken.transferFrom(msg.sender, address(this), aw3DevTokenAmount);
         // La cantidad de tokens LP que se enviaría al usuario debe ser proporcional a la liquidez de
         // ether añadido por el usuario
         // La proporción que se debe mantener aquí es ->
         // (LP tokens a enviar al usuario (liquidez)/ oferta total de LP tokens en contrato) = (Eth enviado por el usuario)/(Eth reserva en contrato)
         // por algunas matemáticas -> liquidez = (Suministro total de tokens LP en contrato * (Eth enviado por el usuario))/(Eth reserva en el contrato)
        liquidity = (totalSupply() * msg.value)/ ethReserve;
        _mint(msg.sender, liquidity);
    }
     return liquidity;
}
/**
* @dev Devuelve la cantidad de tokens Eth/AW3 Dev que se devolverían al usuario
* en el intercambio
*/
function removeLiquidity(uint _amount) public returns (uint , uint) {
    require(_amount > 0, "_amount should be greater than zero");
    uint ethReserve = address(this).balance;
    uint _totalSupply = totalSupply();
     // La cantidad de Eth que se devolvería al usuario se basa
     // en una proporción
     // La relación es -> (Eth devuelto al usuario) / (reserva de Eth actual)
     // = (cantidad de tokens LP que el usuario desea retirar) / (suministro total de tokens LP)
     // Luego, por algunas matemáticas -> (Eth enviado de vuelta al usuario)
     // = (reserva Eth actual * cantidad de tokens LP que el usuario desea retirar) / (suministro total de tokens LP)
    uint ethAmount = (ethReserve * _amount)/ _totalSupply;
     // La cantidad de token AW3 Dev que se devolvería al usuario se basa
     // en una proporción
     // La proporción es -> (AW3 Dev devuelto al usuario) / (reserva de token AW3 Dev actual)
     // = (cantidad de tokens LP que el usuario desea retirar) / (suministro total de tokens LP)
     // Luego, por algunas matemáticas -> (AW3 Dev devuelto al usuario)
     // = (reserva actual de tokens AW3 Dev * cantidad de tokens LP que el usuario desea retirar) / (suministro total de tokens LP)
    uint aw3DevTokenAmount = (getReserve() * _amount)/ _totalSupply;
     // Quemar los tokens LP enviados desde la billetera del usuario porque ya se enviaron para
     // quitar liquidez
    _burn(msg.sender, _amount);
   // Transferir `ethAmount` de Eth del contrato a la billetera del usuario
    payable(msg.sender).transfer(ethAmount);
  // Transferir `aw3DevTokenAmount` de tokens AW3 Dev del contrato a la billetera del usuario
    ERC20(aw3DevTokenAddress).transfer(msg.sender, aw3DevTokenAmount);
    return (ethAmount, aw3DevTokenAmount);
}

/**
* @dev Devuelve la cantidad de tokens Eth/AW3 Dev que se devolverían al usuario
* en el intercambio
*/
function getAmountOfTokens(
    uint256 inputAmount,
    uint256 inputReserve,
    uint256 outputReserve
) public pure returns (uint256) {
    require(inputReserve > 0 && outputReserve > 0, "invalid reserves");
     // Estamos cobrando una tarifa de `1%`
     // Importe de entrada con tarifa = (monto de entrada - (1*(monto de entrada)/100)) = ((monto de entrada)*99)/100
    uint256 inputAmountWithFee = inputAmount * 99;
     // Porque necesitamos seguir el concepto de la curva `XY = K`
     // Necesitamos asegurarnos de que (x + Δx) * (y - Δy) = x * y
     // Así que la fórmula final es Δy = (y * Δx) / (x + Δx)
     // Δy en nuestro caso es `tokens a recibir`
     // Δx = ((cantidad de entrada)*99)/100, x = reserva de entrada, y = reserva de salida
     // Entonces, al poner los valores en las fórmulas, puede obtener el numerador y el denominador
    uint256 numerator = inputAmountWithFee * outputReserve;
    uint256 denominator = (inputReserve * 100) + inputAmountWithFee;
    return numerator / denominator;
}
/**
* @dev cambia Eth por tokens AW3Dev
*/
function ethToAW3DevToken(uint _minTokens) public payable {
    uint256 tokenReserve = getReserve();
     // llama a `getAmountOfTokens` para obtener la cantidad de tokens AW3 Dev
     // que sería devuelto al usuario después del intercambio
     // Note que la `inputReserve` que estamos enviando es igual a
     // `address(this).balance - msg.value` en lugar de solo `address(this).balance`
     // porque `address(this).balance` ya contiene el `msg.value` que el usuario ha enviado en la llamada dada
     // así que necesitamos restarlo para obtener la reserva de entrada real
    uint256 tokensBought = getAmountOfTokens(
        msg.value,
        address(this).balance - msg.value,
        tokenReserve
    );
 
 
    require(tokensBought >= _minTokens, "insufficient output amount");
  // Transfiere los tokens `AW3 Dev` al usuario
    ERC20(aw3DevTokenAddress).transfer(msg.sender, tokensBought);
}
/**
* @dev intercambia tokens AW3Dev por Eth
*/
function aw3DevTokenToEth(uint _tokensSold, uint _minEth) public {
    uint256 tokenReserve = getReserve();
     // llamar a `getAmountOfTokens` para obtener la cantidad de Eth
     // que sería devuelto al usuario después del intercambio
    uint256 ethBought = getAmountOfTokens(
        _tokensSold,
        tokenReserve,
        address(this).balance
    );
    require(ethBought >= _minEth, "insufficient output amount");
 // Transferir tokens `AW3 Dev` desde la dirección del usuario al contrato
    ERC20(aw3DevTokenAddress).transferFrom(
        msg.sender,
        address(this),
        _tokensSold
    );
 // enviar `ethBought` al usuario desde el contrato
    payable(msg.sender).transfer(ethBought);
}

}