// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FarmManagement {
    // Struct for a crop
    struct Crop {
        uint cropId;
        string cropName;
        uint quantity;
    }

    // Struct for a farmer
    struct Farmer {
        uint farmerId;
        string name;
        mapping(uint => Crop) crops; // Mapping from cropId to Crop
        uint cropCount; // Track number of crops for auto-incrementing cropId
    }

    // State variables
    mapping(uint => Farmer) public farmers; // Mapping from farmerId to Farmer
    uint public farmerCount = 0; // Track number of farmers for auto-incrementing farmerId

    // Events
    event FarmerAdded(uint farmerId, string name);
    event CropAdded(uint farmerId, uint cropId, string cropName, uint quantity);

    // Function to add a new farmer
    function addFarmer(string memory _name) public {
        farmerCount++;
        Farmer storage newFarmer = farmers[farmerCount];
        newFarmer.farmerId = farmerCount;
        newFarmer.name = _name;
        newFarmer.cropCount = 0;

        emit FarmerAdded(farmerCount, _name);
    }

    // Function to add a new crop for a specific farmer
    function addCrop(uint _farmerId, string memory _cropName, uint _quantity) public {
        require(_farmerId > 0 && _farmerId <= farmerCount, "Invalid farmer ID");
        
        Farmer storage farmer = farmers[_farmerId];
        farmer.cropCount++;
        uint newCropId = farmer.cropCount;

        farmer.crops[newCropId] = Crop(newCropId, _cropName, _quantity);

        emit CropAdded(_farmerId, newCropId, _cropName, _quantity);
    }

    // Function to get a specific crop's details by farmerId and cropId
    function getCrop(uint _farmerId, uint _cropId) public view returns (uint, string memory, uint) {
        require(_farmerId > 0 && _farmerId <= farmerCount, "Invalid farmer ID");
        Farmer storage farmer = farmers[_farmerId];
        Crop storage crop = farmer.crops[_cropId];
        return (crop.cropId, crop.cropName, crop.quantity);
    }
}