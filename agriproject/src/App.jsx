import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useParams, useNavigate } from 'react-router-dom';
import Web3 from 'web3';
import QRCode from 'qrcode';
import contractABI from './abi.json';
import Dashboard from './Dashboard';
import './App.css';
import { ethers } from 'ethers';
import { PushAPI, CONSTANTS } from '@pushprotocol/restapi';

const contractAddress = "0xb7eA2CeeBfAc1cd9eEFB7C9fCB401e30596EC850";
const ALCHEMY_RPC = "https://eth-sepolia.g.alchemy.com/v2/lQZfG4SqJSoj1lBu4NsFN1AbmHhRhAtH";
const channelInCAIP = "eip155:11155111:0x210406844A1B98EF2729398c4BF9700238fF0a76"

const publicWeb3 = new Web3(new Web3.providers.HttpProvider(ALCHEMY_RPC));

// Updated IPFS upload function with proper error handling and authentication
const pinJSONToIPFS = async (jsonData) => {
  const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
  
  // Replace these with your actual Pinata API keys
  const pinataApiKey = '1547904667caa674ab32';
  const pinataSecretApiKey = '71627debb1bd62c8892935c45688feaccc09c8df7da195612738f92006845b8f';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataSecretApiKey,
      },
      body: JSON.stringify(jsonData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.IpfsHash;
  } catch (error) {
    console.error('Error pinning to IPFS:', error);
    throw new Error(`Failed to upload to IPFS: ${error.message}`);
  }
};

// Generate NFT metadata function
const generateNFTMetadata = (cropData, qrCodeDataUrl, farmerId) => {
  return {
    name: `Crop ${cropData.cropId} - ${cropData.cropName}`,
    description: `Farmer ID: ${farmerId}, Crop: ${cropData.cropName}, Quantity: ${cropData.quantity}`,
    image: qrCodeDataUrl,
    attributes: [
      {
        trait_type: "Farmer ID",
        value: farmerId
      },
      {
        trait_type: "Crop ID",
        value: cropData.cropId
      },
      {
        trait_type: "Crop Name",
        value: cropData.cropName
      },
      {
        trait_type: "Quantity",
        value: cropData.quantity
      }
    ]
  };
};

const generateQRCode = async (url) => {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      width: 256,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

const Web3FarmerComponent = () => {
  const [web3Instance, setWeb3] = useState(null);
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [error, setError] = useState('');
  const [publicContract, setPublicContract] = useState(null);

  const [ethersSigner, setEthersSigner] = useState(null); //this is for the push protocol (using ethers to implement push protocol)

  const [farmerName, setFarmerName] = useState('');
  const [cropName, setCropName] = useState('');
  const [quantity, setQuantity] = useState('');
  
  const [currentFarmerId, setCurrentFarmerId] = useState(null);
  const [farmerDetails, setFarmerDetails] = useState(null);
  const [crops, setCrops] = useState([]);
  const [minting, setMinting] = useState(false);

  useEffect(() => {
    const publicContractInstance = new publicWeb3.eth.Contract(contractABI, contractAddress);
    setPublicContract(publicContractInstance);
  }, []);

  const initWeb3 = async () => {
    if (window.ethereum) {
      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);
      try {
        await window.ethereum.enable();
        const accounts = await web3Instance.eth.getAccounts();
        setAccount(accounts[0]);
        const contractInstance = new web3Instance.eth.Contract(contractABI, contractAddress);
        setContract(contractInstance);

        //setting up the ethers wallet in order to handle the push notifications 
        const ethersProviderInstance = new ethers.providers.Web3Provider(window.ethereum);
        // console.log(ethersProviderInstance)
        const ethersSignerInstance = ethersProviderInstance.getSigner();
        setEthersSigner(ethersSignerInstance);
        // console.log(ethersSignerInstance)

      } catch (error) {
        setError("Failed to connect to MetaMask");
      }
    } else {
      setError("Please install MetaMask");
    }
  };

  const disconnectWallet = () => {
    setWeb3(null);
    setAccount('');
    setContract(null);
    setCurrentFarmerId(null);
    setFarmerDetails(null);
    setCrops([]);
  };

  const addFarmer = async () => {
    setError('');
    if (!contract || !account) return setError('Please connect your wallet first');
    if (!farmerName) return setError('Please enter Farmer Name');

    try {
      await contract.methods.addFarmer(farmerName).send({ from: account });
      const farmerCount = await contract.methods.farmerCount().call();
      const farmerCountNumber = Number(farmerCount);
      setCurrentFarmerId(farmerCountNumber);
      setFarmerName('');
      setCrops([]);
      fetchFarmerDetails(farmerCountNumber);
      await sendNotificationForFarmerAdded(farmerCountNumber)
    } catch (error) {
      setError(`Failed to add farmer: ${error.message}`);
    }
  };

  const addCrop = async () => {
    setError('');
    if (!contract || !account) return setError('Please connect your wallet first');
    if (!currentFarmerId) return setError('Please create or select a farmer first');
    if (!cropName || !quantity) return setError('Please fill in all crop details');
  
    try {
      setMinting(true);
  
      const nextCropId = Number(farmerDetails?.cropCount) + 1 || 1;
      const qrCodeUrl = `${window.location.origin}/crop/${currentFarmerId}-${nextCropId}`;
      
      // Generate QR code data URL
      const qrCodeDataUrl = await generateQRCode(qrCodeUrl);
      
      const metadata = generateNFTMetadata(
        { 
          cropId: nextCropId,
          cropName, 
          quantity 
        },
        qrCodeDataUrl,
        currentFarmerId
      );
  
      console.log('Uploading to IPFS...');
      let ipfsHash;
      try {
        ipfsHash = await pinJSONToIPFS(metadata);
        console.log('IPFS Hash:', ipfsHash);
      } catch (ipfsError) {
        console.error('IPFS Upload Error:', ipfsError);
        throw new Error(`IPFS Upload failed: ${ipfsError.message}`);
      }
  
      if (!ipfsHash) {
        throw new Error('Failed to get IPFS hash');
      }
  
      console.log('Adding crop to blockchain...');
      await contract.methods.addCrop(currentFarmerId, cropName, quantity, ipfsHash)
        .send({ from: account });
  
      setCropName('');
      setQuantity('');
      fetchFarmerDetails(currentFarmerId);
      await sendNotificationForCropAdded(currentFarmerId,cropName, quantity,ipfsHash,qrCodeUrl)
    } catch (error) {
      console.error('Full error:', error);
      setError(`Failed to add crop and mint NFT: ${error.message}`);
    } finally {
      setMinting(false);
    }
  };
  
  const fetchFarmerDetails = async (farmerId) => {
    try {
      const contractToUse = contract || publicContract;
      const farmer = await contractToUse.methods.farmers(farmerId).call();
      setFarmerDetails({
        id: Number(farmer.farmerId),
        name: farmer.name,
        cropCount: Number(farmer.cropCount)
      });

      const cropsList = [];
      for (let i = 1; i <= Number(farmer.cropCount); i++) {
        const crop = await contractToUse.methods.getCrop(farmerId, i).call();
        const qrCodeUrl = `${window.location.origin}/crop/${farmerId}-${i}`;
        const qrCodeDataUrl = await generateQRCode(qrCodeUrl);
        cropsList.push({
          cropId: Number(crop[0]),
          cropName: crop[1],
          quantity: Number(crop[2]),
          qrCodeDataUrl: qrCodeDataUrl
        });
      }
      setCrops(cropsList);
    } catch (error) {
      setError(`Failed to fetch farmer details: ${error.message}`);
    }
  };

  const sendNotificationForFarmerAdded = async(farmerCountNumber)=>{
    if(!ethersSigner){
      console.error('Ether Signer is not initialized')
    }
    else{
      try {
        const userSigner = await PushAPI.initialize(ethersSigner, {
          env: CONSTANTS.ENV.STAGING,
        });
        console.log(userSigner.account)
  
        const subscribeStatus = await userSigner.notification.subscribe(channelInCAIP);
        console.log(subscribeStatus)
    
        // Sending notification using the userSigner with the correct syntax
        const sendNotifRes = await userSigner.channel.send([`${userSigner.account}`], {
          notification: { title: 'New Farmer Added', body: `Welcome to Agriverify. Your Farmer ID is ${farmerCountNumber}`},
          }
        );
        console.log(sendNotifRes)
  
  
        console.log('Notification sent:', sendNotifRes);
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    }
  }

  const sendNotificationForCropAdded = async (currentFarmerId,cropName, quantity,ipfsHash,qrCodeUrl) => {
    if(!ethersSigner){
      console.error('Ether Signer is not initialized')
    }
    else{
      try {
        const userSigner = await PushAPI.initialize(ethersSigner, {
          env: CONSTANTS.ENV.STAGING,
        });
        console.log(userSigner.account)
  
        const subscribeStatus = await userSigner.notification.subscribe(channelInCAIP);
        console.log(subscribeStatus)
    
        // Sending notification using the userSigner with the correct syntax
        const sendNotifRes = await userSigner.channel.send([`${userSigner.account}`], {
          notification: { title: `New Crop Added : ${cropName} and certified for Farmer ID ${currentFarmerId}`, body: `${quantity} is the given amount of crops which have been added. We have also created a qr code for you to show your authenticity which has the following hash ${ipfsHash}`},
          }
        );
        console.log(sendNotifRes)
  
  
        console.log('Notification sent:', sendNotifRes);
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    }
    
  }


  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-center text-purple-400">Farmer and Crop Management</h1>
        
        <div className="mb-6">
          {!account ? (
            <button
              onClick={initWeb3}
              className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition-colors mb-2"
            >
              Connect Wallet
            </button>
          ) : (
            <div className="bg-gray-800 p-4 rounded">
              <p className="text-green-400 mb-2">Wallet connected: {account}</p>
              {currentFarmerId && (
                <p className="text-green-400">Current Farmer ID: {currentFarmerId.toString()}</p>
              )}
              <button
                onClick={disconnectWallet}
                className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition-colors mt-2"
              >
                Disconnect Wallet
              </button>
            </div>
          )}
        </div>
        
        {error && <p className="text-red-400 mb-4">{error}</p>}

        <div className="mb-8 bg-gray-800 p-6 rounded">
          <h2 className="text-2xl font-semibold mb-4 text-purple-400">Add New Farmer</h2>
          <input
            type="text"
            placeholder="Farmer Name"
            value={farmerName}
            onChange={(e) => setFarmerName(e.target.value)}
            className="w-full p-2 mb-2 border rounded bg-gray-700 text-white border-gray-600"
          />
          <button
            onClick={addFarmer}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Add Farmer
          </button>
        </div>

        {currentFarmerId && (
          <div className="mb-8 bg-gray-800 p-6 rounded">
            <h2 className="text-2xl font-semibold mb-4 text-purple-400">Add Crop</h2>
            <input
              type="text"
              placeholder="Crop Name"
              value={cropName}
              onChange={(e) => setCropName(e.target.value)}
              className="w-full p-2 mb-2 border rounded bg-gray-700 text-white border-gray-600"
            />
            <input
              type="number"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full p-2 mb-2 border rounded bg-gray-700 text-white border-gray-600"
            />
            
            <button
              onClick={addCrop}
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors"
              disabled={minting}
            >
              {minting ? 'Minting NFT...' : 'Add Crop'}
            </button>
          </div>
        )}

        {minting && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center">
            <div className="bg-gray-800 p-8 rounded text-center text-white">
              <h2 className="text-xl font-bold mb-4">Minting NFT...</h2>
              <p>Please wait while we mint your crop as an NFT.</p>
            </div>
          </div>
        )}

        {farmerDetails && (
          <div className="mb-8 bg-gray-800 p-6 rounded">
            <h2 className="text-2xl font-semibold mb-4 text-purple-400">Farmer Details</h2>
            <p className="mb-2"><strong>ID:</strong> {farmerDetails.id}</p>
            <p className="mb-4"><strong>Name:</strong> {farmerDetails.name}</p>
            <h3 className="text-xl font-semibold mb-4 text-purple-400">Crops</h3>
            {crops.map((crop, index) => (
              <div key={index} className="border-b border-gray-700 py-2">
                <p><strong>Crop ID:</strong> {crop.cropId}</p>
                <p><strong>Name:</strong> {crop.cropName}</p>
                <p><strong>Quantity:</strong> {crop.quantity}</p>
                <img src={crop.qrCodeDataUrl} alt={`QR Code for Crop ${crop.cropId}`} className="my-2 w-32 h-32" />
                <Link
                  to={`/crop/${farmerDetails.id}-${crop.cropId}`}
                  className="text-blue-400 hover:text-blue-300"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const CropDetailsPage = () => {
  const { cropId } = useParams();
  const navigate = useNavigate();
  const [farmerId, actualCropId] = cropId.split('-').map(Number);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [farmerDetails, setFarmerDetails] = useState(null);
  const [cropDetails, setCropDetails] = useState(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const publicContract = new publicWeb3.eth.Contract(contractABI, contractAddress);
        
        const farmer = await publicContract.methods.farmers(farmerId).call();
        setFarmerDetails({
          id:  Number(farmer.farmerId),
          name: farmer.name,
          cropCount: Number(farmer.cropCount)
        });

        const crop = await publicContract.methods.getCrop(farmerId, actualCropId).call();
        setCropDetails({
          cropId: Number(crop[0]),
          cropName: crop[1],
          quantity: Number(crop[2])
        });

        const qrCodeUrl = `${window.location.origin}/crop/${farmerId}-${actualCropId}`;
        const qrCode = await generateQRCode(qrCodeUrl);
        setQrCodeDataUrl(qrCode);
      } catch (error) {
        console.error("Fetch error:", error);
        setError("Failed to fetch details from blockchain. Please check if the provided IDs are correct.");
      } finally {
        setLoading(false);
      }
    };

    if (farmerId && actualCropId) {
      fetchDetails();
    } else {
      setError("Invalid crop ID format");
      setLoading(false);
    }
  }, [cropId, farmerId, actualCropId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
        <div className="max-w-2xl mx-auto bg-gray-800 p-6 rounded">
          <p className="text-purple-400">Loading details from blockchain...</p>
        </div>
      </div>
    );
  }

  if (error || !farmerDetails || !cropDetails) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
        <div className="max-w-2xl mx-auto bg-gray-800 p-6 rounded">
          <p className="text-red-400">{error || "Failed to fetch details from blockchain"}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Back to Main Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-2xl mx-auto bg-gray-800 p-6 rounded">
        <h1 className="text-3xl font-bold mb-6 text-center text-purple-400">Authenticated Crop Details</h1>
        <div className="bg-gray-700 p-4 rounded mb-6">
          <p className="text-green-400 font-semibold">✓ Blockchain Verified Data</p>
        </div>
        <div className="bg-gray-700 p-4 rounded mb-6">
          <h2 className="text-xl font-semibold mb-2 text-purple-400">Farmer Information</h2>
          <p><strong>Farmer ID:</strong> {farmerDetails.id.toString()}</p>
          <p><strong>Farmer Name:</strong> {farmerDetails.name}</p>
        </div>
        <div className="bg-gray-700 p-4 rounded mb-6">
          <h2 className="text-xl font-semibold mb-2 text-purple-400">Crop Information</h2>
          <p><strong>Crop ID:</strong> {cropDetails.cropId.toString()}</p>
          <p><strong>Crop Name:</strong> {cropDetails.cropName}</p>
          <p><strong>Quantity:</strong> {cropDetails.quantity.toString()}</p>
        </div>
        <div className="bg-gray-700 p-4 rounded mb-6">
          <h2 className="text-xl font-semibold mb-2 text-purple-400">QR Code</h2>
          <img src={qrCodeDataUrl} alt="Crop QR Code" className="w-48 h-48 mx-auto" />
        </div>
        <button
          onClick={() => navigate('/')}
          className="mt-6 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Back to Main Page
        </button>
      </div>
    </div>
  );
};

const App = () => {
  const [web3Instance, setWeb3] = useState(null);
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);

  const initWeb3 = async () => {
    if (window.ethereum) {
      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);
      try {
        await window.ethereum.enable();
        const accounts = await web3Instance.eth.getAccounts();
        setAccount(accounts[0]);
        const contractInstance = new web3Instance.eth.Contract(contractABI, contractAddress);
        setContract(contractInstance);
      } catch (error) {
        console.error("Failed to connect to MetaMask", error);
      }
    } else {
      console.error("Please install MetaMask");
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-900">
        <nav className="bg-gray-800 p-4">
          <div className="max-w-4xl mx-auto flex justify-center space-x-6">
            <Link to="/" className="text-purple-400 hover:text-purple-300">
              Manage Farmers
            </Link>
            <Link to="/dashboard" className="text-purple-400 hover:text-purple-300">
              Dashboard 
            </Link>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Web3FarmerComponent />} />
          <Route path="/dashboard" element={
            <Dashboard 
              web3Instance={web3Instance} 
              account={account} 
              contract={contract} 
              onConnect={initWeb3}
            />
          } />
          <Route path="/crop/:cropId" element={<CropDetailsPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;