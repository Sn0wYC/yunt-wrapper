// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.9.0;
import "@openzeppelin/contracts/token/ERC1155/presets/ERC1155PresetMinterPauser.sol";

contract AERC1155 is ERC1155 {

    constructor() ERC1155("https://game.example/api/item/{id}.json") {
    }

    function safeMint(address to, uint256 tokenId) external {
        _mint(to, tokenId, 1, "");
    }
}
