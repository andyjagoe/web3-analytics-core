import { task } from "hardhat/config";


task("faucet", "Sends ETH to test account")
  .addPositionalParam("receiver", "The address that will receive them")
  .setAction(async ({ receiver }, hre, runSuper) => {
    const [sender] = await hre.ethers.getSigners();

    const balance1 = await hre.ethers.provider.getBalance(sender.address)
    const balance2 = await hre.ethers.provider.getBalance(receiver)
    console.log(`beginning balance sender: ${hre.ethers.utils.formatEther(balance1)}`);
    console.log(`beginning balance receiver: ${hre.ethers.utils.formatEther(balance2)}`);

    const ethAmount = hre.ethers.BigNumber.from("10").pow("18").mul("10");
    const tx1 = await sender.sendTransaction({
      to: receiver,
      value: ethAmount,
    });
    await tx1.wait();

    const balance3 = await hre.ethers.provider.getBalance(sender.address)
    const balance4 = await hre.ethers.provider.getBalance(receiver)
    console.log(`ending balance sender: ${hre.ethers.utils.formatEther(balance3)}`);
    console.log(`ending balance receiver: ${hre.ethers.utils.formatEther(balance4)}`);

    console.log(`Transferred 10 ETH to ${receiver}`);
  });

