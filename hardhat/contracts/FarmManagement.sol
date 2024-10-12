// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract FarmManagement is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // Struct for a crop
    struct Crop {
        uint cropId;
        string cropName;
        uint quantity;
        uint256 nftTokenId; // New field to store NFT token ID
        string ipfsHash;    // New field to store IPFS hash
    }

    // Struct for a farmer
    struct Farmer {
        uint farmerId;
        string name;
        mapping(uint => Crop) crops;
        uint cropCount;
    }

    // State variables
    mapping(uint => Farmer) public farmers;
    uint public farmerCount = 0;

    // Events
    event FarmerAdded(uint farmerId, string name);
    event CropAdded(uint farmerId, uint cropId, string cropName, uint quantity, uint256 nftTokenId, string ipfsHash);
    event NFTMinted(uint256 tokenId, address recipient, string ipfsHash);

    constructor() ERC721("FarmCropNFT", "FCNFT") {}

    // Function to add a new farmer
    function addFarmer(string memory _name) public {
        farmerCount++;
        Farmer storage newFarmer = farmers[farmerCount];
        newFarmer.farmerId = farmerCount;
        newFarmer.name = _name;
        newFarmer.cropCount = 0;

        emit FarmerAdded(farmerCount, _name);
    }

    // Function to add a new crop and mint NFT
    function addCrop(
        uint _farmerId, 
        string memory _cropName, 
        uint _quantity,
        string memory _ipfsHash
    ) public {
        require(_farmerId > 0 && _farmerId <= farmerCount, "Invalid farmer ID");
        
        Farmer storage farmer = farmers[_farmerId];
        farmer.cropCount++;
        uint newCropId = farmer.cropCount;

        // Mint NFT
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        _mint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, _ipfsHash);

        // Store crop with NFT details
        farmer.crops[newCropId] = Crop(
            newCropId,
            _cropName,
            _quantity,
            newTokenId,
            _ipfsHash
        );

        emit CropAdded(_farmerId, newCropId, _cropName, _quantity, newTokenId, _ipfsHash);
        emit NFTMinted(newTokenId, msg.sender, _ipfsHash);
    }

    // Function to get a specific crop's details
    function getCrop(uint _farmerId, uint _cropId) public view returns (
        uint cropId,
        string memory cropName,
        uint quantity,
        uint256 nftTokenId,
        string memory ipfsHash
    ) {
        require(_farmerId > 0 && _farmerId <= farmerCount, "Invalid farmer ID");
        Farmer storage farmer = farmers[_farmerId];
        Crop storage crop = farmer.crops[_cropId];
        return (
            crop.cropId,
            crop.cropName,
            crop.quantity,
            crop.nftTokenId,
            crop.ipfsHash
        );
    }

    // Function to check if an address owns a specific crop NFT
    function ownerOfCropNFT(uint _farmerId, uint _cropId) public view returns (address) {
        Farmer storage farmer = farmers[_farmerId];
        Crop storage crop = farmer.crops[_cropId];
        return ownerOf(crop.nftTokenId);
    }
}