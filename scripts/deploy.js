async function main() {
    // Deploy sample erc-1155, only useful for testing purposes
    const AERC1155 = await ethers.getContractFactory("AERC1155");
    const aERC1155 = await AERC1155.deploy();
    console.log("Sample ERC-1155 deployed to:", aERC1155.address);

    // Deploy the actual wrapper
    const name = "Wrapped YUNT NFTS";
    const symbol = "wYUNT";
    const nft_base_address = await aERC1155.address;
    const gov = "0x2333618CfA5769AeA442a78F5Dd66683839ddf5C";

    const WrappedERC1155 = await ethers.getContractFactory("WrappedERC1155");
    const wrapper = await WrappedERC1155.deploy(name, symbol, nft_base_address, gov);

    console.log("Wrapper deployed to:", wrapper.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
