//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@opengsn/contracts/src/BaseRelayRecipient.sol";


contract Web3Analytics is BaseRelayRecipient, Ownable {
    using Address for address;
    using EnumerableSet for EnumerableSet.AddressSet;

    struct Registration {
        address userAddress;
        string userDid;
    }

    struct App {
        address appAddress;
        string appName;
        string appUrl;
    }

    EnumerableSet.AddressSet private registeredApps;
    mapping(address => App) private appData;
    mapping(address => Registration[]) private appRegistrations;
    mapping(address => EnumerableSet.AddressSet) private appUsers;


    /**
    * @dev the Web3Analytics contract constructor
    * @param forwarder the trusted forwarder contract address
    **/

    constructor(address forwarder) {
        _setTrustedForwarder(forwarder);
    }

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

    function isAppRegistered(address app) public view returns(bool) {
        return registeredApps.contains(app);
    }


    /**
    * @dev returns whether user is registered for given app
    * @param app the application to check registration for
    **/

    function isUserRegistered(address app) public view returns(bool) {
        return appUsers[app].contains(_msgSender());
    }


    /**
    * @dev provides a count of apps registered
    **/

    function getAppCount() public view returns(uint256) {
        return registeredApps.length();
    }


    /**
    * @dev provides a list of apps registered
    **/

    function getApps() public view returns(address[] memory) {
        return registeredApps.values();
    }


    /**
    * @dev adds a new user to an app
    * @param did the did key for the user to add
    * @param app the address of the app to register user for
    **/

    function addUser(string memory did, address app) public {
        // app must be registered and user must not exist for app
        require(registeredApps.contains(app), "App not registered");
        require(!appUsers[app].contains(_msgSender()), "User already exists");

        appUsers[app].add(_msgSender());
        appRegistrations[app].push(Registration(_msgSender(), did));                          
    }


    /**
    * @dev registers new app for web3analytics
    * @param name the name of the app
    * @param url the app's url (optional)
    **/

    function registerApp(string memory name, string memory url) public {
        require(!registeredApps.contains(_msgSender()), "App already registered");
        require(bytes(name).length != 0, "Name is required");

        registeredApps.add(_msgSender());
        appData[_msgSender()] = App(_msgSender(), name, url);                          
    }


    /**
    * @dev provides app data for registered app
    * @param app the application to retrieve data for
    **/

    function getAppData(address app) public view returns(App memory) {
        return appData[app];
    }


    /**
    * @dev updates app data for registered app
    * @param name the name of the app
    * @param url the app's url (optional)
    **/

    function updateAppData(string memory name, string memory url) public {
        require(registeredApps.contains(_msgSender()), "App not registered");
        require(bytes(name).length != 0, "Name is required");

        appData[_msgSender()] = App(_msgSender(), name, url);                          
    }


    string public override versionRecipient = "2.2.0";

    function _msgSender() internal view override(Context, BaseRelayRecipient)
        returns (address sender) {
        sender = BaseRelayRecipient._msgSender();
    }

    function _msgData() internal view override(Context, BaseRelayRecipient)
        returns (bytes memory) {
        return BaseRelayRecipient._msgData();
    }

}
