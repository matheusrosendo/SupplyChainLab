const ItemManager = artifacts.require("./ItemManager.sol");

contract("ItemManager", accounts => {
    let lastItemIndex = -1;
    let lastItemAddress = "";
    let lastItemPrice = 0;
    //inserindo o primeiro item
    it("... sould be able to add an item", async  function(){
        const itemManagerInstance = await ItemManager.deployed();
        const itemName = "test";
        const itemPrice = 500;

        const result = await itemManagerInstance.createItem(itemName, itemPrice, {from: accounts[0]});
        lastItemIndex = parseInt(result.logs[0].args._itemIndex); 
        lastItemAddress = result.logs[0].args._address;

        console.log("ItemManager address: "+ItemManager.address);
        console.log("Item criado address: "+lastItemAddress);
        
        //garante que o primeiro item seja o 0
        assert.equal(lastItemIndex, 0, "It is not the first item, index = "+ lastItemIndex);

        const item = await itemManagerInstance.sv_items(0);
        //garante que o identificador é igual ao itemName
        assert.equal(item._identifier, itemName, "Idetificador diferente do inserido anteriormente")
        
        //garante que o item price seja o mesmo valor informado
        lastItemPrice = item._itemPrice;
        assert.equal(lastItemPrice, itemPrice, "Preço diferente do inserido anteriormente: "+lastItemPrice);
        
    });
    it("... sould be able to pay the created item", async  function(){
        
        await web3.eth.sendTransaction({from: accounts[1], to: lastItemAddress, value: lastItemPrice });
        
    });
    it("... sould be able to deliver the item", async  function(){
        
        const itemManagerInstance = await ItemManager.deployed();
        const result = await itemManagerInstance.triggerDelivery(lastItemIndex, {from: accounts[0]});
       
    });
    it("... the itemIndex must be 1", async function(){
        const itemManagerInstance = await ItemManager.deployed();
        const indexAtual = await itemManagerInstance.sv_itemIndex.call();
        assert.equal(indexAtual, 1, " item index deveria ser 1, mas retornou "+indexAtual);
    });
    it("... the status of the created item must be Delivered(2)", async function(){
        const itemManagerInstance = await ItemManager.deployed();
        const item = await itemManagerInstance.sv_items(0);
        assert.equal(item._state, 2, " item status deve ser 2(delivered), mas retornou "+item._state);
    });

    //inserindo um segundo item
    it("... sould be able to add one more item", async  function(){
        const itemManagerInstance = await ItemManager.deployed();
        const itemName = "test2";
        const itemPrice = 700;

        const result = await itemManagerInstance.createItem(itemName, itemPrice, {from: accounts[0]});
        lastItemIndex = parseInt(result.logs[0].args._itemIndex); 
        lastItemAddress = result.logs[0].args._address;

        console.log("ItemManager address: "+ItemManager.address);
        console.log("Item criado address: "+lastItemAddress);
        
        //garante que o segundo item seja o 1
        assert.equal(lastItemIndex, 1, "It is not the first item, index = "+ lastItemIndex);

        const item = await itemManagerInstance.sv_items(1);
        //garante que o identificador é igual ao itemName
        assert.equal(item._identifier, itemName, "Idetificador diferente do inserido anteriormente")
        
        //garante que o item price seja o mesmo valor informado
        lastItemPrice = item._itemPrice;
        assert.equal(lastItemPrice, itemPrice, "Preço diferente do inserido anteriormente: "+lastItemPrice);
        
    });
    it("... sould be able to pay the second item", async  function(){
        
        await web3.eth.sendTransaction({from: accounts[2], to: lastItemAddress, value: lastItemPrice });
        
    });
    it("... sould be able to deliver the second item", async  function(){
        
        const itemManagerInstance = await ItemManager.deployed();
        const result = await itemManagerInstance.triggerDelivery(lastItemIndex, {from: accounts[0]});
       
    });
    it("... the itemIndex must be 2", async function(){
        const itemManagerInstance = await ItemManager.deployed();
        const indexAtual = await itemManagerInstance.sv_itemIndex.call();
        assert.equal(indexAtual, 2, " item index deveria ser 2, mas retornou "+indexAtual);
    });
    it("... the status of the created item must be Delivered(2)", async function(){
        const itemManagerInstance = await ItemManager.deployed();
        const item = await itemManagerInstance.sv_items(1);
        assert.equal(item._state, 2, " item status deve ser 2(delivered), mas retornou "+item._state);
    });

})