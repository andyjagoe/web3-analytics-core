import { expect } from "chai";
import { ethers } from "hardhat";
import { Web3 } from "hardhat";
import { RelayProvider } from "@opengsn/provider";
import { GsnTestEnvironment } from '@opengsn/dev'; 
import { ContractFactory, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { GsnDomainSeparatorType } from '@opengsn/common/dist/EIP712/TypedRequestData';
import Web3Analytics from "../artifacts/contracts/Web3Analytics.sol/Web3Analytics.json";
import Web3AnalyticsPaymaster from "../artifacts/contracts/Web3AnalyticsPaymaster.sol/Web3AnalyticsPaymaster.json";
import TestPaymasterEverythingAccepted from "@opengsn/cli/dist/compiled/TestPaymasterEverythingAccepted.json";
import RelayHub from "@opengsn/cli/dist/compiled/RelayHub.json";
import Forwarder from "@opengsn/cli/dist/compiled/Forwarder.json";
import TestForwarder from "@opengsn/cli/dist/compiled/TestForwarder.json";
import { registerForwarderForGsn } from '@opengsn/common/dist/EIP712/ForwarderUtil'
const Web3HttpProvider = require( 'web3-providers-http')


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

  it("Allows new users to register for app", async function () {
    await web3Analytics.connect(addr1).registerApp("My App", "https://myapp.xyz");

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
    expect(await web3Analytics.connect(addr2).isUserRegistered(addr1.address)).to.equal(true);
    expect(await web3Analytics.connect(addr3).isUserRegistered(addr1.address)).to.equal(false);
  });

  it("Return correct count of apps and app users", async function () {
    // Check count for apps
    expect(await web3Analytics.getAppCount()).to.equal(0);
    await web3Analytics.connect(addr1).registerApp("My App", "https://myapp.xyz");
    await web3Analytics.connect(addr2).registerApp("My App", "https://myapp.xyz");
    await web3Analytics.connect(addr3).registerApp("My App", "https://myapp.xyz");
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
    console.log(`app list: ${apps}`);
    expect(apps).to.include("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
    expect(apps).to.include("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC");
    expect(apps).to.not.include("0x90f79bf6eb2c4f870365e785982e1f101e93b906");
  });

  it("Paymaster contract deploys and can be funded", async function () {
    // Deploy paymaster contract   
    Web3AnalyticsPaymasterContractFactory = await ethers.getContractFactory("Web3AnalyticsPaymaster");
    web3AnalyticsPaymaster = await Web3AnalyticsPaymasterContractFactory.deploy();
    await web3AnalyticsPaymaster.deployed();

    // Deploy main contract
    const web3acf = await ethers.getContractFactory("Web3Analytics");
    const web3ac = await web3acf.deploy(trustedForwarder);
    await web3ac.deployed();

    // Configure Paymaster
    await web3AnalyticsPaymaster.setRelayHub(relayHub);
    await web3AnalyticsPaymaster.setTrustedForwarder(trustedForwarder);
    await web3AnalyticsPaymaster.setTarget(web3ac.address);

    // Get relayHub balance so we can make sure it increases
    const hubBalanceBefore = await ethers.provider.getBalance(relayHub);

    // Fund paymaster
    await owner.sendTransaction({
      from: owner.address,
      to: web3AnalyticsPaymaster.address, 
      value: ethers.utils.parseEther("1.0"),
      gasLimit: 1e6
    }); 

    // Verify RelayHub balance increased
    const hubBalanceAfter = await ethers.provider.getBalance(relayHub);
    expect(hubBalanceAfter).to.equal(hubBalanceBefore.add(ethers.utils.parseEther("1.0")));

  });

  /*
  it("Allows users to register gas free via GSN (v1)", async function () {
    // Uses code similar to working demo app on Rinkeby

    const testEnv = GsnTestEnvironment.loadDeployment();
    console.log(testEnv);
    const { forwarderAddress, relayHubAddress, paymasterAddress } = testEnv;


    const confStandard = await { 
      paymasterAddress: paymasterAddress,
    }

    const web3provider = new 
      Web3HttpProvider('http://localhost:8545')


    const deploymentProvider= new ethers.providers.Web3Provider(web3provider)
    const deployer = await deploymentProvider.getSigner()

          // Deploy our main contract from this signer
    const factory = new ethers.ContractFactory(
      Web3Analytics.abi, 
      Web3Analytics.bytecode, 
      deployer
    );
    const web3a = await factory.deploy(forwarderAddress)
    await web3a.deployed()
    console.log(`web3a address: ${web3a.address}`);


    // Register an app and verify it gets registered
    await web3a.connect(deployer).registerApp("My App", "https://myapp.xyz");
    expect(await web3a.getAppCount()).to.equal(1);


    let gsnProvider =
    await RelayProvider.newProvider({
      provider: web3provider,
      config: confStandard }).init()

    const signer = new ethers.Wallet(
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
    const unfundedAccount = new ethers.Wallet(Buffer.from('1'.repeat(64),'hex'))
    gsnProvider.addAccount(signer.privateKey)
    gsnProvider.addAccount(unfundedAccount.privateKey)

    const provider = new ethers.providers.Web3Provider(gsnProvider as any)


    const contract = await new
    ethers.Contract(web3a.address, Web3Analytics.abi,
      provider.getSigner(unfundedAccount.address))


    const did = 'did:key:zQ3shduQ4GNWTMTcbwvnF8azrxrYS1kt2FasSXtf3vHyTioMU'

    // FAILS: Returns unregistered domain sep. This works fine on Rinkeby so issue with GsnTestEnvironment?
    //const transaction = await contract.addUser(
    //  did, 
    //  await deployer.getAddress(),
    //  {gasLimit: 1e6}
    //)
    //console.log(transaction)
    //const receipt = await provider.waitForTransaction(transaction.hash)
    //console.log(receipt)

  });
  */


  /*
  it("Allows users to register gas free via GSN (v2)", async function () {
    const testEnv = GsnTestEnvironment.loadDeployment();
    console.log(testEnv);
    const { forwarderAddress, relayHubAddress } = testEnv;


    const web3provider = new Web3.providers.HttpProvider('http://localhost:8545');
    const deploymentProvider= new ethers.providers.Web3Provider(web3provider as any)

    // Get a signer account with funds we know exists in our new deploymentProvider
    const signer = new ethers.Wallet(
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      deploymentProvider
    );

    // Verify this signer has funds
    console.log(`signer(${signer.address}) 
      balance: ${ethers.utils.formatEther(await deploymentProvider.getBalance(signer.address))}`);


    // Deploy our main contract from this signer
    const factory = await ethers.getContractFactory("Web3Analytics");
    const web3a = await factory.connect(signer).deploy(forwarderAddress as any)
    await web3a.deployed()
    console.log(`web3a address: ${web3a.address}`);

    // Register an app and verify it gets registered
    await web3a.connect(signer).registerApp("My App", "https://myapp.xyz");
    expect(await web3a.getAppCount()).to.equal(1);


    // Deploy and configure our paymaster contract 
    const paymasterFactory = new ethers.ContractFactory(
      Web3AnalyticsPaymaster.abi, 
      Web3AnalyticsPaymaster.bytecode, 
      signer
    )
    const analyticsPaymaster = await paymasterFactory.deploy()
    await analyticsPaymaster.deployed()
    await analyticsPaymaster.setRelayHub(relayHubAddress);
    await analyticsPaymaster.setTrustedForwarder(forwarderAddress);
    await analyticsPaymaster.setTarget(web3a.address);
    console.log(`analyticsPaymaster address: ${analyticsPaymaster.address}`);



    // Get relayHub balance so we can make sure it increases when we fund paymaster
    const hubBalanceBefore = await deploymentProvider.getBalance(relayHubAddress as any);


    // Fund paymaster
    const txn0 = await signer.sendTransaction({
      from: signer.address,
      to: analyticsPaymaster.address, 
      value: ethers.utils.parseEther("1.0"),
      gasLimit: 1e6
    }); 
    await txn0.wait();

    // Get RelayHub Contract so we can test funding directly
    const relayHubContract = new ethers.Contract(
      relayHubAddress as any,
      RelayHub.abi,
      signer
    );

    // Test funding relayHub directly
    await relayHubContract.connect(signer).depositFor(
      analyticsPaymaster.address, 
      {value:ethers.utils.parseEther("1.0")}
    );

    // Verify RelayHub balance increased
    const hubBalanceAfter = await deploymentProvider.getBalance(relayHubAddress as any);
    console.log(hubBalanceAfter);
    expect(hubBalanceAfter).to.equal(hubBalanceBefore.add(ethers.utils.parseEther("2.0")));



    const conf = await { 
      loggerConfiguration: { logLevel: 'error'},
      forwarderAddress: forwarderAddress,
      paymasterAddress: analyticsPaymaster.address,
      //auditorsCount: 0
    };

    const gsnProvider = await RelayProvider.newProvider(
      {provider: web3provider as any, config: conf as any}
    );
    await gsnProvider.init();
    
    //const account = new ethers.Wallet(Buffer.from('1'.repeat(64),'hex'))
    const account = ethers.Wallet.createRandom();
    gsnProvider.addAccount(account.privateKey);
    const from = account.address;

    console.log(`account.privateKey ${ account.privateKey }`);
    const etherProvider = new ethers.providers.Web3Provider(gsnProvider as any);

    expect(await analyticsPaymaster.trustedForwarder()).to.equal(forwarderAddress);
    expect(await web3a.isTrustedForwarder(forwarderAddress as any)).to.equal(true);
    console.log("The forwarder address is:", forwarderAddress);


    // The DID we'll use
    const did = 'did:key:zQ3shduQ4GNWTMTcbwvnF8azrxrYS1kt2FasSXtf3vHyTioMU'


    // THIS WORKS: Verify that it works with our new wallet through GSN
    const txn1 = await web3a.connect(signer).addUser(
      did, 
      signer.address, 
      {gasLimit: 1e6}
    );
    expect(await web3a.getUserCount(signer.address)).to.equal(1);
    
    // THIS FAILS: Verify that it works with our wallet with no ETH through GSN
    //const txn2 = await web3a.connect(await etherProvider.getSigner(from)).addUser(
    //  did, 
    //  signer.address, 
    //  {gasLimit: 1e6}
    //);
    //console.log(txn2);
    //expect(await web3a.getUserCount(signer.address)).to.equal(2);

    // Check receipt
		//const receipt = await etherProvider.waitForTransaction(txn2.hash)
		//const result = receipt.logs.
		//	map(entry => web3a.interface.parseLog(entry)).
		//	filter(entry => entry != null)[0];

  });
  */

  /*
  it("Allows users to register gas free via GSN (v3)", async function () {
    let env = await GsnTestEnvironment.startGsn('localhost');
    const { 
      forwarderAddress,
      paymasterAddress,
    } = env.contractsDeployment;
    console.log(env.contractsDeployment);

    const web3provider = new Web3.providers.HttpProvider('http://localhost:8545');
    const deploymentProvider= new ethers.providers.Web3Provider(web3provider as any)

    const factory = new ethers.ContractFactory(
      Web3Analytics.abi, 
      Web3Analytics.bytecode, 
      owner
    )

    const web3a = await factory.deploy(forwarderAddress)
    await web3a.deployed()

    console.log(`web3a address: ${web3a.address}`);
    console.log(`owner signers: ${ owner.address } `);

    await web3a.connect(owner).registerApp("My App", "https://myapp.xyz");
    expect(await web3a.getAppCount()).to.equal(1);

    const conf = { 
      paymasterAddress: paymasterAddress 
    };

    const gsnProvider = await RelayProvider.newProvider(
      {provider: web3provider as any, config: conf}
    );
    await gsnProvider.init();
    

    //const account = new ethers.Wallet(Buffer.from('1'.repeat(64),'hex'))
    const account = ethers.Wallet.createRandom();
    gsnProvider.addAccount(account.privateKey);
    const from = account.address;

    console.log(`account.privateKey ${ account.privateKey }`);
    const etherProvider = new ethers.providers.Web3Provider(gsnProvider as any);

    
    expect(await web3a.isTrustedForwarder(forwarderAddress)).to.equal(true);
    console.log("The forwarder address is:", forwarderAddress);


    // Attempt to check forwarderAddress of paymasterContract
    const paymasterContract = new ethers.Contract(
      forwarderAddress as any,
      TestPaymasterEverythingAccepted.abi,
      owner
    );
    // Configure Paymaster
    //await paymasterContract.setRelayHub(relayHubAddress);
    //await paymasterContract.setTrustedForwarder(forwarderAddress);
    //await paymasterContract.setTarget(web3a.address);
    

    // This fails today with paymaster rejected in local view call to 'relayCall()' : isTrustedForwarder
    const did = 'did:key:zQ3shduQ4GNWTMTcbwvnF8azrxrYS1kt2FasSXtf3vHyTioMU'
    const txn = await web3a.connect(etherProvider.getSigner(from)).addUser(
      did, 
      owner.address, 
      {gasLimit: 1e6}
    );
    console.log(txn);

    expect(await web3a.getUserCount(owner.address)).to.equal(1);

    await GsnTestEnvironment.stopGsn()
  });
  */

});
