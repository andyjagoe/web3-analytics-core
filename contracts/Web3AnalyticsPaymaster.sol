//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.7;
pragma experimental ABIEncoderV2;


import "@opengsn/contracts/src/BasePaymaster.sol";
import "./Web3Analytics.sol";


contract Web3AnalyticsPaymaster is BasePaymaster {
	address public ourTarget;
    uint256 public gasUsedByPost;
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

    /**
     * set gas used by postRelayedCall, for proper gas calculation.
     * You can use TokenGasCalculator to calculate these values 
     * (they depend on actual code of postRelayedCall,
     */
    function setPostGasUsage(uint256 _gasUsedByPost) external onlyOwner {
        gasUsedByPost = _gasUsedByPost;
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

        // check that the method being called is approved
        bytes4 method = GsnUtils.getMethodSig(relayRequest.request.data);
        require(methodWhitelist[ourTarget][method], "method not whitelisted");

        // get address of app user is registering for
        (, address app) = abi.decode(relayRequest.request.data[4:], (string, address) );

        // check account balance of app to see if has sufficient funds for user registration
        Web3Analytics w3 = Web3Analytics(ourTarget);
        uint256 balance = w3.getBalance(app);
        uint256 maxEstimatedCost = maxPossibleGas * tx.gasprice;
        uint256 fee = (maxEstimatedCost / 10000) * w3.getNetworkFee(); 
        uint256 price = maxEstimatedCost + fee;

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

        // get app address for this transaction
        (address app) = abi.decode(context, (address) );

        // get actual cost of transaction
        uint256 ethActualCharge = relayHub.calculateCharge(
            gasUseWithoutPost + gasUsedByPost, relayData);

        // calculate price including network fee
        Web3Analytics w3 = Web3Analytics(ourTarget);
        uint256 fee = (ethActualCharge / 10000) * w3.getNetworkFee(); 
        uint256 price = ethActualCharge + fee;

        // deduct fee
        w3.chargeFee(app, price);

        emit FeeCharged(ethActualCharge, fee, price);

    }


  	function versionPaymaster() external virtual view 
		override returns (string memory) {
			return "3.0.0";
		}

}