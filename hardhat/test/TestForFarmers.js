const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FarmManagement", function () {
  let FarmManagement;
  let farmManagement;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    // Deploy the contract
    const FarmManagementFactory = await ethers.getContractFactory("FarmManagement");
    [owner, addr1, addr2] = await ethers.getSigners();
    farmManagement = await FarmManagementFactory.deploy();
    
    // Wait for the contract to be mined
    await farmManagement.waitForDeployment();
  });

  describe("Farmer Management", function () {
    it("Should add a new farmer", async function () {
      await farmManagement.addFarmer("John Doe");
      const farmerCount = await farmManagement.farmerCount();
      expect(farmerCount).to.equal(1);

      const farmer = await farmManagement.farmers(1);
      expect(farmer.name).to.equal("John Doe");
    });

    it("Should emit FarmerAdded event", async function () {
      await expect(farmManagement.addFarmer("Jane Doe"))
        .to.emit(farmManagement, "FarmerAdded")
        .withArgs(1, "Jane Doe");
    });
  });

  describe("Crop Management", function () {
    beforeEach(async function () {
      await farmManagement.addFarmer("John Doe");
    });

    it("Should add a new crop and mint NFT", async function () {
      const ipfsHash = "QmTest...";
      await farmManagement.addCrop(1, "Wheat", 100, ipfsHash);
      
      const crop = await farmManagement.getCrop(1, 1);
      expect(crop.cropName).to.equal("Wheat");
      expect(crop.quantity).to.equal(100);
      expect(crop.ipfsHash).to.equal(ipfsHash);
    });

    it("Should emit CropAdded and NFTMinted events", async function () {
      const ipfsHash = "QmTest...";
      await expect(farmManagement.addCrop(1, "Corn", 200, ipfsHash))
        .to.emit(farmManagement, "CropAdded")
        .withArgs(1, 1, "Corn", 200, 1, ipfsHash)
        .and.to.emit(farmManagement, "NFTMinted")
        .withArgs(1, owner.address, ipfsHash);
    });

    it("Should revert when adding crop to non-existent farmer", async function () {
      await expect(farmManagement.addCrop(999, "Invalid", 100, "QmTest..."))
        .to.be.revertedWith("Invalid farmer ID");
    });
  });

  describe("NFT Functionality", function () {
    beforeEach(async function () {
      await farmManagement.addFarmer("John Doe");
      await farmManagement.addCrop(1, "Wheat", 100, "QmTest...");
    });

    it("Should transfer NFT ownership", async function () {
      await farmManagement.transferFrom(owner.address, addr1.address, 1);
      expect(await farmManagement.ownerOf(1)).to.equal(addr1.address);
    });

    it("Should return correct owner of crop NFT", async function () {
      const nftOwner = await farmManagement.ownerOfCropNFT(1, 1);
      expect(nftOwner).to.equal(owner.address);
    });
  });
});