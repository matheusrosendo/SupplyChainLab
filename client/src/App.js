import React, { Component } from "react";
import getWeb3 from "./getWeb3";
import "./App.css";
import ItemManagerContract from "./contracts/ItemManager.json";

class App extends Component {
  state = {cost: 0, itemName: "exemploItem1", loaded:false, itemManagerInstance:0};
  createdItem = {price: 0, addressItem:"", index:0};
  
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
      
      //atualiza tabela com itens do contrato em questao
      await this.fillTableItems();
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  //tentativa de alteração de contas
 /*  changeAccountListener = () =>{
    //caso usuario mude a conta na metamask atualiza web3 e accounts
    window.ethereum.on('accountsChanged', async function (accounts) {
      //this.accounts = accounts; 
      console.log(accounts[0]);
    })
  } */
  
  /**
   * Escutador do event do tipo SupplyChainStep, chamado a cada novo emit automaticamente
   */
  listenToContractEvent = () => {
    let self = this;
    this.itemManagerInstance.events.SupplyChainStep().on("data", async function(evt) {
      let infoSpan = document.getElementById("info");
      let item = await self.itemManagerInstance.methods.sv_items(evt.returnValues._itemIndex).call();
      
      //verifica o retorno do evento 0 = Created, 1 = Paid, 2 = Delivered
      switch (parseInt(evt.returnValues[1])) {
        case 0: 
          infoSpan.innerHTML = "Item Criado: "+item._identifier+ " Faça o pagamento";
          //atualiza dados do item recem criado apartir do event emitido
          self.createdItem = {price:self.state.cost, addressItem:evt.returnValues[2], index: evt.returnValues._itemIndex};
          document.getElementById("botaoPagar").style.visibility = "visible";
          document.getElementById("botaoCreate").style.visibility = "hidden";   
        break;
        case 1:
          infoSpan.innerHTML = "Item Pago: "+item._identifier+ " Faça o envio";
          document.getElementById("botaoEnviar").style.visibility = "visible"; 
          document.getElementById("botaoPagar").style.visibility = "hidden";   
        break;
        case 2:
          infoSpan.innerHTML = "Item Enviado: "+item._identifier;
          document.getElementById("botaoEnviar").style.visibility = "hidden"; 
          document.getElementById("botaoPagar").style.visibility = "hidden";
          document.getElementById("botaoCreate").style.visibility = "visible";    
        break;
        default:
          infoSpan.innerHTML = "nada retornado ainda";
      }
      self.atualizaHash(evt.transactionHash); 
      self.fillTableItems();
      console.log(evt);
    });
  }

  fillTableItems = async () => {
     //let address = ItemManagerContract.networks[networkId].address;
     let createdItems = document.getElementById("createdItems");
     let indexAtual = await this.itemManagerInstance.methods.sv_itemIndex().call();
     
     let tabela = "<table data-vertable='ver1'><tr><th>Item </th><th>Price</th><th>State</th><th>Adress</th></tr>";
     for(let i = 0; i < indexAtual; i++){
        let item = await this.itemManagerInstance.methods.sv_items(i).call();
        tabela += "<tr><td>"+item._identifier+"</td><td>"+item._itemPrice+"</td><td>"+this.getState(item._state)+"</td><td>"+item._item+"</td></tr>";
     }
     tabela += "</table>"
     createdItems.innerHTML = tabela;
  }

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
   * Atualiza os valores durante digitação
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
   * Ação do botao create
   */
  handleSubmitCreate = async() => {
    const {cost, itemName} = this.state;
    let result = await this.itemManagerInstance.methods.createItem(itemName, cost).send({from: this.accounts[0]});
    this.atualizaHash(result.transactionHash);
  }

  
  /**
   * Ação do botao pagar
   */
  handleSubmitPay = async() => {
    const {price, addressItem} = this.createdItem;
    let result = await this.web3.eth.sendTransaction({from: this.accounts[0], to: addressItem, value: price });
    this.atualizaHash(result.transactionHash);
  }

  
  /**
   * Ação do botao enviar
   */
  handleSubmitDeliver = async() => {
    let result = await this.itemManagerInstance.methods.triggerDelivery(this.createdItem.index).send({from: this.accounts[0]});
    this.atualizaHash(result.transactionHash);
  }

  /**
   * Informa Hash Hate  
   */
  atualizaHash = (hash) => {
    document.getElementById("transaction").innerHTML = "Hash Transação = " + hash;
  }

  render() {
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
                <button type="button" className="submitApagado" id="botaoPagar"  onClick={this.handleSubmitPay}>Pagar</button>
                <button type="button" className="submitApagado" id="botaoEnviar"  onClick={this.handleSubmitDeliver}>Enviar</button>
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
