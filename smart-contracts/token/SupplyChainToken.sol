// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract SupplyChainToken is ERC20, ERC20Burnable, Pausable, AccessControl, ERC20Permit, ERC20Votes {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 public constant INITIAL_SUPPLY = 1000000 * 10**18; // 1 million tokens
    uint256 public constant MAX_SUPPLY = 10000000 * 10**18; // 10 million tokens

    mapping(address => bool) private _blacklist;

    event Blacklisted(address indexed account);
    event UnBlacklisted(address indexed account);

    constructor() ERC20("SupplyChainToken", "SCT") ERC20Permit("SupplyChainToken") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(PAUSER_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender);
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
        _mint(to, amount);
    }

    function blacklist(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _blacklist[account] = true;
        emit Blacklisted(account);
    }

    function unBlacklist(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _blacklist[account] = false;
        emit UnBlacklisted(account);
    }

    function isBlacklisted(address account) public view returns (bool) {
        return _blacklist[account];
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override
    {
        require(!_blacklist[from] && !_blacklist[to], "Blacklisted address");
        super._beforeTokenTransfer(from, to, amount);
    }

    // The following functions are overrides required by Solidity.

    function _afterTokenTransfer(address from, address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._burn(account, amount);
    }
}
