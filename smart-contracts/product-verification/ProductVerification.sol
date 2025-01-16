// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ProductVerification is AccessControl, Pausable, ReentrancyGuard {
    using Counters for Counters.Counter;

    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant RETAILER_ROLE = keccak256("RETAILER_ROLE");
    bytes32 public constant CERTIFIER_ROLE = keccak256("CERTIFIER_ROLE");

    Counters.Counter private _productIds;

    struct Product {
        uint256 id;
        string name;
        address manufacturer;
        uint256 manufacturingDate;
        string batchNumber;
        address currentOwner;
        ProductStatus status;
        string metadata;
    }

    struct Transfer {
        address from;
        address to;
        uint256 timestamp;
        string location;
    }

    enum ProductStatus { Created, InTransit, Delivered, Sold, Recalled }

    mapping(uint256 => Product) private _products;
    mapping(uint256 => Transfer[]) private _transferHistory;
    mapping(uint256 => mapping(address => bool)) private _productCertifications;

    event ProductCreated(uint256 indexed productId, string name, address indexed manufacturer);
    event ProductTransferred(uint256 indexed productId, address indexed from, address indexed to, string location);
    event ProductStatusUpdated(uint256 indexed productId, ProductStatus status);
    event ProductCertified(uint256 indexed productId, address indexed certifier);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function createProduct(
        string memory name,
        string memory batchNumber,
        string memory metadata
    ) 
        external 
        onlyRole(MANUFACTURER_ROLE) 
        whenNotPaused 
        returns (uint256)
    {
        _productIds.increment();
        uint256 newProductId = _productIds.current();

        Product memory newProduct = Product({
            id: newProductId,
            name: name,
            manufacturer: msg.sender,
            manufacturingDate: block.timestamp,
            batchNumber: batchNumber,
            currentOwner: msg.sender,
            status: ProductStatus.Created,
            metadata: metadata
        });

        _products[newProductId] = newProduct;

        emit ProductCreated(newProductId, name, msg.sender);

        return newProductId;
    }

    function transferProduct(
        uint256 productId, 
        address to, 
        string memory location
    ) 
        external 
        onlyRole(DISTRIBUTOR_ROLE) 
        whenNotPaused 
        nonReentrant 
    {
        require(_products[productId].currentOwner == msg.sender, "Not the current owner");
        require(to != address(0), "Invalid recipient");

        _products[productId].currentOwner = to;
        _products[productId].status = ProductStatus.InTransit;

        Transfer memory newTransfer = Transfer({
            from: msg.sender,
            to: to,
            timestamp: block.timestamp,
            location: location
        });

        _transferHistory[productId].push(newTransfer);

        emit ProductTransferred(productId, msg.sender, to, location);
        emit ProductStatusUpdated(productId, ProductStatus.InTransit);
    }

    function updateProductStatus(uint256 productId, ProductStatus newStatus) 
        external 
        onlyRole(RETAILER_ROLE) 
        whenNotPaused 
    {
        require(_products[productId].currentOwner == msg.sender, "Not the current owner");
        require(newStatus != ProductStatus.Created, "Cannot revert to Created status");

        _products[productId].status = newStatus;

        emit ProductStatusUpdated(productId, newStatus);
    }

    function certifyProduct(uint256 productId) 
        external 
        onlyRole(CERTIFIER_ROLE) 
        whenNotPaused 
    {
        require(!_productCertifications[productId][msg.sender], "Product already certified by this certifier");

        _productCertifications[productId][msg.sender] = true;

        emit ProductCertified(productId, msg.sender);
    }

    function getProduct(uint256 productId) 
        external 
        view 
        returns (
            uint256 id,
            string memory name,
            address manufacturer,
            uint256 manufacturingDate,
            string memory batchNumber,
            address currentOwner,
            ProductStatus status,
            string memory metadata
        ) 
    {
        Product memory product = _products[productId];
        return (
            product.id,
            product.name,
            product.manufacturer,
            product.manufacturingDate,
            product.batchNumber,
            product.currentOwner,
            product.status,
            product.metadata
        );
    }

    function getTransferHistory(uint256 productId) 
        external 
        view 
        returns (Transfer[] memory) 
    {
        return _transferHistory[productId];
    }

    function isProductCertified(uint256 productId, address certifier) 
        external 
        view 
        returns (bool) 
    {
        return _productCertifications[productId][certifier];
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
