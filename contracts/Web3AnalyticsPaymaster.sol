//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.7;
pragma experimental ABIEncoderV2;


import "@opengsn/contracts/src/BasePaymaster.sol";


contract Web3AnalyticsPaymaster is BasePaymaster {
	address public ourTarget;   // The target contract we are willing to pay for

	// allow the owner to set ourTarget
	event TargetSet(address target);
	function setTarget(address target) external onlyOwner {
		ourTarget = target;
		emit TargetSet(target);
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

        require(relayRequest.request.to == ourTarget);

        return ("", false);
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
    }


  	function versionPaymaster() external virtual view 
		override returns (string memory) {
			return "3.0.0";
		}

}