require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ignition");
require("dotenv").config();

const ALCHEMY_API_KEY = 'lQZfG4SqJSoj1lBu4NsFN1AbmHhRhA';
const SEPOLIA_PRIVATE_KEY = '8b18ff2be71a2bc96dc05a5ff84c84f7514edf807fcae73dfb70e8760cc7ad06';

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