// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IWrapper.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/**
 * @dev Implementation of IWrapper
 */
contract WrappedERC1155 is
ERC20Capped,
IWrapper,
IERC1155Receiver
{

    using Address for address;

    // Address of the ERC1155 underlying token.
    address public _baseAddress;
    uint256 private _rate;
    uint256 private _tokenID;

    // The address of the account which currently has administrative capabilities over this contract.
    // This is the same address that ethereum payments will be forwarded to.
    address public governance;

    // The address of the pending governance.
    address public pendingGovernance;

    // Event emitted when governance hand over was completed
    event GovernanceUpdated(
        address governance
    );

    // Event emitted when governance hand over is initiated
    event PendingGovernanceUpdated(
        address pendingGovernance
    );

    // Checks that the current message sender or caller is the governance address.
    modifier onlyGov() {
        require(msg.sender == governance, "Can only be called by governance");
        _;
    }

    // Checks that the current message sender or caller is the pending governance address.
    modifier onlyPendingGov() {
        require(msg.sender == pendingGovernance, "Can only be called by pending governance");
        _;
    }

    constructor (
        string memory name,
        string memory symbol,
        address baseAddress_,
        address _governance
    ) ERC20(name, symbol) ERC20Capped(1) {
        _baseAddress = baseAddress_;
        governance = _governance;
    }

    // Execute before a new derivative token is minted.
    function _beforeMint(uint256 id) internal {
        IERC1155(_baseAddress).safeTransferFrom(msg.sender, address(this), id, 1, "");
    }

    // Call in order to wrap an erc-1155 token in exchange of a derivate token.
    function mint(
        address _to,
        uint256 _id
    ) external override {
        require(totalSupply() < 1, "Can only wrap one erc-1155 at a time");
        _beforeMint(_id);
        _mint(_to, 1);

        emit Mint(msg.sender, _to, _id, 1);
    }

    // Transfer the base token (Wrapped erc-1155 token).
    function _transferBase(address _account, uint256 _id) internal {
        IERC1155(_baseAddress).safeTransferFrom(address(this), _account, _id, 1, "");
    }

    // Call after a token burn was performed.
    function _afterBurn(
        address _from,
        address _to,
        uint256 _id
    ) internal {
        _transferBase(_to, _id);
        emit Burn(_from, _to, _id, 1);
    }

    // Burn a derivative token in exchange for the wrapped base erc-1155 token.
    function burn(
        address _from,
        address _to
    ) external override {
        _burnFrom(_from, 1);
        _afterBurn(_from, _to, _tokenID);
    }

    // Destroys `amount` tokens from `account`
    function _burnFrom(address account, uint256 amount) internal {
        uint256 _allowance = allowance(account, _msgSender());
        require(_allowance >= amount, "ERC20: burn amount exceeds allowance");
        uint256 decreasedAllowance = _allowance - amount;

        _approve(account, _msgSender(), decreasedAllowance);
        _burn(account, amount);
    }

    // Called when an erc-1155 token is received.
    function onERC1155Received(
        address,
        address,
        uint256 id,
        uint256,
        bytes calldata
    ) external override returns (bytes4) {
        _tokenID = id;
        return this.onERC1155Received.selector;
    }

    // Called when a batch of erc-1155 token are received.
    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external override pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    // Standard method from IERC165
    function supportsInterface(bytes4 interfaceId) external override pure returns (bool) {
        return interfaceId == type(IERC1155Receiver).interfaceId
            || interfaceId == type(IERC165).interfaceId;
    }

    /// @dev Sets the pending governance.
    ///
    /// This function reverts if the new pending governance is the zero address or the caller is not the current
    /// governance. This is to prevent the contract governance being set to the zero address which would deadlock
    /// privileged contract functionality.
    ///
    /// @param _pendingGovernance the new pending governance.
    function setPendingGovernance(address _pendingGovernance) external onlyGov {
        require(_pendingGovernance != address(0), "Pending governance address cannot be zero address");
        pendingGovernance = _pendingGovernance;

        emit PendingGovernanceUpdated(_pendingGovernance);
    }

    // Accepts the governance role.
    // This function reverts if the caller is not the new pending governance.
    function acceptGovernance() external onlyPendingGov {
        governance = pendingGovernance;

        emit GovernanceUpdated(governance);
    }

    // @dev Returns the number of decimals used to get its user representation.
    function decimals() public override view virtual returns (uint8) {
        return 1;
    }

    // This fallback method forwards received ethereum to the governance address.
    receive() external payable  {
        payable(governance).transfer(msg.value);
    }
}
