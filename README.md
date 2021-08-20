# Yunt-Wrapper

# Usage
```solidity
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
```

# Development
## In order to install depencencies:
`npm install`

## Run test node:
`npx hardhat node`


## In order to run test:
`npm t`

## In order to run test coverage:
`npx hardhat coverage --network localhost`
