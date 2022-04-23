import { expect } from "chai";
import { ethers } from "hardhat";
import { ContractFactory, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";


describe("Web3Analytics", function () {

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

  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, ...addrs] = await ethers.getSigners();

    // Deploy contract
    Web3AnalyticsContractFactory = await ethers.getContractFactory("Web3Analytics");
    web3Analytics = await Web3AnalyticsContractFactory.deploy();
    await web3Analytics.deployed();
  });

  it("Allows new app to register", async function () {
    await web3Analytics.connect(addr1).registerApp();

    expect(await web3Analytics.connect(owner).isAppRegistered(addr1.address)).to.equal(true);

    await expect(web3Analytics.connect(addr1).isAppRegistered(addr1.address)).
    to.be.revertedWith('Ownable: caller is not the owner');

  });

  it("Allows new users to register for app", async function () {
    await web3Analytics.connect(addr1).registerApp();

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

  });

  it("Return correct count of apps and app users", async function () {
    // Check count for apps
    expect(await web3Analytics.getAppCount()).to.equal(0);
    await web3Analytics.connect(addr1).registerApp();
    await web3Analytics.connect(addr2).registerApp();
    await web3Analytics.connect(addr3).registerApp();
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

});
