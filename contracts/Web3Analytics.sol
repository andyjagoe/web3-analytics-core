//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";


contract Web3Analytics is Ownable {
    using Address for address;
    using EnumerableSet for EnumerableSet.AddressSet;

    struct Registration {
        address userAddress;
        string userDid;
    }

    EnumerableSet.AddressSet private registeredApps;
    mapping(address => Registration[]) private appRegistrations;
    mapping(address => EnumerableSet.AddressSet) private appUsers;


    /**
    * @dev provides a list of an app's users
    * @param app the application to retrieve users for
    **/

    function getUsers(address app) public view returns(address[] memory) {
        return appUsers[app].values();
    }


    /**
    * @dev provides a count of an app's users
    * @param app the application to retrieve users for
    **/

    function getUserCount(address app) public view returns(uint256) {
        return appUsers[app].length();
    }


    /**
    * @dev provides a list of an app's registrations
    * @param app the application to retrieve registrations for
    **/

    function getUserRegistrations(address app) public view returns(Registration[] memory) {
        return appRegistrations[app];
    }


    /**
    * @dev returns whether app is registered or not
    * @param app the application to check registration for
    **/

    function isAppRegistered(address app) public view onlyOwner returns(bool) {
        return registeredApps.contains(app);
    }


    /**
    * @dev provides a count of apps registered
    **/

    function getAppCount() public view returns(uint256) {
        return registeredApps.length();
    }


    /**
    * @dev adds a new user to an app
    * @param did the did key for the user to add
    * @param app the address of the app to register user for
    **/

    function addUser(string memory did, address app) public {
        // app must be registered and user must not exist for app
        require(registeredApps.contains(app), "App not registered");
        require(!appUsers[app].contains(msg.sender), "User already exists");

        appUsers[app].add(msg.sender);
        appRegistrations[app].push(Registration(msg.sender, did));                          
    }


    /**
    * @dev registers new app for web3analytics
    **/

    function registerApp() public {
        require(!registeredApps.contains(msg.sender), "App already registered");
        
        registeredApps.add(msg.sender);
    }

}
