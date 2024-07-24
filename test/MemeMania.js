const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { randomBytes } = require("ethers");
const { ethers } = require("hardhat");

describe("MemeMania", function () {
  async function deployMemeManiaFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy mock ERC20 tokens
    const Token1 = await ethers.getContractFactory("ERC20Mock");
    const token1 = await Token1.deploy("Token1", "TK1", owner.address, 1000n);
    const token2 = await Token1.deploy("Token2", "TK2", owner.address, 1000n);
    const token3 = await Token1.deploy("Token3", "TK3", owner.address, 1000n);
    const token4 = await Token1.deploy("Token4", "TK4", owner.address, 1000n);

    // Deploy MemeMania contract
    const MemeMania = await ethers.getContractFactory("MemeMania");
    const memeMania = await MemeMania.deploy(
      token1.target,
      token2.target,
      token3.target,
      token4.target
    );

    // Transfer tokens to MemeMania contract
    await token1.transfer(memeMania.target, 100n);
    await token2.transfer(memeMania.target, 100n);
    await token3.transfer(memeMania.target, 100n);
    await token4.transfer(memeMania.target, 100n);

    return { memeMania, token1, token2, token3, token4, owner, addr1, addr2 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { memeMania, owner } = await loadFixture(deployMemeManiaFixture);
      expect(await memeMania.owner()).to.equal(owner.address);
    });

    it("Should receive and store the tokens", async function () {
      const { memeMania, token1, token2, token3, token4 } = await loadFixture(
        deployMemeManiaFixture
      );

      expect(await token1.balanceOf(memeMania.target)).to.equal(100n);
      expect(await token2.balanceOf(memeMania.target)).to.equal(100n);
      expect(await token3.balanceOf(memeMania.target)).to.equal(100n);
      expect(await token4.balanceOf(memeMania.target)).to.equal(100n);
    });
  });

  describe("Claim Rewards", function () {
    it("Should allow claiming multiple rewards", async function () {
      const { memeMania, token1, token2, token3, token4, owner, addr1 } =
        await loadFixture(deployMemeManiaFixture);

      const TokenType = {
        TOKEN1: 0,
        TOKEN2: 1,
        TOKEN3: 2,
        TOKEN4: 3,
      };

      const rewards = [
        { amount: 1, tokenType: TokenType.TOKEN1, nonce: randomBytes(32) },
        { amount: 2, tokenType: TokenType.TOKEN2, nonce: randomBytes(32) },
        { amount: 3, tokenType: TokenType.TOKEN3, nonce: randomBytes(32) },
        { amount: 4, tokenType: TokenType.TOKEN4, nonce: randomBytes(32) },
      ];

      const signatures = await Promise.all(
        rewards.map(async (reward) => {
          const messageHash = ethers.solidityPackedKeccak256(
            ["address", "uint256", "uint8", "bytes32"],
            [
              addr1.address.toLowerCase(),
              reward.amount,
              reward.tokenType,
              reward.nonce,
            ]
          );
          const messageHashBytes = ethers.getBytes(messageHash);
          return await owner.signMessage(messageHashBytes);
        })
      );

      const claimRewards = rewards.map((reward, index) => ({
        ...reward,
        signature: signatures[index],
      }));

      console.log(claimRewards);

      await expect(memeMania.connect(addr1).claimRewards(claimRewards))
        .to.emit(memeMania, "RewardClaimed")
        .withArgs(addr1.address, rewards[0].amount, rewards[0].tokenType)
        .and.to.emit(memeMania, "RewardClaimed")
        .withArgs(addr1.address, rewards[1].amount, rewards[1].tokenType)
        .and.to.emit(memeMania, "RewardClaimed")
        .withArgs(addr1.address, rewards[2].amount, rewards[2].tokenType)
        .and.to.emit(memeMania, "RewardClaimed")
        .withArgs(addr1.address, rewards[3].amount, rewards[3].tokenType);

      expect(await token1.balanceOf(addr1.address)).to.equal(1n);
      expect(await token2.balanceOf(addr1.address)).to.equal(2n);
      expect(await token3.balanceOf(addr1.address)).to.equal(3n);
      expect(await token4.balanceOf(addr1.address)).to.equal(4n);
    });

    it("Should revert with the right error if signature is reused", async function () {
      const { memeMania, token1, token2, token3, token4, owner, addr1 } =
        await loadFixture(deployMemeManiaFixture);

      const TokenType = {
        TOKEN1: 0,
        TOKEN2: 1,
        TOKEN3: 2,
        TOKEN4: 3,
      };

      const reward = {
        amount: 1n,
        tokenType: TokenType.TOKEN1,
        nonce: randomBytes(32),
      };
      const messageHash = ethers.solidityPackedKeccak256(
        ["address", "uint256", "uint8", "bytes32"],
        [addr1.address, reward.amount, reward.tokenType, reward.nonce]
      );
      const messageHashBytes = ethers.getBytes(messageHash);
      const signature = await owner.signMessage(messageHashBytes);

      const claimRewards = [{ ...reward, signature }];

      await memeMania.connect(addr1).claimRewards(claimRewards);

      await expect(
        memeMania.connect(addr1).claimRewards(claimRewards)
      ).to.be.revertedWith("Signature already used");
    });

    it("Should revert with the right error if signature is invalid", async function () {
      const { memeMania, token1, token2, token3, token4, addr1 } =
        await loadFixture(deployMemeManiaFixture);

      const TokenType = {
        TOKEN1: 0,
        TOKEN2: 1,
        TOKEN3: 2,
        TOKEN4: 3,
      };

      const reward = {
        amount: 1n,
        tokenType: TokenType.TOKEN1,
        nonce: randomBytes(32),
      };
      const messageHash = ethers.solidityPackedKeccak256(
        ["address", "uint256", "uint8", "bytes32"],
        [
          addr1.address.toLowerCase(),
          reward.amount,
          reward.tokenType,
          reward.nonce,
        ]
      );
      const messageHashBytes = ethers.getBytes(messageHash);
      const invalidSignature = await addr1.signMessage(messageHashBytes);

      const claimRewards = [{ ...reward, signature: invalidSignature }];

      

      await expect(
        memeMania.connect(addr1).claimRewards(claimRewards)
      ).to.be.revertedWith("Invalid signature");
    });
  });
});
