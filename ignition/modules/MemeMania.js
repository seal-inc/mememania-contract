const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
module.exports = buildModule("MemeMania", (m) => {
  const degen = m.getParameter(
    "token1",
    "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed"
  );
  const higher = m.getParameter(
    "token2",
    "0x0578d8a44db98b23bf096a382e016e29a5ce0ffe"
  );
  const tybg = m.getParameter(
    "token3",
    "0x0d97f261b1e88845184f678e2d1e7a98d9fd38de"
  );
  const usdc = m.getParameter(
    "token4",
    "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
  );

  const memeMania = m.contract("MemeMania", [degen, higher, tybg, usdc]);

  return { memeMania };
});
