//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@opengsn/contracts/src/ERC2771Recipient.sol";



contract Web3Analytics is ERC2771Recipient, Ownable {
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

    address private allowedPaymaster;
    uint256 private feeInBasisPoints;
    uint256 private minimumAppRegBalance;
    EnumerableSet.AddressSet private registeredApps;
    mapping(address => App) private appData;
    mapping(address => uint256) private appBalances;
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
    * @dev sets trusted paymaster
    * @param paymaster the address of our trusted paymaster
    **/

    function setTrustedPaymaster(address paymaster) public onlyOwner {
        allowedPaymaster = paymaster;
    }


    /**
    * @dev gets trusted paymaster
    **/

    function getTrustedPaymaster() public view returns(address) {
        return allowedPaymaster;
    }


    /**
    * @dev sets feeInBasisPoints
    * @param fee the fee in basis points
    **/

    function setNetworkFee(uint256 fee) public onlyOwner {
        feeInBasisPoints = fee;
    }


    /**
    * @dev gets feeInBasisPoints
    **/

    function getNetworkFee() public view returns(uint256) {
        return feeInBasisPoints;
    }


    /**
    * @dev sets minimum balance required to register an app
    * @param balance the minimum balance
    **/

    function setMinimumAppRegBalance(uint256 balance) public onlyOwner {
        minimumAppRegBalance = balance;
    }


    /**
    * @dev gets minimum balance required to register an app
    **/

    function getMinimumAppRegBalance() public view returns(uint256) {
        return minimumAppRegBalance;
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

    function isUserRegistered(address app, address user) public view returns(bool) {
        return appUsers[app].contains(user);
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

    function registerApp(string memory name, string memory url) public payable {
        require(!registeredApps.contains(_msgSender()), "App already registered");
        require(bytes(name).length != 0, "Name is required");
        require(msg.value >= minimumAppRegBalance, "Minimum balance to register not met");

        registeredApps.add(_msgSender());
        appData[_msgSender()] = App(_msgSender(), name, url);
        if (msg.value > 0) appBalances[_msgSender()] = msg.value;
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


    /**
    * @dev gets account balance of an app
    * @param app the application to retrieve balance for
    **/

    function getBalance(address app) public view returns(uint256) {
        return appBalances[app];
    }


    /**
    * @dev allows adding value to account balance of an app
    * @param app the application to add value to
    **/

    function topUpBalance(address app) public payable {
        require(msg.value > 0, 'Top up must be greater than 0');
        appBalances[app] = appBalances[app] + msg.value;
    }


    /**
    * @dev allows deducting value from account balance of an app
    * @param app the application to charge fee to
    * @param fee the amount of the fee
    **/

    function chargeFee(address app, uint256 fee) public payable {
        require(allowedPaymaster != address(0), 'Trusted paymaster must be set');
        require(allowedPaymaster == _msgSender(), 'Only trusted paymaster may charge fee');

        appBalances[app] = appBalances[app] - fee;
    }


    function _msgSender() internal view override(Context, ERC2771Recipient)
        returns (address sender) {
        sender = ERC2771Recipient._msgSender();
    }

    function _msgData() internal view override(Context, ERC2771Recipient)
        returns (bytes memory) {
        return ERC2771Recipient._msgData();
    }

}
