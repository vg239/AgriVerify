const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const FarmManagementModule = buildModule("FarmManagementModule", (m) => {
  const farmManagement = m.contract("FarmManagement");

  // You can add initialization logic here if needed
  // For example, adding an initial farmer:
  // m.call(farmManagement, "addFarmer", ["Initial Farmer"]);

  return { farmManagement };
});

module.exports = FarmManagementModule;
