//SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;
import "./Item.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
//
contract ItemManager is Ownable {
    

    enum SupplyChainState{
        Created, Paid, Delivered
    }

    struct S_item {
        string _identifier;
        uint _itemPrice;
        SupplyChainState _state;
        Item _item;
    }

    mapping (uint => S_item) public sv_items;
    uint public sv_itemIndex;
    
    event SupplyChainStep(uint _itemIndex, uint _step, address _address);

    function createItem(string memory _identifier, uint _itemPrice) public onlyOwner {
        Item item = new Item(this, _itemPrice, sv_itemIndex);
        sv_items[sv_itemIndex] = S_item(_identifier, _itemPrice, SupplyChainState.Created, item);
        emit SupplyChainStep(sv_itemIndex, uint(sv_items[sv_itemIndex]._state), address(item));
        sv_itemIndex++;
    }

    function triggerPayment(uint _itemIndex) public payable {
        require(sv_items[_itemIndex]._state == SupplyChainState.Created, "Erro: item ja foi pago ou entregue!");
        require(sv_items[_itemIndex]._itemPrice == msg.value, "Erro: valor incorreto!");
        sv_items[_itemIndex]._state = SupplyChainState.Paid;
        emit SupplyChainStep(_itemIndex, uint(sv_items[_itemIndex]._state), address(sv_items[_itemIndex]._item));
    }

    function triggerDelivery(uint _itemIndex) public onlyOwner {
        require(sv_items[_itemIndex]._state == SupplyChainState.Paid, "Erro: item ainda nao foi pago!");
        sv_items[_itemIndex]._state = SupplyChainState.Delivered;
        emit SupplyChainStep(_itemIndex, uint(sv_items[_itemIndex]._state), address(sv_items[_itemIndex]._item));
    }

    function renounceOwnership() public view override onlyOwner {
        revert("can't renounceOwnership here");
    }


}