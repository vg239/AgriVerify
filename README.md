# AgriVerify

This is a decentralized website that helps farmers to easily certify their produced crops and generate QR codes that consumers can scan for instant verification. A NFT is minted for every generated QR-code to ensure authenticity. For every process as the farmers add their name to adding their crops, notifications are sent containing the important info using the Push Protocol. In short, this project implements a FarmManagement smart contract for managing farmers and crops as NFTs.
<br>
<br>
Here the project initially contains two parts - [Hardhat](./hardhat) and [Agriproject](./agriproject)
<br>
1) Hardhat requires ethers version atleast 6.0 version or higher
2) PushProtocol requires ethers version 5.7.2
<br>
So we have put two folders for the same reason to avoid version mismatch

## Hardhat

- [FarmManagement.sol](./hardhat/contracts/FarmManagement.sol): Main smart contract
- [FarmManagement.js (Ignition)](./hardhat/ignition/modules/FarmManagement.js): Deployment module
- [FarmManagement.js (Test)](./hardhat/test/TestForFarmers.js): Contract tests
- [hardhat.config.js](./hardhat/hardhat.config.js): Hardhat configuration
<br>
On running the

```
npx hardhat test
```

<br>

![HardHatTests](https://github.com/user-attachments/assets/c048edd6-e7e2-4918-82af-50b19172ad8f)

### Functions in the solidity contract
- `addFarmer(string memory _name)`: Add a new farmer
- `addCrop(uint _farmerId, string memory _cropName, uint _quantity, string memory _ipfsHash)`: Add a crop and mint NFT
- `getCrop(uint _farmerId, uint _cropId)`: Get crop details
- `ownerOfCropNFT(uint _farmerId, uint _cropId)`: Check crop NFT owner

#### NFT Integration

Each crop is represented as an ERC721 NFT, allowing for unique identification and potential trading.

#### IPFS Integration

IPFS hashes can be stored with each crop for off-chain data storage.
