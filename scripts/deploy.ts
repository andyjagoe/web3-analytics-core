import { run, ethers } from "hardhat";

async function main() {
  await run('compile');

  // Rinkeby account addresses
  const trustedForwarder = '0x83A54884bE4657706785D7309cf46B58FE5f6e8a';
  const relayHub = '0x6650d69225CA31049DB7Bd210aE4671c0B1ca132';

  // Hardhat account addresses
  //const trustedForwarder = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';
  //const relayHub = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';


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

  // Configure Paymaster
  await web3AnalyticsPaymaster.setRelayHub(relayHub);
  await web3AnalyticsPaymaster.setTrustedForwarder(trustedForwarder);
  await web3AnalyticsPaymaster.setTarget(Web3Analytics.address);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
