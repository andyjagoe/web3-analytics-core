import { task } from "hardhat/config";


task("fundPaymaster", "Sends ETH to a paymaster")
  .addPositionalParam("paymaster", "The address that will receive them")
  .setAction(async ({ paymaster }, hre, runSuper) => {

    const web3AnalyticsPaymaster = await hre.ethers.getContractAt("Web3AnalyticsPaymaster", paymaster);
    const [sender] = await hre.ethers.getSigners();

    // Fund paymaster
    await sender.sendTransaction({
      from: sender.address,
      to: web3AnalyticsPaymaster.address, 
      value: hre.ethers.utils.parseEther("0.25"),
      gasLimit: 1e6
    }); 

    console.log(`Transferred 0.25 ETH to ${paymaster}`);
  });

