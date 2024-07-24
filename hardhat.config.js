require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    hardhat: {
      forking: {
        // eslint-disable-next-line
        enabled: true,
        url: `https://base-mainnet.g.alchemy.com/v2/ojicEXEHWvIky0LXyFh9gm8b812slrpy`,
      },
    },
  },
};
