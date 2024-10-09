const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AgriVerify", function () {
  let agriVerify;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    // Deploy the contract
    const AgriVerifyFactory = await ethers.getContractFactory("AgriVerify");
    agriVerify = await AgriVerifyFactory.deploy();
    
    // Wait for the contract to be mined
    await agriVerify.waitForDeployment();
  });

  describe("Farmer operations", function () {
    it("Should add a farmer", async function () {
      await agriVerify.addFarmer(1, "John Doe");
      const farmer = await agriVerify.getFarmerByAddress(owner.address);
      expect(farmer.id).to.equal(1);
      expect(farmer.Farmername).to.equal("John Doe");
      expect(farmer.FarmerWallet).to.equal(owner.address);
    });

    it("Should get farmer by address", async function () {
      await agriVerify.addFarmer(2, "Jane Smith");
      const farmer = await agriVerify.getFarmerByAddress(owner.address);
      expect(farmer.id).to.equal(2);
      expect(farmer.Farmername).to.equal("Jane Smith");
      expect(farmer.FarmerWallet).to.equal(owner.address);
    });
  });

  describe("Crop operations", function () {
    beforeEach(async function () {
      await agriVerify.addFarmer(1, "John Doe");
    });

    it("Should add a crop", async function () {
      await agriVerify.addCrop(owner.address, 1, 100, "Wheat", "Field A");
      const crops = await agriVerify.getCropForFarmer(owner.address);
      expect(crops.length).to.equal(1);
      expect(crops[0].cropId).to.equal(1);
      expect(crops[0].cropPrice).to.equal(100);
      expect(crops[0].cropName).to.equal("Wheat");
      expect(crops[0].location).to.equal("Field A");
    });

    it("Should get crops for a farmer", async function () {
      await agriVerify.addCrop(owner.address, 1, 100, "Wheat", "Field A");
      await agriVerify.addCrop(owner.address, 2, 150, "Corn", "Field B");
      const crops = await agriVerify.getCropForFarmer(owner.address);
      expect(crops.length).to.equal(2);
      expect(crops[0].cropName).to.equal("Wheat");
      expect(crops[1].cropName).to.equal("Corn");
    });
  });
});