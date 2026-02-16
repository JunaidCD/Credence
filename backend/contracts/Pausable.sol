// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Pausable
 * @dev Contract module which allows children to implement an emergency stop
 * mechanism that can be triggered by an authorized account.
 *
 * This module is used through inheritance. It will make available the
 * modifiers `whenNotPaused` and `whenPaused`, which can be applied to
 * the functions of your contract. Note that they will not be pausable by
 * simply including this module, only once the modifiers are put in place.
 */
abstract contract Pausable {
    event Paused(address account);
    event Unpaused(address account);

    bool private _paused;
    address private _pauser;

    /**
     * @dev Initializes the contract in unpaused state.
     */
    constructor() {
        _paused = false;
        _pauser = msg.sender;
    }

    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */
    function paused() public view virtual returns (bool) {
        return _paused;
    }

    /**
     * @dev Returns the address of the pauser.
     */
    function pauser() public view returns (address) {
        return _pauser;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    modifier whenNotPaused() {
        require(!paused(), "Pausable: paused");
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    modifier whenPaused() {
        require(paused(), "Pausable: not paused");
        _;
    }

    /**
     * @dev Triggers stopped state.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    function pause() public virtual whenNotPaused onlyPauser {
        _paused = true;
        emit Paused(msg.sender);
    }

    /**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    function unpause() public virtual whenPaused onlyPauser {
        _paused = false;
        emit Unpaused(msg.sender);
    }

    /**
     * @dev Throws if called by any account other than the pauser.
     */
    modifier onlyPauser() {
        require(pauser() == msg.sender, "Pausable: caller is not the pauser");
        _;
    }

    /**
     * @dev Transfers pauser role to a new account.
     */
    function transferPauserRole(address newPauser) external onlyPauser {
        require(newPauser != address(0), "Pausable: new pauser is the zero address");
        _pauser = newPauser;
    }
}
