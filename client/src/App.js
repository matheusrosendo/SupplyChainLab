import React, { Component } from "react";
import getWeb3 from "./getWeb3";
import "./App.css";
import ItemManagerContract from "./contracts/ItemManager.json";

class App extends Component {
  state = {cost: 1000, itemName: "exampleItem1", loaded:false, itemManagerInstance:0};
  createdItem = {price: 0, addressItem:"", index:0};
  
  //put the instance in a window to be acessed externaly
  constructor(props) {
      super(props);
      window.reactInstance = this;
  }

  
  componentDidMount = async () => {
    try {
      
      // Get network provider and web3 instance.
      this.web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      this.accounts = await this.web3.eth.getAccounts();

      // Get the networkId
      const networkId = await this.web3.eth.net.getId();

      // Get the contract instance.
      this.itemManagerInstance = new this.web3.eth.Contract(
        ItemManagerContract.abi,
        ItemManagerContract.networks[networkId] && ItemManagerContract.networks[networkId].address,
      );

      // Turn on the contract event listener
      this.listenToContractEvent();

      //Set actual state  
      this.setState({ loaded:true, itemManagerInstance:this.itemManagerInstance });
      
      //updates table items
      await this.fillTableItems();
      
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

 
  /**
   * Listener of the events typed SupplyChainStep, called automatically every new emit is done
   */
  listenToContractEvent = () => {
    let self = this;
    this.itemManagerInstance.events.SupplyChainStep().on("data", async function(evt) {
      let infoSpan = document.getElementById("info");
      let item = await self.itemManagerInstance.methods.sv_items(evt.returnValues._itemIndex).call();
      
      //verify return = Created, 1 = Paid, 2 = Delivered
      switch (parseInt(evt.returnValues[1])) {
        case 0: 
          infoSpan.innerHTML = "Item created: "+item._identifier+ ". Now pay it!";
          //updates created Item data according to emit values
          self.createdItem = {price:self.state.cost, addressItem:evt.returnValues[2], index: evt.returnValues._itemIndex};
        break;
        case 1:
          infoSpan.innerHTML = "Item paid: "+item._identifier+ ". Now deliver it!";
        break;
        case 2:
          infoSpan.innerHTML = "Item delivered: "+item._identifier+ ". Well done!";  
        break;
        default:
          infoSpan.innerHTML = "error: no returned status";
      }
      self.atualizaHash(evt.transactionHash); 
      self.fillTableItems();
      console.log(evt);
    });
  }

 
  /**
   * update <table> with Items from the current ItemManager SC
   */
  fillTableItems = async () => {
    //let address = ItemManagerContract.networks[networkId].address;
    let createdItems = document.getElementById("createdItems");
    let indexAtual = await this.itemManagerInstance.methods.sv_itemIndex().call();
    
    let tabela = "<table data-vertable='ver1'><tr><th>Item </th><th>Price</th><th>State</th><th>Adress</th><th>Action</th></tr>";
    for(let i = 0; i < indexAtual; i++){
       let item = await this.itemManagerInstance.methods.sv_items(i).call();
       let actionButton = this.mountButton(i, item);
       tabela += "<tr><td>"+item._identifier+"</td><td>"+item._itemPrice+"</td><td>"+this.getState(item._state)+"</td><td>"+item._item+"</td><td>"+actionButton+"</td></tr>";
    }
    tabela += "</table>"
    createdItems.innerHTML = tabela;
 }

  /**
   * renders buton and action Delivery or Pay according to parameters
   * @param {*} indexItem 
   * @param {*} _item 
   * @returns 
   */
  mountButton = (indexItem, _item) =>{
    let button = "";
    switch (parseInt(_item._state)) {
      case 0: 
        button = "<button onclick=\"window.reactInstance.handleItemPay('"+_item._item+"', "+_item._itemPrice+")\">Pay</button>";
      break;
      case 1: 
      button = "<button onclick=\"window.reactInstance.handleItemDeliver("+indexItem+")\">Deliver</button>";
      break;
      default: 
        button = " ";
      break;
    }
    return button;
  }
  
  /**
   * 
   * @param {*} indexState 
   * @returns String ith corresponding State
   */
  getState = (indexState) =>{
    let status = "";
    switch (parseInt(indexState)) {
      case 0: 
        status = "Created";
      break;
      case 1: 
        status = "Paid";
      break;
      case 2: 
        status = "Delivered";
      break;
      default: 
        status = "Error";
      break;
    }
    return status;
  }

  /**
   * Update values while typing
   * @param {*} event 
   */
  handleInputChange = (event) => {
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    const name = target.name;
    this.setState({
      [name]: value
    });
  }

  /**
   * Button create action
   */
  handleSubmitCreate = async() => {
    const {cost, itemName} = this.state;
    let result = await this.itemManagerInstance.methods.createItem(itemName, cost).send({from: this.accounts[0]});
    this.atualizaHash(result.transactionHash);
  }

  
  /**
   * Button pay action
   */
  handleItemPay = async(_address, _price) => {
    let result = await this.web3.eth.sendTransaction({from: this.accounts[0], to: _address, value: _price });
    this.atualizaHash(result.transactionHash);
  }

  
  /**
   * Button delivery action
   */
  handleItemDeliver = async(_indexItem) => {
    let result = await this.itemManagerInstance.methods.triggerDelivery(_indexItem).send({from: this.accounts[0]});
    this.atualizaHash(result.transactionHash);
  }

  /**
   * Inform Hash Hate  
   */
  atualizaHash = (hash) => {
    document.getElementById("transaction").innerHTML = "Hash Transação = " + hash;
  }

  
  /**
   * React Render Function 
   * @returns 
   */
  render =  () =>{
    console.log("table items");
    console.log(this.tableItems);

    if (!this.state.loaded) {
      return <div className="plaintext">Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div>
        <span id="carteira" className="plaintext">Conected wallet: {this.accounts[0]}</span>
          <div className="warning" id="info"> <br></br> </div>
          <div className="warning" id="transaction"> <br></br></div>
        <div className="container">
          
          <div className="one">
            <div className="form">
              
              <div className="title">Event Trigger / Supply chain lab!</div>        
              <div className="subtitle">Add Items</div>
              
              <div className="input-container ic1">
                <input id="firstname" className="input" type="text" placeholder=" "  name="cost" value={this.state.cost} onChange={this.handleInputChange} />
                <div className="cut"></div>
                <label className="placeholder">Cost in wei</label>
              </div>
              <div className="input-container ic2">
                <input id="lastname" className="input" type="text" placeholder=" " name="itemName" value={this.state.itemName} onChange={this.handleInputChange}/>
                <div className="cut"></div>
                <label  className="placeholder">Item Identifier</label>
              </div>
                <button type="button" className="submit" id="botaoCreate" onClick={this.handleSubmitCreate}>Create new item</button>
            </div>
          </div>
          <div className="two">
            <div className="table100 ver1 m-b-110" id="createdItems"> 

            </div>
            
          </div>
          
        </div>
      </div>
    );
  }
}


export default App;
