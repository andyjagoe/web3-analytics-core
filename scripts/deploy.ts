import { run, ethers } from "hardhat";


async function main() {
  await run('compile');


  // Polygon account addresses
  //const trustedForwarder = '0xdA78a11FD57aF7be2eDD804840eA7f4c2A38801d';
  //const relayHub = '0x6C28AfC105e65782D9Ea6F2cA68df84C9e7d750d';

  // Polygon Mumbai account addresses
  //const trustedForwarder = '0x4d4581c01A457925410cd3877d17b2fd4553b2C5';
  //const relayHub = '0x6646cD15d33cE3a6933e36de38990121e8ba2806';

  // Goerli account addresses
  const trustedForwarder = '0x7A95fA73250dc53556d264522150A940d4C50238';
  const relayHub = '0x40bE32219F0F106067ba95145e8F2b3e7930b201';
  
  // Rinkeby account addresses
  //const trustedForwarder = '0x83A54884bE4657706785D7309cf46B58FE5f6e8a';
  //const relayHub = '0x6650d69225CA31049DB7Bd210aE4671c0B1ca132';

  // Hardhat account addresses
  //const trustedForwarder = '0xBA4e44e333250bc2df36AD4B0B06A9763C12c682';
  //const relayHub = '0xa73a245DB5b8985b21E7D98732c8554a2cED1Ce5';


  // We get the contract to deploy
  const web3AnalyticsPaymasterFactory = await ethers.getContractFactory("Web3AnalyticsPaymaster");
  const web3AnalyticsPaymaster = await web3AnalyticsPaymasterFactory.deploy();

  await web3AnalyticsPaymaster.deployed();

  console.log("web3AnalyticsPaymaster deployed to:", web3AnalyticsPaymaster.address);

  // Deploy main contract
  const Web3AnalyticsFactory = await ethers.getContractFactory("Web3Analytics");
  const Web3Analytics = await Web3AnalyticsFactory.deploy(trustedForwarder);
  await Web3Analytics.deployed();

  console.log("Web3Analytics deployed to:", Web3Analytics.address);


  // Configure main contract
  Web3Analytics.setTrustedPaymaster(web3AnalyticsPaymaster.address);
  //Web3Analytics.setMinimumAppRegBalance(ethers.utils.parseEther("1.0"));
  //const feeInBasisPoints = 1000;
  //Web3Analytics.setNetworkFee(feeInBasisPoints);


  // Configure Paymaster
  await web3AnalyticsPaymaster.setRelayHub(relayHub);
  await web3AnalyticsPaymaster.setTrustedForwarder(trustedForwarder);
  await web3AnalyticsPaymaster.setTarget(Web3Analytics.address);
  const gasUsedByPost = 16384;
  await web3AnalyticsPaymaster.setPostGasUsage(gasUsedByPost)

  // whitelist addUser method on Paymaster
  const did = 'did:key:zQ3shduQ4GNWTMTcbwvnF8azrxrYS1kt2FasSXtf3vHyTioMU' // dummy data
  const ABI = [ "function addUser(string did, address app)" ];
  const iface = new ethers.utils.Interface(ABI);
  const web3AnalyticsEncoded = iface.encodeFunctionData("addUser", [did, ethers.provider.getSigner()]);    
  await web3AnalyticsPaymaster.whitelistMethod(
    Web3Analytics.address, web3AnalyticsEncoded.substring(0, 10), true
  )

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
