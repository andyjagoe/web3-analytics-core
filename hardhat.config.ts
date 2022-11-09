import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomiclabs/hardhat-web3";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "hardhat-abi-exporter";

import "./tasks/fundPaymaster";
import "./tasks/faucet";

dotenv.config();


task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});


const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.7",
    settings: {
      optimizer: {
        enabled: true,
        runs: 10,
      },
    },
  },
  networks: {
    hardhat: {
      loggingEnabled: true,
      throwOnTransactionFailures: true,
      throwOnCallFailures: true,
      gas: 'auto',
      chainId: 31337,
      forking: {
        url: process.env.POLYGON_URL || "",
        //url: process.env.GOERLI_URL || "",
      }
    },
    local: {
      url: 'http://localhost:8545',
      gas: 2100000,
      gasPrice: 3000000000
    },
    polygon: {
      url: process.env.POLYGON_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    mumbai: {
      url: process.env.MUMBAI_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    goerli: {
      url: process.env.GOERLI_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    rinkeby: {
      url: process.env.RINKEBY_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    token: "ETH",
    //gasPriceApi: "https://api.polygonscan.com/api?module=proxy&action=eth_gasPrice",
    //gasPriceApi: "https://api.etherscan.io/api?module=proxy&action=eth_gasPrice",
    gasPriceApi: "https://api-goerli.etherscan.io/api?module=proxy&action=eth_gasPrice",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY
  },
  etherscan: {
    apiKey: { 
      rinkeby: process.env.ETHERSCAN_API_KEY,
      goerli: process.env.ETHERSCAN_API_KEY,
      polygon: process.env.POLYGONSCAN_API_KEY,
      polygonMumbai: process.env.POLYGONSCAN_API_KEY, 
    }
  },
  abiExporter: {
    runOnCompile: true,
    clear: true,
  }
};

export default config;
