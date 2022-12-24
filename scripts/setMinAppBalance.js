async function main() {
    const contractAddress = "0xD67Dd8fCE137cD1249E761176a6F0782f5946FEC";
    const myContract = await hre.ethers.getContractAt("Web3Analytics", contractAddress);
    
    const tx = await myContract.setMinimumAppRegBalance(ethers.utils.parseEther("0"));
    console.log("Tx hash:", tx.hash);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });