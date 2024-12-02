const { ethers } = require("hardhat");

async function main() {
  const STAND_ADDRESS = "YOUR_STAND_CONTRACT_ADDRESS";
  const USDC_ADDRESS = "YOUR_USDC_ADDRESS";
  const PRIVATE_KEY = "YOUR_AUTHORIZED_SIGNER_PRIVATE_KEY";

  // Setup authorized signer
  const signer = new ethers.Wallet(PRIVATE_KEY, ethers.provider);

  const stand = await ethers.getContractAt("Stand", STAND_ADDRESS);
  const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);

  try {
    const balance = await usdc.balanceOf(STAND_ADDRESS);
    console.log("Contract USDC balance:", balance.toString());

    if (balance <= 0n) {
      console.log("No USDC to withdraw");
      return;
    }

    const userIdentifier = 1;
    const nonce = (await stand.lastUsedNonces(userIdentifier)) + 1n;

    const messageHash = ethers.solidityPackedKeccak256(
      ["uint256", "uint256", "uint256"],
      [userIdentifier, nonce, balance]
    );

    const signature = await signer.signMessage(ethers.getBytes(messageHash));

    const tx = await stand.withdraw(userIdentifier, nonce, balance, signature);
    console.log("Withdrawal tx:", tx.hash);

    const receipt = await tx.wait();
    console.log("Withdrawal successful in block:", receipt.blockNumber);

    const finalBalance = await usdc.balanceOf(STAND_ADDRESS);
    console.log("Final contract USDC balance:", finalBalance.toString());
  } catch (error) {
    console.error("Error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
