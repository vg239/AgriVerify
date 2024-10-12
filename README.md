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
- We have used `@openzeppelin/contracts` (@4.9.3) to import necessary contracts to integrate NFT into our project

#### NFT Integration

Each crop is represented as an ERC721 NFT, allowing for unique identification and potential trading.

#### IPFS Integration

IPFS hashes can be stored with each crop for off-chain data storage.

## Agriproject

### Web3 Integration
- The application uses Web3.js to interact with the Ethereum blockchain.
- A smart contract is deployed at the address: `0xEe4F162B6b261Bc6260D70b2785431B3e44136B1` on the Sepolia testnet through HardHat.

### Push Protocol
- Utilizes the Push Protocol for sending notifications.
- Channel address (in CAIP format): `eip155:11155111:0x210406844A1B98EF2729398c4BF9700238fF0a76`
- Notifications are sent when:
  1. A new farmer is added
  2. A new crop is added

### IPFS Integration
- Uses Pinata for pinning metadata to IPFS
- Generates and uploads metadata for each crop entry, including QR code data

### Features

1. **Farmer Management**
   - Add new farmers to the blockchain
   - View farmer details

2. **Crop Management**
   - Add new crops for registered farmers
   - Generate unique QR code for a dynamic route which redirects to authentication page for the crops added
   - Mint NFTs for crop entries

3. **Dashboard**
   - View all registered farmers
   - Search functionality to find specific farmers
   - Display crop details for each farmer
   - Radio button to filter out all farmers created by you
   - Complete transperency of blockchain

4. **Blockchain Integration**
   - Interaction with a smart contract deployed on the Sepolia testnet
   - Use Web3.js for blockchain interactions

5. **Push Protocol Integration**
   - Send notifications for new farmer registrations and crop additions
   - Subscribe users to the notification channel

6. **QR Code Generation**
   - Create unique QR codes for dynamic route created with every crop added
   - QR codes link to a verification page with crop details

### Functions used 

#### i) Farmer Management 
- `addFarmer()`: Registers a new farmer on the blockchain
- `fetchFarmerDetails()`: Retrieves farmer information from the blockchain

#### ii) Crop Management
- `addCrop()`: Adds a new crop for a farmer and mints an NFT
- `generateNFTMetadata()`: Creates metadata for the crop NFT
- `generateQRCode()`: Generates a QR code for each crop entry

#### iii) Notification System
- `sendNotificationForFarmerAdded()`: Sends a notification when a new farmer is registered
- `sendNotificationForCropAdded()`: Sends a notification when a new crop is added

#### iv) IPFS
- `pinJSONToIPFS()`: Uploads metadata to IPFS using Pinata

<a href="https://drive.google.com/file/d/1FTuw8QVW2Xqq7v_0-RXQbIshuMYnjqIa/view?usp=drive_link"><h3>DEMO VIDEO</h3></a>
<a href="https://agri-verify-lake.vercel.app/"><h3>LIVE VIDEO</h3></a>
