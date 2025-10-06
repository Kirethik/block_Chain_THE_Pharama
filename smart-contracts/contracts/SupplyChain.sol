// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title SupplyChain
 * @dev Pharmaceutical supply chain management with privacy and role-based access
 * @notice This contract runs on PoS blockchain (Ethereum/Polygon)
 */
contract SupplyChain is AccessControl, ReentrancyGuard, Pausable {
    
    // Role definitions
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant PHARMACY_ROLE = keccak256("PHARMACY_ROLE");
    bytes32 public constant REGULATOR_ROLE = keccak256("REGULATOR_ROLE");

    // Item structure
    struct Item {
        bool exists;
        address currentOwner;
        address manufacturer;
        bytes32 latestCommit;
        uint256 registeredAt;
        uint256 lastTransferredAt;
        uint8 transferCount;
        bool recalled;
    }

    // Transfer history structure
    struct TransferRecord {
        address from;
        address to;
        bytes32 commit;
        uint256 timestamp;
    }

    // State variables
    mapping(bytes32 => Item) private items;
    mapping(bytes32 => TransferRecord[]) private transferHistory;
    mapping(address => uint256) public entityItemCount;
    
    uint256 public totalItemsRegistered;
    uint256 public totalTransfers;

    // Events
    event ItemRegistered(
        bytes32 indexed key, 
        address indexed owner, 
        address indexed manufacturer,
        bytes32 commit,
        uint256 timestamp
    );
    
    event ItemTransferred(
        bytes32 indexed key, 
        address indexed from, 
        address indexed to, 
        bytes32 commit,
        uint256 timestamp
    );
    
    event ItemRecalled(
        bytes32 indexed key,
        address indexed manufacturer,
        string reason,
        uint256 timestamp
    );
    
    event RoleGrantedToEntity(
        address indexed account,
        bytes32 indexed role,
        address indexed grantedBy
    );

    /**
     * @dev Constructor - sets up admin role
     * @param admin Address of the contract administrator
     */
    constructor(address admin) {
        require(admin != address(0), "Invalid admin address");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    // ============================================
    // ROLE MANAGEMENT
    // ============================================

    /**
     * @dev Grant manufacturer role
     * @param account Address to grant role to
     */
    function grantManufacturer(address account) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        grantRole(MANUFACTURER_ROLE, account);
        emit RoleGrantedToEntity(account, MANUFACTURER_ROLE, msg.sender);
    }

    /**
     * @dev Grant distributor role
     * @param account Address to grant role to
     */
    function grantDistributor(address account) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        grantRole(DISTRIBUTOR_ROLE, account);
        emit RoleGrantedToEntity(account, DISTRIBUTOR_ROLE, msg.sender);
    }

    /**
     * @dev Grant pharmacy role
     * @param account Address to grant role to
     */
    function grantPharmacy(address account) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        grantRole(PHARMACY_ROLE, account);
        emit RoleGrantedToEntity(account, PHARMACY_ROLE, msg.sender);
    }

    /**
     * @dev Grant regulator role
     * @param account Address to grant role to
     */
    function grantRegulator(address account) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        grantRole(REGULATOR_ROLE, account);
        emit RoleGrantedToEntity(account, REGULATOR_ROLE, msg.sender);
    }

    // ============================================
    // ITEM REGISTRATION
    // ============================================

    /**
     * @dev Register new pharmaceutical item
     * @param key Unique identifier (hash of productId|serialNumber)
     * @param initialOwner Address of initial owner
     * @param commit SHA256 hash of encrypted data
     */
    function registerItem(
        bytes32 key, 
        address initialOwner, 
        bytes32 commit
    ) 
        external 
        onlyRole(MANUFACTURER_ROLE)
        whenNotPaused
        nonReentrant
    {
        require(key != bytes32(0), "Invalid key");
        require(initialOwner != address(0), "Invalid owner address");
        require(commit != bytes32(0), "Invalid commit hash");
        require(!items[key].exists, "Item already exists");

        items[key] = Item({
            exists: true,
            currentOwner: initialOwner,
            manufacturer: msg.sender,
            latestCommit: commit,
            registeredAt: block.timestamp,
            lastTransferredAt: block.timestamp,
            transferCount: 0,
            recalled: false
        });

        // Add to transfer history
        transferHistory[key].push(TransferRecord({
            from: address(0),
            to: initialOwner,
            commit: commit,
            timestamp: block.timestamp
        }));

        entityItemCount[initialOwner]++;
        totalItemsRegistered++;

        emit ItemRegistered(key, initialOwner, msg.sender, commit, block.timestamp);
    }

    /**
     * @dev Register multiple items in batch
     * @param keys Array of unique identifiers
     * @param initialOwner Address of initial owner
     * @param commits Array of commit hashes
     */
    function batchRegisterItems(
        bytes32[] calldata keys,
        address initialOwner,
        bytes32[] calldata commits
    )
        external
        onlyRole(MANUFACTURER_ROLE)
        whenNotPaused
        nonReentrant
    {
        require(keys.length == commits.length, "Array length mismatch");
        require(keys.length > 0 && keys.length <= 100, "Invalid batch size");
        require(initialOwner != address(0), "Invalid owner address");

        for (uint256 i = 0; i < keys.length; i++) {
            require(keys[i] != bytes32(0), "Invalid key");
            require(commits[i] != bytes32(0), "Invalid commit");
            require(!items[keys[i]].exists, "Item already exists");

            items[keys[i]] = Item({
                exists: true,
                currentOwner: initialOwner,
                manufacturer: msg.sender,
                latestCommit: commits[i],
                registeredAt: block.timestamp,
                lastTransferredAt: block.timestamp,
                transferCount: 0,
                recalled: false
            });

            transferHistory[keys[i]].push(TransferRecord({
                from: address(0),
                to: initialOwner,
                commit: commits[i],
                timestamp: block.timestamp
            }));

            emit ItemRegistered(keys[i], initialOwner, msg.sender, commits[i], block.timestamp);
        }

        entityItemCount[initialOwner] += keys.length;
        totalItemsRegistered += keys.length;
    }

    // ============================================
    // ITEM TRANSFER
    // ============================================

    /**
     * @dev Transfer item ownership
     * @param key Unique identifier
     * @param newOwner Address of new owner
     * @param commit SHA256 hash of transfer data
     */
    function transferItem(
        bytes32 key, 
        address newOwner, 
        bytes32 commit
    ) 
        external 
        whenNotPaused
        nonReentrant
    {
        require(items[key].exists, "Item does not exist");
        require(items[key].currentOwner == msg.sender, "Not the current owner");
        require(newOwner != address(0), "Invalid new owner address");
        require(newOwner != msg.sender, "Cannot transfer to self");
        require(commit != bytes32(0), "Invalid commit hash");
        require(!items[key].recalled, "Item has been recalled");

        address previousOwner = items[key].currentOwner;

        // Update item
        items[key].currentOwner = newOwner;
        items[key].latestCommit = commit;
        items[key].lastTransferredAt = block.timestamp;
        items[key].transferCount++;

        // Update entity counts
        entityItemCount[previousOwner]--;
        entityItemCount[newOwner]++;
        totalTransfers++;

        // Add to history
        transferHistory[key].push(TransferRecord({
            from: previousOwner,
            to: newOwner,
            commit: commit,
            timestamp: block.timestamp
        }));

        emit ItemTransferred(key, previousOwner, newOwner, commit, block.timestamp);
    }

    /**
     * @dev Batch transfer items
     * @param keys Array of unique identifiers
     * @param newOwner Address of new owner
     * @param commits Array of commit hashes
     */
    function batchTransferItems(
        bytes32[] calldata keys,
        address newOwner,
        bytes32[] calldata commits
    )
        external
        whenNotPaused
        nonReentrant
    {
        require(keys.length == commits.length, "Array length mismatch");
        require(keys.length > 0 && keys.length <= 100, "Invalid batch size");
        require(newOwner != address(0), "Invalid new owner");
        require(newOwner != msg.sender, "Cannot transfer to self");

        for (uint256 i = 0; i < keys.length; i++) {
            require(items[keys[i]].exists, "Item does not exist");
            require(items[keys[i]].currentOwner == msg.sender, "Not the owner");
            require(!items[keys[i]].recalled, "Item recalled");

            address previousOwner = items[keys[i]].currentOwner;

            items[keys[i]].currentOwner = newOwner;
            items[keys[i]].latestCommit = commits[i];
            items[keys[i]].lastTransferredAt = block.timestamp;
            items[keys[i]].transferCount++;

            transferHistory[keys[i]].push(TransferRecord({
                from: previousOwner,
                to: newOwner,
                commit: commits[i],
                timestamp: block.timestamp
            }));

            emit ItemTransferred(keys[i], previousOwner, newOwner, commits[i], block.timestamp);
        }

        entityItemCount[msg.sender] -= keys.length;
        entityItemCount[newOwner] += keys.length;
        totalTransfers += keys.length;
    }

    // ============================================
    // RECALL MECHANISM
    // ============================================

    /**
     * @dev Recall an item (manufacturer or regulator only)
     * @param key Unique identifier
     * @param reason Recall reason
     */
    function recallItem(bytes32 key, string calldata reason) 
        external 
    {
        require(items[key].exists, "Item does not exist");
        require(
            items[key].manufacturer == msg.sender || 
            hasRole(REGULATOR_ROLE, msg.sender),
            "Not authorized to recall"
        );
        require(!items[key].recalled, "Already recalled");
        require(bytes(reason).length > 0, "Reason required");

        items[key].recalled = true;

        emit ItemRecalled(key, items[key].manufacturer, reason, block.timestamp);
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @dev Get current owner of item
     * @param key Unique identifier
     * @return Address of current owner
     */
    function ownerOf(bytes32 key) external view returns (address) {
        require(items[key].exists, "Item does not exist");
        return items[key].currentOwner;
    }

    /**
     * @dev Get latest commit hash
     * @param key Unique identifier
     * @return Latest commit hash
     */
    function latestCommitOf(bytes32 key) external view returns (bytes32) {
        require(items[key].exists, "Item does not exist");
        return items[key].latestCommit;
    }

    /**
     * @dev Get complete item information
     * @param key Unique identifier
     * @return Item struct
     */
    function getItem(bytes32 key) 
        external 
        view 
        returns (
            bool exists,
            address currentOwner,
            address manufacturer,
            bytes32 latestCommit,
            uint256 registeredAt,
            uint256 lastTransferredAt,
            uint8 transferCount,
            bool recalled
        ) 
    {
        Item memory item = items[key];
        return (
            item.exists,
            item.currentOwner,
            item.manufacturer,
            item.latestCommit,
            item.registeredAt,
            item.lastTransferredAt,
            item.transferCount,
            item.recalled
        );
    }

    /**
     * @dev Get transfer history for an item
     * @param key Unique identifier
     * @return Array of transfer records
     */
    function getTransferHistory(bytes32 key) 
        external 
        view 
        returns (TransferRecord[] memory) 
    {
        require(items[key].exists, "Item does not exist");
        return transferHistory[key];
    }

    /**
     * @dev Get transfer history length
     * @param key Unique identifier
     * @return Number of transfers
     */
    function getTransferHistoryLength(bytes32 key) 
        external 
        view 
        returns (uint256) 
    {
        require(items[key].exists, "Item does not exist");
        return transferHistory[key].length;
    }

    /**
     * @dev Check if item exists
     * @param key Unique identifier
     * @return Boolean indicating existence
     */
    function itemExists(bytes32 key) external view returns (bool) {
        return items[key].exists;
    }

    /**
     * @dev Check if item is recalled
     * @param key Unique identifier
     * @return Boolean indicating recall status
     */
    function isRecalled(bytes32 key) external view returns (bool) {
        require(items[key].exists, "Item does not exist");
        return items[key].recalled;
    }

    /**
     * @dev Get contract statistics
     * @return Total items, total transfers
     */
    function getStats() 
        external 
        view 
        returns (uint256 totalItems, uint256 totalTxs) 
    {
        return (totalItemsRegistered, totalTransfers);
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    /**
     * @dev Pause contract (emergency)
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Check if address has any authorized role
     * @param account Address to check
     * @return Boolean indicating if authorized
     */
    function isAuthorizedEntity(address account) external view returns (bool) {
        return hasRole(MANUFACTURER_ROLE, account) ||
               hasRole(DISTRIBUTOR_ROLE, account) ||
               hasRole(PHARMACY_ROLE, account) ||
               hasRole(REGULATOR_ROLE, account);
    }
}