// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
// this code I deployed on remix vg try hardhat
contract AgriVerify {
    struct Crop {
        uint256 cropId;
        uint256 cropPrice;
        string cropName;
        string location;
    }

    struct Farmer {
        address farmerWallet;
        uint256 id;
        string farmerName;
        Crop[] crops;
    }

    mapping(address => Farmer) public farmers;

    // Function to add or update farmer details
    function addOrUpdateFarmer(uint256 _id, string memory _farmerName) public {
        Farmer storage farmer = farmers[msg.sender];
        
        // Check if this is a new farmer ID
        if (farmer.id != _id) {
            // Clear the crops array for new farmer ID
            delete farmer.crops;
        }

        farmer.farmerWallet = msg.sender;
        farmer.id = _id;
        farmer.farmerName = _farmerName;
    }

    // Function to add a new crop for the farmer
    function addCrop(
        uint256 _cropId,
        uint256 _cropPrice,
        string memory _cropName,
        string memory _location
    ) public {
        Crop memory newCrop = Crop({
            cropId: _cropId,
            cropPrice: _cropPrice,
            cropName: _cropName,
            location: _location
        });

        farmers[msg.sender].crops.push(newCrop);
    }

    // Function to fetch all farmer and crop details
    function getFarmerAndCropDetails(address _farmerAddress) public view returns (
        address farmerWallet,
        uint256 id,
        string memory farmerName,
        Crop[] memory crops
    ) {
        Farmer storage farmer = farmers[_farmerAddress];
        return (
            farmer.farmerWallet,
            farmer.id,
            farmer.farmerName,
            farmer.crops
        );
    }
}