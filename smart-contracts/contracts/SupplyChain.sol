// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title PharmaceuticalSupplyChain
 * @dev Manages pharmaceutical product transactions with privacy and ownership validation
 */
contract PharmaceuticalSupplyChain {
    
    // Transaction structure
    struct Transaction {
        bytes32 encryptedProductId;      // Encrypted product ID
        bytes32 encryptedSerialNumber;   // Encrypted serial number
        bytes32 encryptedShipperId;      // Encrypted shipper entity ID
        bytes32 encryptedReceiverId;     // Encrypted receiver entity ID
        uint256 timestamp;
        bytes32 transactionHash;         // Unique transaction identifier
        bool isCompleted;
        address shipperAddress;          // Blockchain address of shipper
        address receiverAddress;         // Blockchain address of receiver
    }
    
    // Ownership tracking: serialNumber => current owner address
    mapping(bytes32 => address) private currentOwner;
    
    // Transaction storage: transactionHash => Transaction
    mapping(bytes32 => Transaction) private transactions;
    
    // User's transaction list: address => transaction hashes
    mapping(address => bytes32[]) private userTransactions;
    
    // Initial product registration: serialNumber => bool
    mapping(bytes32 => bool) private isProductRegistered;
    
    // Authorized manufacturers (can register initial products)
    mapping(address => bool) public authorizedManufacturers;
    
    // Contract owner
    address public contractOwner;
    
    // Events
    event ProductRegistered(bytes32 indexed serialNumberHash, address indexed manufacturer, uint256 timestamp);
    event TransactionCreated(bytes32 indexed transactionHash, address indexed shipper, address indexed receiver, uint256 timestamp);
    event TransactionCompleted(bytes32 indexed transactionHash, uint256 timestamp);
    event ManufacturerAuthorized(address indexed manufacturer, uint256 timestamp);
    event ManufacturerRevoked(address indexed manufacturer, uint256 timestamp);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == contractOwner, "Only contract owner can perform this action");
        _;
    }
    
    modifier onlyManufacturer() {
        require(authorizedManufacturers[msg.sender], "Only authorized manufacturers can register products");
        _;
    }
    
    modifier onlyCurrentOwner(bytes32 _serialNumberHash) {
        require(currentOwner[_serialNumberHash] == msg.sender, "You are not the current owner of this item");
        _;
    }
    
    constructor() {
        contractOwner = msg.sender;
        authorizedManufacturers[msg.sender] = true;
    }
    
    /**
     * @dev Authorize a manufacturer to register initial products
     */
    function authorizeManufacturer(address _manufacturer) external onlyOwner {
        require(!authorizedManufacturers[_manufacturer], "Manufacturer already authorized");
        authorizedManufacturers[_manufacturer] = true;
        emit ManufacturerAuthorized(_manufacturer, block.timestamp);
    }
    
    /**
     * @dev Revoke manufacturer authorization
     */
    function revokeManufacturer(address _manufacturer) external onlyOwner {
        require(authorizedManufacturers[_manufacturer], "Manufacturer not authorized");
        authorizedManufacturers[_manufacturer] = false;
        emit ManufacturerRevoked(_manufacturer, block.timestamp);
    }
    
    /**
     * @dev Register initial product by manufacturer
     * @param _serialNumberHash Hash of the serial number for privacy
     * @param _encryptedProductId Encrypted product ID
     * @param _encryptedSerialNumber Encrypted serial number
     */
    function registerProduct(
        bytes32 _serialNumberHash,
        bytes32 _encryptedProductId,
        bytes32 _encryptedSerialNumber
    ) external onlyManufacturer {
        require(!isProductRegistered[_serialNumberHash], "Product already registered");
        
        currentOwner[_serialNumberHash] = msg.sender;
        isProductRegistered[_serialNumberHash] = true;
        
        emit ProductRegistered(_serialNumberHash, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Create a new transaction to transfer product ownership
     * @param _serialNumberHash Hash of the serial number
     * @param _encryptedProductId Encrypted product ID (only shipper/receiver can decrypt)
     * @param _encryptedSerialNumber Encrypted serial number
     * @param _encryptedShipperId Encrypted shipper ID
     * @param _encryptedReceiverId Encrypted receiver ID
     * @param _receiverAddress Blockchain address of receiver
     */
    function createTransaction(
        bytes32 _serialNumberHash,
        bytes32 _encryptedProductId,
        bytes32 _encryptedSerialNumber,
        bytes32 _encryptedShipperId,
        bytes32 _encryptedReceiverId,
        address _receiverAddress
    ) external onlyCurrentOwner(_serialNumberHash) returns (bytes32) {
        require(isProductRegistered[_serialNumberHash], "Product not registered");
        require(_receiverAddress != address(0), "Invalid receiver address");
        require(_receiverAddress != msg.sender, "Cannot ship to yourself");
        
        // Generate unique transaction hash
        bytes32 txHash = keccak256(abi.encodePacked(
            _serialNumberHash,
            msg.sender,
            _receiverAddress,
            block.timestamp,
            block.number
        ));
        
        // Create transaction
        Transaction memory newTx = Transaction({
            encryptedProductId: _encryptedProductId,
            encryptedSerialNumber: _encryptedSerialNumber,
            encryptedShipperId: _encryptedShipperId,
            encryptedReceiverId: _encryptedReceiverId,
            timestamp: block.timestamp,
            transactionHash: txHash,
            isCompleted: false,
            shipperAddress: msg.sender,
            receiverAddress: _receiverAddress
        });
        
        transactions[txHash] = newTx;
        userTransactions[msg.sender].push(txHash);
        userTransactions[_receiverAddress].push(txHash);
        
        emit TransactionCreated(txHash, msg.sender, _receiverAddress, block.timestamp);
        
        return txHash;
    }
    
    /**
     * @dev Complete transaction and transfer ownership
     * @param _transactionHash Hash of the transaction
     * @param _serialNumberHash Hash of the serial number
     */
    function completeTransaction(
        bytes32 _transactionHash,
        bytes32 _serialNumberHash
    ) external {
        Transaction storage txn = transactions[_transactionHash];
        
        require(txn.transactionHash != bytes32(0), "Transaction does not exist");
        require(!txn.isCompleted, "Transaction already completed");
        require(msg.sender == txn.receiverAddress, "Only receiver can complete transaction");
        require(currentOwner[_serialNumberHash] == txn.shipperAddress, "Shipper is not current owner");
        
        // Transfer ownership
        currentOwner[_serialNumberHash] = txn.receiverAddress;
        txn.isCompleted = true;
        
        emit TransactionCompleted(_transactionHash, block.timestamp);
    }
    
    /**
     * @dev Get transaction details (only shipper or receiver can access)
     */
    function getTransaction(bytes32 _transactionHash) external view returns (
        bytes32 encryptedProductId,
        bytes32 encryptedSerialNumber,
        bytes32 encryptedShipperId,
        bytes32 encryptedReceiverId,
        uint256 timestamp,
        bool isCompleted
    ) {
        Transaction memory txn = transactions[_transactionHash];
        
        require(txn.transactionHash != bytes32(0), "Transaction does not exist");
        require(
            msg.sender == txn.shipperAddress || msg.sender == txn.receiverAddress,
            "Only shipper or receiver can view transaction"
        );
        
        return (
            txn.encryptedProductId,
            txn.encryptedSerialNumber,
            txn.encryptedShipperId,
            txn.encryptedReceiverId,
            txn.timestamp,
            txn.isCompleted
        );
    }
    
    /**
     * @dev Get user's transaction hashes
     */
    function getUserTransactions(address _user) external view returns (bytes32[] memory) {
        require(msg.sender == _user || msg.sender == contractOwner, "Unauthorized access");
        return userTransactions[_user];
    }
    
    /**
     * @dev Check current owner of a product
     */
    function getCurrentOwner(bytes32 _serialNumberHash) external view returns (address) {
        require(
            currentOwner[_serialNumberHash] == msg.sender || msg.sender == contractOwner,
            "Only current owner can check ownership"
        );
        return currentOwner[_serialNumberHash];
    }
    
    /**
     * @dev Check if product is registered
     */
    function isRegistered(bytes32 _serialNumberHash) external view returns (bool) {
        return isProductRegistered[_serialNumberHash];
    }
}