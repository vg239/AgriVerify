const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("AgriVerifyModule", (m) => {

  const agriVerify = m.contract("AgriVerify");

  return { agriVerify };
});
