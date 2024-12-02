require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.26",
  networks: {
    hardhat: {
      forking: {
        enabled: true,
        url: `https://base-mainnet.g.alchemy.com/v2/ojicEXEHWvIky0LXyFh9gm8b812slrpy`,
      },
    },
    base: {
      url: `https://base-mainnet.g.alchemy.com/v2/ojicEXEHWvIky0LXyFh9gm8b812slrpy`,
    },
  },
};
