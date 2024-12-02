const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Stand", function () {
  async function deployStandFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy mock USDC token
    const USDC = await ethers.getContractFactory("ERC20Mock");
    const usdc = await USDC.deploy("USDC", "USDC", owner.address, 1000000n);

    // Deploy Stand contract
    const Stand = await ethers.getContractFactory("Stand");
    const stand = await Stand.deploy(usdc.target, owner.address);

    // Transfer USDC to Stand contract
    await usdc.transfer(stand.target, 1000n);

    return { stand, usdc, owner, addr1, addr2 };
  }

  describe("Deployment", function () {
    it("Should set the right authorized signer", async function () {
      const { stand, owner } = await loadFixture(deployStandFixture);
      expect(await stand.authorizedSigner()).to.equal(owner.address);
    });

    it("Should receive and store the USDC", async function () {
      const { stand, usdc } = await loadFixture(deployStandFixture);
      expect(await usdc.balanceOf(stand.target)).to.equal(1000n);
    });
  });

  describe("Withdraw", function () {
    it("Should allow withdrawing amount", async function () {
      const { stand, usdc, owner, addr1 } = await loadFixture(
        deployStandFixture
      );

      const amount = 50n;
      const userIdentifier = 1;
      const nonce = 1;

      const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "uint256"],
        [userIdentifier, nonce, amount]
      );

      const signature = await owner.signMessage(ethers.getBytes(messageHash));

      await expect(
        stand.connect(addr1).withdraw(userIdentifier, nonce, amount, signature)
      )
        .to.emit(stand, "Withdrawn")
        .withArgs(addr1.address, amount, nonce, userIdentifier);

      expect(await usdc.balanceOf(addr1.address)).to.equal(amount);
    });

    it("Should revert with the right error if nonce is reused", async function () {
      const { stand, owner, addr1 } = await loadFixture(deployStandFixture);

      const amount = 10n;
      const userIdentifier = 1;
      const nonce = 1;

      const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "uint256"],
        [userIdentifier, nonce, amount]
      );

      const signature = await owner.signMessage(ethers.getBytes(messageHash));

      await stand
        .connect(addr1)
        .withdraw(userIdentifier, nonce, amount, signature);

      await expect(
        stand.connect(addr1).withdraw(userIdentifier, nonce, amount, signature)
      ).to.be.revertedWith("Nonce must be greater than the last used nonce");
    });

    it("Should revert with the right error if signature is invalid", async function () {
      const { stand, owner, addr1 } = await loadFixture(deployStandFixture);

      const amount = 10n;
      const userIdentifier = 1;
      const nonce = 1;

      const messageHash = ethers.solidityPackedKeccak256(
        ["uint256", "uint256", "uint256"],
        [userIdentifier, nonce, amount]
      );

      const invalidSignature = await addr1.signMessage(
        ethers.getBytes(messageHash)
      );

      await expect(
        stand
          .connect(addr1)
          .withdraw(userIdentifier, nonce, amount, invalidSignature)
      )
        .to.be.revertedWithCustomError(stand, "InvalidSigner")
        .withArgs(owner.address, addr1.address);
    });
  });
});
