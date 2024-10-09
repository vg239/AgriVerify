// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AgriVerify {
    struct Crop {
        uint256 cropId;
        uint256 cropPrice;
        string cropName;
        string location;
    }

    struct Farmer {
        address FarmerWallet;
        uint256 id;
        string Farmername;
        Crop[] crops;
    }

    mapping(address => Farmer) public farmers;


    // Add farmer 
    function addFarmer(
        uint256 _id,
        string memory _farmerName
    ) public {
        Farmer storage newFarmer = farmers[msg.sender];
        newFarmer.FarmerWallet = msg.sender;
        newFarmer.id = _id;
        newFarmer.Farmername = _farmerName;
        delete newFarmer.crops;

    }

    // Function to get farmer by address
    function getFarmerByAddress(address _address) external view returns (Farmer memory) {
        return farmers[_address];
    }

    // Add crop function
    function addCrop(
        address _address, 
        uint256 _cropId,
        uint256 _cropPrice,
        string memory _cropname,
        string memory _location
    ) public {
        Crop memory newCrop = Crop({
            cropId: _cropId,
            cropPrice: _cropPrice,
            cropName: _cropname,
            location: _location
        });

        farmers[_address].crops.push(newCrop);

    }

    // Function to get crops for a farmer
    function getCropForFarmer(
        address _address
    ) public  view returns (Crop[] memory) {
        Crop[] memory crops = farmers[_address].crops;
        return crops;
    }
}