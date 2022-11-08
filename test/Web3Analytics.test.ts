import { expect } from "chai";
import { ethers } from "hardhat";
import { Web3 } from "hardhat";
import { RelayProvider } from "@opengsn/provider";
import { GsnTestEnvironment } from '@opengsn/dev'; 
import { ContractFactory, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import Web3Analytics from "../artifacts/contracts/Web3Analytics.sol/Web3Analytics.json";


//import Web3AnalyticsPaymaster from "../artifacts/contracts/Web3AnalyticsPaymaster.sol/Web3AnalyticsPaymaster.json";
//import TestPaymasterEverythingAccepted from "@opengsn/cli/dist/compiled/TestPaymasterEverythingAccepted.json";
import RelayHub from "@opengsn/cli/dist/compiled/RelayHub.json";
//import Forwarder from "@opengsn/cli/dist/compiled/Forwarder.json";
//import TestForwarder from "@opengsn/cli/dist/compiled/TestForwarder.json";
//import { registerForwarderForGsn } from '@opengsn/common/dist/EIP712/ForwarderUtil'
//const Web3HttpProvider = require( 'web3-providers-http')


const hre = require("hardhat");


describe("Web3Analytics", function () {

  // Configure our contract for GSN on ethereum mainnet
  let relayHub = '0x6C28AfC105e65782D9Ea6F2cA68df84C9e7d750d';
  let trustedForwarder = '0xdA78a11FD57aF7be2eDD804840eA7f4c2A38801d';

  let owner:SignerWithAddress;
  let addr1:SignerWithAddress;
  let addr2:SignerWithAddress;
  let addr3:SignerWithAddress;
  let addr4:SignerWithAddress;
  let addr5:SignerWithAddress;
  let addr6:SignerWithAddress;
  let addr7:SignerWithAddress;
  let addr8:SignerWithAddress;
  let addrs:Array<SignerWithAddress>;
  let managerAddrs:Array<String>;  

  let Web3AnalyticsContractFactory:ContractFactory;
  let web3Analytics:Contract;
  let Web3AnalyticsPaymasterContractFactory:ContractFactory;
  let web3AnalyticsPaymaster:Contract;

  
  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, ...addrs] = await ethers.getSigners();

    // Deploy main contract
    Web3AnalyticsContractFactory = await ethers.getContractFactory("Web3Analytics");
    web3Analytics = await Web3AnalyticsContractFactory.deploy(trustedForwarder);
    await web3Analytics.deployed();

  });


  it("Allows setting and getting trusted paymaster", async function () {
    // check initial address for trusted paymaster
    expect (await web3Analytics.connect(addr1).getTrustedPaymaster())
      .to.equal(ethers.constants.AddressZero);

    // Deploy paymaster contract   
    Web3AnalyticsPaymasterContractFactory = await ethers.getContractFactory("Web3AnalyticsPaymaster");
    web3AnalyticsPaymaster = await Web3AnalyticsPaymasterContractFactory.deploy();
    await web3AnalyticsPaymaster.deployed();

    // make sure only owner can set trusted paymaster
    await expect(web3Analytics.connect(addr1).setTrustedPaymaster(web3AnalyticsPaymaster.address)).
      to.be.revertedWith('Ownable: caller is not the owner');
      
    // verify owner can correctly set trusted paymaster
    await web3Analytics.connect(owner).setTrustedPaymaster(web3AnalyticsPaymaster.address)
    expect (await web3Analytics.connect(addr1).getTrustedPaymaster())
      .to.equal(web3AnalyticsPaymaster.address);  

  });


  it("Allows setting and getting network fee", async function () {
    // check initial fee
    expect (await web3Analytics.connect(addr1).getNetworkFee())
      .to.equal(0);

    const feeInBasisPoints = 1000;

    // make sure only owner can set trusted paymaster
    await expect(web3Analytics.connect(addr1).setNetworkFee(feeInBasisPoints)).
      to.be.revertedWith('Ownable: caller is not the owner');
      
    // verify owner can correctly set fee in basis points
    await web3Analytics.connect(owner).setNetworkFee(feeInBasisPoints)
    expect (await web3Analytics.connect(addr1).getNetworkFee())
      .to.equal(feeInBasisPoints);  

  });


  it("Allows new app to register", async function () {
    const app = "My App";
    const url = "https://myapp.xyz";
    await web3Analytics.connect(addr1).registerApp(app, url);
    expect(await web3Analytics.connect(owner).isAppRegistered(addr1.address)).to.equal(true);

    const {appAddress, appName, appUrl} = await web3Analytics.getAppData(addr1.address);
    expect(appAddress).to.equal(addr1.address);
    expect(appName).to.equal(app);
    expect(appUrl).to.equal(url);

    //Verify we can register without app url
    await web3Analytics.connect(addr2).registerApp(app, '');
    expect(await web3Analytics.connect(owner).isAppRegistered(addr2.address)).to.equal(true);
    const {appAddress:address1, appName:name1, appUrl:url1} = await web3Analytics.getAppData(addr2.address);
    expect(address1).to.equal(addr2.address);
    expect(name1).to.equal(app);
    expect(url1).to.equal('');

    //Verify app name is required
    await expect(web3Analytics.connect(addr3).registerApp('', '')).
    to.be.revertedWith('Name is required');

  });

  it("Allows updating app information", async function () {
    const app = "My App";
    const url = "https://myapp.xyz";
    await web3Analytics.connect(addr1).registerApp(app, url);

    const app1 = "My Updated App";
    const url1 = "https://myapp.xyz/updated";
    await web3Analytics.connect(addr1).updateAppData(app1, url1);

    const {appAddress, appName, appUrl} = await web3Analytics.getAppData(addr1.address);
    expect(appAddress).to.equal(addr1.address);
    expect(appName).to.equal(app1);
    expect(appUrl).to.equal(url1);

    //Verify app name is required
    await expect(web3Analytics.connect(addr1).updateAppData('', '')).
    to.be.revertedWith('Name is required');

    //Verify app must be registered
    await expect(web3Analytics.connect(addr2).updateAppData('Test', '')).
    to.be.revertedWith('App not registered');
  });

  it("Correctly tops up and checks balance for apps", async function () {
    await web3Analytics.connect(addr1).registerApp("My App", "https://myapp.xyz");
    expect(await web3Analytics.getBalance(addr1.address)).to.equal(0);
    await web3Analytics.topUpBalance(addr1.address, {value: ethers.utils.parseEther("1.0")});
    expect(await web3Analytics.getBalance(addr1.address)).to.equal(ethers.utils.parseEther("1.0"));
  });

  it("Allows new users to register for app", async function () {
    await web3Analytics.connect(addr1).registerApp("My App", "https://myapp.xyz");
    await web3Analytics.topUpBalance(addr1.address, {value: ethers.utils.parseEther("1.0")});

    // Register new user for app
    const did = 'did:key:zQ3shduQ4GNWTMTcbwvnF8azrxrYS1kt2FasSXtf3vHyTioMU'
    await web3Analytics.connect(addr2).addUser(did, addr1.address);

    // Verify we can't register a user for unregistered app
    await expect(web3Analytics.connect(addr2).addUser(did, addr3.address)).
    to.be.revertedWith('App not registered');

    // Get list of users and regsitrations for app
    const users = await web3Analytics.connect(addr2).getUsers(addr1.address);
    const registrations = await web3Analytics.connect(addr2).getUserRegistrations(addr1.address);

    // Verify user was added correctly
    expect(users[0]).to.equal(addr2.address);
    expect(registrations[0].userAddress).to.equal(addr2.address);
    expect(registrations[0].userDid).to.equal(did);

    // Verify we can't add user twice
    await expect(web3Analytics.connect(addr2).addUser(did, addr1.address)).
    to.be.revertedWith('User already exists');

    // Check if a given user is registered for an app
    expect(await web3Analytics.connect(addr2).isUserRegistered(addr1.address, addr2.address)).to.equal(true);
    expect(await web3Analytics.connect(addr3).isUserRegistered(addr1.address, addr3.address)).to.equal(false);
  });

  it("Return correct count of apps and app users", async function () {
    // Check count for apps
    expect(await web3Analytics.getAppCount()).to.equal(0);
    await web3Analytics.connect(addr1).registerApp("My App", "https://myapp.xyz");
    await web3Analytics.topUpBalance(addr1.address, {value: ethers.utils.parseEther("1.0")});
    await web3Analytics.connect(addr2).registerApp("My App", "https://myapp.xyz");
    await web3Analytics.topUpBalance(addr2.address, {value: ethers.utils.parseEther("1.0")});
    await web3Analytics.connect(addr3).registerApp("My App", "https://myapp.xyz");
    await web3Analytics.topUpBalance(addr3.address, {value: ethers.utils.parseEther("1.0")});
    expect(await web3Analytics.getAppCount()).to.equal(3);

    // Check count for users (we re-use did b/c it's verified off chain by indexer)
    const did = 'did:key:zQ3shduQ4GNWTMTcbwvnF8azrxrYS1kt2FasSXtf3vHyTioMU'
    expect(await web3Analytics.getUserCount(addr2.address)).to.equal(0);
    await web3Analytics.connect(addr4).addUser(did, addr2.address);
    await web3Analytics.connect(addr5).addUser(did, addr2.address);
    await web3Analytics.connect(addr6).addUser(did, addr2.address);
    await web3Analytics.connect(addr7).addUser(did, addr2.address);
    await web3Analytics.connect(addr8).addUser(did, addr2.address);
    expect(await web3Analytics.getUserCount(addr2.address)).to.equal(5);

  });

  it("Returns correct list of apps", async function () {
    await web3Analytics.connect(addr1).registerApp("My App", "https://myapp.xyz");
    await web3Analytics.connect(addr2).registerApp("My App", "https://myapp.xyz");
    const apps = await web3Analytics.getApps();
    expect(apps).to.include("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
    expect(apps).to.include("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC");
    expect(apps).to.not.include("0x90f79bf6eb2c4f870365e785982e1f101e93b906");
  });


  it("Allows users to register gas free via GSN (v3) using accept everything paymaster", async function () {
    let env = await GsnTestEnvironment.startGsn('localhost'); // `npx hardhat node` must be running
    const { 
      forwarderAddress,
      paymasterAddress,
    } = env.contractsDeployment;
    //console.log(env.contractsDeployment);

    const web3provider = new Web3.providers.HttpProvider('http://localhost:8545');
    const factory = new ethers.ContractFactory(
      Web3Analytics.abi, 
      Web3Analytics.bytecode, 
      owner
    )

    const web3a = await factory.deploy(forwarderAddress)
    await web3a.deployed()

    await web3a.connect(owner).registerApp("My App", "https://myapp.xyz");
    expect(await web3a.getAppCount()).to.equal(1);


    const conf = { 
      paymasterAddress: paymasterAddress,
      loggerConfiguration: {
        logLevel: "error"
      }
    };

    const gsnProvider = await RelayProvider.newProvider(
      {provider: web3provider as any, config: conf as any}
    );
    await gsnProvider.init();
    

    const account = ethers.Wallet.createRandom();
    gsnProvider.addAccount(account.privateKey);
    const from = account.address;
    const etherProvider = new ethers.providers.Web3Provider(gsnProvider as any);

    
    expect(await web3a.isTrustedForwarder(forwarderAddress)).to.equal(true);


    const did = 'did:key:zQ3shduQ4GNWTMTcbwvnF8azrxrYS1kt2FasSXtf3vHyTioMU'
    const txn = await web3a.connect(etherProvider.getSigner(from)).addUser(
      did, 
      owner.address, 
      {gasLimit: 1e6}
    );
    //console.log(txn);

    expect(await web3a.getUserCount(owner.address)).to.equal(1);

    await GsnTestEnvironment.stopGsn()
  });

  
  it("Allows users to register gas free via GSN (v3) using Web3Analytics paymaster", async function () {
    let env = await GsnTestEnvironment.startGsn('localhost'); // `npx hardhat node` must be running
    const { 
      forwarderAddress,
      relayHubAddress
    } = env.contractsDeployment;
    //console.log(env.contractsDeployment);

    const web3provider = new Web3.providers.HttpProvider('http://localhost:8545');

    // Deploy paymaster contract   
    Web3AnalyticsPaymasterContractFactory = await ethers.getContractFactory("Web3AnalyticsPaymaster");
    web3AnalyticsPaymaster = await Web3AnalyticsPaymasterContractFactory.deploy();
    await web3AnalyticsPaymaster.deployed();
    
    // Deploy main contract
    const web3acf = await ethers.getContractFactory("Web3Analytics");
    const web3a = await web3acf.deploy(forwarderAddress as any);
    await web3a.deployed();

    // Configure Paymaster
    await web3AnalyticsPaymaster.setTarget(web3a.address);
    await web3AnalyticsPaymaster.setRelayHub(relayHubAddress);
    await web3AnalyticsPaymaster.setTrustedForwarder(forwarderAddress);

    // Confirm values correctly set
    expect(await web3AnalyticsPaymaster.getRelayHub()).to.equal(relayHubAddress);
    expect(await web3AnalyticsPaymaster.getTrustedForwarder()).to.equal(forwarderAddress);
    expect(await web3a.isTrustedForwarder(forwarderAddress as any)).to.equal(true);
    expect(await web3AnalyticsPaymaster.ourTarget()).to.equal(web3a.address);


    // Fund paymaster
    await owner.sendTransaction({
      from: owner.address,
      to: web3AnalyticsPaymaster.address, 
      value: ethers.utils.parseEther("5.0"),
      gasLimit: 1e6
    }); 


    // Confirm we can create app successfully
    await web3a.connect(owner).registerApp("My App", "https://myapp.xyz");
    expect(await web3a.getAppCount()).to.equal(1);


    // Configure RelayProvider
    const conf = { 
      paymasterAddress: web3AnalyticsPaymaster.address,
      loggerConfiguration: {
        logLevel: "error"
      }
    };

    const gsnProvider = await RelayProvider.newProvider(
      {provider: web3provider as any, config: conf as any}
    );
    await gsnProvider.init();
    

    // generate account to process transaction from
    const account = ethers.Wallet.createRandom();
    gsnProvider.addAccount(account.privateKey);
    const from = account.address;
    const etherProvider = new ethers.providers.Web3Provider(gsnProvider as any);


    const did = 'did:key:zQ3shduQ4GNWTMTcbwvnF8azrxrYS1kt2FasSXtf3vHyTioMU'

    // verify rejection for methods that are not approved
    await expect(web3a.connect(etherProvider.getSigner(from)).addUser(
      did, 
      owner.address, 
      {gasLimit: 1e6}
    )).to.eventually.be.rejectedWith("method not whitelisted");


    // whitelist addUser method
    const ABI = [ "function addUser(string did, address app)" ];
    const iface = new ethers.utils.Interface(ABI);
    const web3AnalyticsEncoded = iface.encodeFunctionData("addUser", [did, owner.address]);    
    await web3AnalyticsPaymaster.connect(owner).whitelistMethod(
      web3a.address, web3AnalyticsEncoded.substring(0, 10), true
    )
    
    // verify transaction is rejected if app balance is too low
    await expect(web3a.connect(etherProvider.getSigner(from)).addUser(
      did, 
      owner.address, 
      {gasLimit: 1e6}
    )).to.eventually.be.rejectedWith("insufficient app balance");

    // top up account balance for test app
    await web3a.topUpBalance(owner.address, {value: ethers.utils.parseEther("1.0")});
    const appBalance = await web3a.getBalance(owner.address);

    // set trusted paymaster
    await web3a.connect(owner).setTrustedPaymaster(web3AnalyticsPaymaster.address)
    const trustedPaymaster = await web3a.connect(addr1).getTrustedPaymaster()
    expect(trustedPaymaster).to.equal(web3AnalyticsPaymaster.address);  


    // process add user transaction using opengsn when network fee is 0
    const txn = await web3a.connect(etherProvider.getSigner(from)).addUser(
      did, 
      owner.address, 
      {gasLimit: 1e6}
    );
    //console.log(txn);

    // get fee charged from event logs
    let receipt = await txn.wait();
    const abi = [ "event FeeCharged(uint256 baseFee, uint256 networkFee, uint256 totalFee)" ];
    const myIface = new ethers.utils.Interface(abi);
    const log = myIface.parseLog(receipt.logs[0]);
    const {baseFee, networkFee, totalFee} = log.args;

    // verify that network fee is zero and baseFee = totalFee
    expect(baseFee).to.equal(totalFee);
    expect(networkFee).to.equal(0);

    // verify that new balance = old balance - fee
    const newbalance = appBalance.sub(totalFee)
    expect(await web3a.getBalance(owner.address)).to.equal(newbalance);
    
    // verify that addUser txn was actually processed
    expect(await web3a.getUserCount(owner.address)).to.equal(1);


    // set network fee of 10%
    const feeInBasisPoints = 1000;
    await web3a.connect(owner).setNetworkFee(feeInBasisPoints)

    // set gasUsedByPost of 16384 - calculated w/ gasleft()
    const gasUsedByPost = 16384;
    await web3AnalyticsPaymaster.connect(owner).setPostGasUsage(gasUsedByPost)


    // set up another opengsn transaction to make sure new network fee works
    const newAccount = ethers.Wallet.createRandom();
    gsnProvider.addAccount(newAccount.privateKey);
    const newEtherProvider = new ethers.providers.Web3Provider(gsnProvider as any);
    const newDid = 'did:key:zQ3shWWc4cydywFqJsPCJgBaoGXD9KYnGzQP1VXzQYm4FUFHs';

    // process transaction
    const txnWithFee = await web3a
    .connect(newEtherProvider
    .getSigner(newAccount.address))
    .addUser(
      newDid, 
      owner.address, 
      {gasLimit: 1e6}
    );

    // get events emited from tx receipt
    let newReceipt = await txnWithFee.wait();
    const newLog = myIface.parseLog(newReceipt.logs[0]);
    const {baseFee:newBaseFee, networkFee:newNetworkFee, totalFee:newTotalFee} = newLog.args;

    // verify network fee was calculated correctly
    expect(newBaseFee.div(10000).mul(feeInBasisPoints)).to.equal(newNetworkFee);

    // verify total fee is sum of base fee plus network fee
    expect(newBaseFee.add(newNetworkFee)).to.equal(newTotalFee);

    // verify app balance reflects deducation of total fee after transaction
    expect(await web3a.getBalance(owner.address)).to.equal(newbalance.sub(newTotalFee));

    // verify we add user transaction processed successfully
    expect(await web3a.getUserCount(owner.address)).to.equal(2);


    // stop GSN test environment
    await GsnTestEnvironment.stopGsn()

  });


});
