require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ignition");


const ALCHEMY_API_KEY = import.meta.env.VITE_ALCHEMY_API_KEY;
const SEPOLIA_PRIVATE_KEY = import.meta.env.VITE_SEPOLIA_PRIVATE_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.27",
  networks: {
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [`0x${SEPOLIA_PRIVATE_KEY}`]
    }
  }
};