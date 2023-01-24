# Web3 Analytics Core

This project contains the smart contracts required for operation of [Web3 Analytics](http://web3analytics.network/). Documentation for Web3 Analytics is available [here](https://web3-analytics.gitbook.io/product-docs/).

Web3 Analytics currently runs on Goerli and will continue to do so until [OpenGSN](https://opengsn.org/) enables v3 on a mainnet network. 

## Testing

To run the tests, you must first start a node using the following command:

```shell
npx hardhat node
```

Then, run the tests using this command:

```shell
npx hardhat test --network local
```

You cannot test using just `npx hardhat test` because it runs a node that the GSN instance used for tests cannot connect to.

## Pre-Deployment Setup

Before deploying, create a `.env` file in the root directory and, at minimum, configure the following values:
* `GOERLI_URL`: the json RPC URL from your node provider
* `PRIVATE_KEY`: the private key of the account you want to deploy the accounts from (this account must have sufficient Goerli ETH)
* `ETHERSCAN_API_KEY`: your api key to enable contract verification on etherscan

Optional .env values you can set include:
* `REPORT_GAS`: set to true or false based on whether you want to report gas for transactions
* `COINMARKETCAP_API_KEY`: used to estimate the price of gas
* Other possible configuration settings might be required. See [hardhat.config.ts](https://github.com/andyjagoe/web3-analytics-core/blob/main/hardhat.config.ts) for details.

## Deploying

Deploy the contracts by running:

```shell
npx hardhat run scripts/deploy.ts --network goerli
```

Copy the deployment address of the paymaster contract and paste it in to replace `WEB3ANALYTICS_PAYMASTER_ADDRESS` in this command to verify it:

```shell
npx hardhat verify --network goerli WEB3ANALYTICS_PAYMASTER_ADDRESS
```

Then, copy the deployment address of the main contract and paste it in to replace `WEB3ANALYTICS_CONTRACT_ADDRESS` in this command to verify it:

```shell
npx hardhat verify --network goerli WEB3ANALYTICS_CONTRACT_ADDRESS "{trusted forwarder}"
```

Finally, you need to fund the paymaster account by running the following task:

```shell
npx hardhat --network goerli fundPaymaster WEB3ANALYTICS_PAYMASTER_ADDRESS
```

If you're not deploying to Goerli, you will need to replace the value in double quotes with the correct trusted forwarder for that network. You will also need to make changes to the [deploy script](https://github.com/andyjagoe/web3-analytics-core/blob/main/scripts/deploy.ts) to correctly configure it for the network you're deploying to.


## Post-Deployment Configuration

Web3 Analytics has several attributes that can be configured post deployment if desired:
* [set trusted paymaster](https://github.com/andyjagoe/web3-analytics-core/blob/main/contracts/Web3Analytics.sol#L51)
* [set network fee](https://github.com/andyjagoe/web3-analytics-core/blob/main/contracts/Web3Analytics.sol#L70)
* [set account minimum balance](https://github.com/andyjagoe/web3-analytics-core/blob/main/contracts/Web3Analytics.sol#L89)

The best way to configure these value is to connect your wallet and write to the contract via Etherscan.
