//SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;
import "./ItemManager.sol";
//
contract Item {
    uint public sv_priceInWei;
    uint public sv_pricePaid;
    uint public sv_index;
    ItemManager sv_parertSC;
    
    constructor (ItemManager _parentContract, uint _sv_priceInWei, uint _sv_index)  {
        sv_priceInWei = _sv_priceInWei;
        sv_parertSC = _parentContract;
        sv_index = _sv_index;

    } 

    receive() external payable{
        fallbackReceive();
    }

    fallback () external payable{
        fallbackReceive();
    }

    function fallbackReceive() internal {
        require(sv_pricePaid == 0, "Erro: item ja foi pago");
        require(sv_priceInWei == msg.value, "Erro: somente pagamento inteiro permitido");
        sv_pricePaid += msg.value;
        //Lowlevel, economiza gas. Essa função retorna o primeiro parametro bool, se foi sucesso ou nao e o segundo o retorno da função, nesse caso triggerPayment nao retorna nada
        (bool sucess,) = address(sv_parertSC).call{value: msg.value}(abi.encodeWithSignature("triggerPayment(uint256)", sv_index));
        //a mema função highlevel somente enviaria a grana mais sem chamada nenhuma de função 
        //payable(address(parentContract)).transfer(msg.value);
        require(sucess, "Erro: transacao cancelada");
    } 
}