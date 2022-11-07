//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.7;
pragma experimental ABIEncoderV2;


import "@opengsn/contracts/src/BasePaymaster.sol";
import "./Web3Analytics.sol";

import "hardhat/console.sol";


contract Web3AnalyticsPaymaster is BasePaymaster {
	address public ourTarget;
    mapping(address => mapping(bytes4 => bool)) public methodWhitelist;
    
    event FeeCharged(uint256 baseFee, uint256 networkFee, uint256 totalFee);

	// allow the owner to set target contract we are willing to pay for
	event TargetSet(address target);
	function setTarget(address target) external onlyOwner {
		ourTarget = target;
		emit TargetSet(target);
	}

	// allow the owner to set methods we are willing to pay for
    function whitelistMethod(address target, bytes4 method, bool isAllowed) public onlyOwner {
        methodWhitelist[target][method] = isAllowed;
    }

	function _preRelayedCall(
        GsnTypes.RelayRequest calldata relayRequest,
        bytes calldata signature,
        bytes calldata approvalData,
        uint256 maxPossibleGas
    )
    internal
    override
    virtual
    returns (bytes memory context, bool revertOnRecipientRevert) {
        (signature, maxPossibleGas);

        // only pay for transactions for our contract
        require(relayRequest.request.to == ourTarget);

        console.log("\n\n_preRelayedCall console log");
        console.log("ourTarget: %s", ourTarget);
        console.log("maxPossibleGas: %s",  maxPossibleGas);
        console.log("tx.gasprice: %s", tx.gasprice);
        console.log("estimated cost: %s", maxPossibleGas * tx.gasprice);

        // check that the method being called is approved
        bytes4 method = GsnUtils.getMethodSig(relayRequest.request.data);
        require(methodWhitelist[ourTarget][method], "method not whitelisted");

        // get address of app user is registering for
        (string memory did, address app) = abi.decode(relayRequest.request.data[4:], (string, address) );
        console.log("relayRequest.request.data: did: %s address: %s", did, app);

        // check account balance of app to see if has sufficient funds for user registration
        Web3Analytics w3 = Web3Analytics(ourTarget);
        uint256 balance = w3.getBalance(app);
        console.log("balance of app %s is %s", app, balance);
        uint256 maxEstimatedCost = maxPossibleGas * tx.gasprice;

        uint256 fee = (maxEstimatedCost / 10000) * w3.getNetworkFee(); 
        console.log("network fee is %s", fee);

        uint256 price = maxEstimatedCost + fee;
        console.log("price is %s", price);

        require(balance > price, "insufficient app balance");

        return (abi.encode(app), false);
    }


	function _postRelayedCall(
        bytes calldata context,
        bool success,
        uint256 gasUseWithoutPost,
        GsnTypes.RelayData calldata relayData
    )
    internal
    override
    virtual {
        (context, success, gasUseWithoutPost, relayData);
        console.log("\n\n_postRelayedCall console log");
        console.log("success: %s", success);
        console.log("gasUseWithoutPost: %s", gasUseWithoutPost);
        console.log("tx.gasprice: %s", tx.gasprice);
        console.log("actual cost: %s", gasUseWithoutPost * tx.gasprice);

        (address app) = abi.decode(context, (address) );
        console.log("context: address: %s", app);

        //deduct amount of transaction + transaction fee
        console.log("ourTarget: %s", ourTarget);
        Web3Analytics w3 = Web3Analytics(ourTarget);
        uint256 actualCost = gasUseWithoutPost * tx.gasprice;
        console.log("context: actualCost: %s", actualCost);

        uint256 fee = (actualCost / 10000) * w3.getNetworkFee(); 
        console.log("network fee is %s", fee);

        uint256 price = actualCost + fee;
        console.log("price is %s", price);

        w3.chargeFee(app, price);

        emit FeeCharged(actualCost, fee, price);
    }


  	function versionPaymaster() external virtual view 
		override returns (string memory) {
			return "3.0.0";
		}

}