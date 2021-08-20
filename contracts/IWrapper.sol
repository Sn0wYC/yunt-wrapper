// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IWrapper {
    /**
     * @dev MUST emit when a mint occurs where a single {Base} token is received by the {Pool}.
     * The `_from` argument MUST be the address of the account that sent the {Base} token.
     * The `_to` argument MUST be the address of the account that received the {Derivative} token(s).
     * The `_id` argument MUST be the id of the {Base} token transferred.
     * The `_value` argument MUST be the number of {Derivative} tokens minted.
     */
    event Mint (address indexed _from, address indexed _to, uint256 _id, uint256 _value);

    /**
     * @dev MUST emit when a burn occurs where a single {Base} token is sent by the {Wrapper}.
     * The `_from` argument MUST be the address of the account that sent the {Derivative} token(s).
     * The `_to` argument MUST be the address of the account that received the {Base} token.
     * The `_id` argument MUST be the id of the {Base} token transferred.
     * The `_value` argument MUST be the number of {Derivative} tokens burned.
     */
    event Burn (address indexed _from, address indexed _to, uint256 _id, uint256 _value);

    /**
     * @notice Transfers the {Base} token with `_id` from `msg.sender` to the {Pool} and mints {Derivative} token(s) to `_to`.
     * @param _to       Target address.
     * @param _id       Id of the {Base} token.
     *
     * Emits a {Mint} event.
     */
    function mint(
        address _to,
        uint256 _id
    ) external;

    /**
     * @notice Burns {Derivative} token(s) from `_from` and transfers `_amounts` of some {Base} token from the {Pool} to `_to`.
     * @param _from     Source address.
     * @param _to       Target address.
     *
     * Emits either a {Burn} event.
     */
    function burn(
        address _from,
        address _to
    ) external;
}
