const { ethers } = require("hardhat")
const { BigNumber } = ethers;
const { use, expect } = require("chai")
const { solidity } = require("ethereum-waffle");

use(solidity);

describe("WrappedERC1155", function () {
    before(async function () {
        this.AERC1155 = await ethers.getContractFactory("AERC1155")
        this.WrappedERC1155 = await ethers.getContractFactory("WrappedERC1155")
        this.signers = await ethers.getSigners()
        this.alpha = this.signers[0]
        this.beta = this.signers[1]
        this.omega = this.signers[2]
    })

    beforeEach(async function () {
        this.base = await this.AERC1155.deploy()
        this.wrapped = await this.WrappedERC1155.deploy("YUNT NFT WRAPPER CONTRACT", "wYUNT", this.base.address, this.alpha.address)
        await this.wrapped.deployed()

        await this.base.safeMint(this.alpha.address, "0x00")
        await this.base.connect(this.alpha).setApprovalForAll(this.wrapped.address, true)
        await this.base.connect(this.beta).setApprovalForAll(this.wrapped.address, true)

        for (const id of [...Array(3).keys()].map(i => BigNumber.from(i + 1))) {
            await this.base.safeMint(this.beta.address, id)
        }

    })

    it("should have correct name and symbol and decimal", async function () {
        expect(await this.wrapped.name()).to.equal("YUNT NFT WRAPPER CONTRACT")
        expect(await this.wrapped.symbol()).to.equal("wYUNT")
        expect(await this.wrapped.decimals()).to.equal(1)
        expect(await this.wrapped.cap()).to.equal(1)
    })

    it("should redirect eth sent to it to governance address", async function () {
        const balanceGovernanceBefore =  await this.alpha.getBalance();
        await this.beta.sendTransaction({
            to: this.wrapped.address,
            value: ethers.utils.parseEther("1.0"),
        });
        const balanceGovernanceAfter =  await this.alpha.getBalance();

        expect(ethers.utils.formatEther(balanceGovernanceAfter.sub(balanceGovernanceBefore))).to.eq("1.0")
    })

    it("should be able to change governance", async function () {
        expect(await this.wrapped.governance()).to.equal(this.alpha.address)

        await expect(this.wrapped.connect(this.omega).setPendingGovernance(this.omega.address))
            .to.be.revertedWith("Can only be called by governance")

        await expect(this.wrapped.connect(this.alpha).setPendingGovernance("0x0000000000000000000000000000000000000000"))
            .to.be.revertedWith("Pending governance address cannot be zero address")

        await expect(await this.wrapped.connect(this.alpha).setPendingGovernance(this.omega.address))
            .to.emit(this.wrapped, "PendingGovernanceUpdated")
            .withArgs(this.omega.address)

        expect(await this.wrapped.governance()).to.equal(this.alpha.address)
        expect(await this.wrapped.pendingGovernance()).to.equal(this.omega.address)

        await expect(this.wrapped.connect(this.alpha).acceptGovernance())
            .to.be.revertedWith("Can only be called by pending governance")

        await expect(this.wrapped.connect(this.omega).acceptGovernance())
            .to.emit(this.wrapped, "GovernanceUpdated")
            .withArgs(this.omega.address)

        expect(await this.wrapped.governance()).to.equal(this.omega.address)
        expect(await this.wrapped.pendingGovernance()).to.equal(this.omega.address)

        await this.wrapped.connect(this.omega).setPendingGovernance(this.alpha.address)
        await this.wrapped.connect(this.omega).setPendingGovernance(this.beta.address)

        await expect(this.wrapped.connect(this.alpha).acceptGovernance())
            .to.be.revertedWith("Can only be called by pending governance")


        await expect(this.wrapped.connect(this.beta).acceptGovernance())
            .to.emit(this.wrapped, "GovernanceUpdated")
            .withArgs(this.beta.address)

        expect(await this.wrapped.governance()).to.equal(this.beta.address)
        expect(await this.wrapped.pendingGovernance()).to.equal(this.beta.address)


    })

    it("should only allow approved to mint and burn tokens", async function () {

        await expect(this.wrapped.connect(this.alpha).mint(this.alpha.address, "0x00"))
            .emit(this.wrapped, "Mint")
            .withArgs(this.alpha.address, this.alpha.address, "0x00", 1)

        expect(await this.base.connect(this.alpha).balanceOf(this.wrapped.address, "0x00")).to.equal(1)

        expect(await this.wrapped.balanceOf(this.alpha.address)).to.equal(1)
        expect(await this.wrapped.totalSupply()).to.equal(1)
        expect(await this.wrapped.balanceOf(this.beta.address)).to.equal(0)
        expect(await this.wrapped.balanceOf(this.omega.address)).to.equal(0)

        await expect(this.wrapped.connect(this.beta).mint(this.beta.address, "0x01"))
            .to.be.revertedWith("Can only wrap one erc-1155 at a time")

        await this.wrapped.connect(this.alpha).approve(this.alpha.address, 1);

        await expect(this.wrapped.connect(this.alpha).burn(this.alpha.address, this.omega.address))
            .emit(this.wrapped, "Burn")
            .withArgs(this.alpha.address, this.omega.address, "0x00", 1)

        expect(await this.base.connect(this.alpha).balanceOf(this.wrapped.address, "0x00")).to.equal(0)
        expect(await this.base.connect(this.alpha).balanceOf(this.alpha.address, "0x00")).to.equal(0)
        expect(await this.base.connect(this.alpha).balanceOf(this.omega.address, "0x00")).to.equal(1)
    })

    it("should supply token transfers properly", async function () {
        await this.wrapped.connect(this.beta).mint(this.omega.address, "0x01")
        await this.wrapped.connect(this.omega).approve(this.omega.address, 1)

        expect(await this.wrapped.totalSupply()).to.equal(1)
        expect(await this.wrapped.balanceOf(this.beta.address)).to.equal(0)
        expect(await this.wrapped.balanceOf(this.omega.address)).to.equal(1)

        await this.wrapped.connect(this.omega).transfer(this.alpha.address, 1)

        expect(await this.wrapped.balanceOf(this.alpha.address)).to.equal(1)
        expect(await this.wrapped.balanceOf(this.omega.address)).to.equal(0)

        await this.wrapped.connect(this.alpha).approve(this.wrapped.address, 1)
        expect(await this.wrapped.allowance(this.alpha.address, this.wrapped.address)).to.equal(1)

        await this.wrapped.connect(this.alpha).decreaseAllowance(this.wrapped.address, 1)
        expect(await this.wrapped.allowance(this.alpha.address, this.wrapped.address)).to.equal(0)

        await this.wrapped.connect(this.alpha).increaseAllowance(this.omega.address, 1)
        expect(await this.wrapped.allowance(this.alpha.address, this.omega.address)).to.equal(1)

        await this.wrapped.connect(this.omega).transferFrom(this.alpha.address, this.omega.address, 1)
        expect(await this.wrapped.balanceOf(this.omega.address)).to.equal(1)

    })

    it("should not be able to send erc-1155's directly to the wrapper" , async function () {
        await expect(this.base.connect(this.alpha).safeTransferFrom(this.alpha.address, this.base.address, "0x00", 1, []))
            .to.be.revertedWith("ERC1155: transfer to non ERC1155Receiver implementer")

        await expect(this.base.connect(this.beta).safeBatchTransferFrom(this.beta.address, this.base.address, ["0x01", "0x02", "0x03"], [1, 1, 1], []))
            .to.be.revertedWith("ERC1155: transfer to non ERC1155Receiver implementer")

        await expect(this.base.connect(this.beta).safeBatchTransferFrom(this.beta.address, this.base.address, ["0x01"], [1], []))
            .to.be.revertedWith("ERC1155: transfer to non ERC1155Receiver implementer")
    });

    it("should implement correct ERC-165 interface" , async function () {
        expect(await this.wrapped.supportsInterface("0x4e2312e0")).to.equal(true)//ERC1155TokenReceiver
        expect(await this.wrapped.supportsInterface("0x01ffc9a7")).to.equal(true)//ERC165
        expect(await this.wrapped.supportsInterface("0xffffffff")).to.equal(false)//Invalid
    });

    it("should implement complete ERC-1155 Receiver interface", async function () {
        await this.wrapped.connect(this.beta).onERC1155BatchReceived(this.omega.address,this.omega.address, [1],[1],"0x01")
    });
})
