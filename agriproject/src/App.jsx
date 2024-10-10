import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useParams, useNavigate } from 'react-router-dom';
import Web3 from 'web3';
import { QRCodeSVG } from 'qrcode.react';
import contractABI from './abi.json';
import Dashboard from './Dashboard';
import './App.css';

const contractAddress = "0x95f26527FC4b8E1bAE276Ec52056bc4A420dC0E8";
const ALCHEMY_RPC = `https://eth-sepolia.g.alchemy.com/v2/${process.env.VITE_REACT_APP_ALCHEMY_API_KEY}`;

const publicWeb3 = new Web3(new Web3.providers.HttpProvider(ALCHEMY_RPC));

const Web3FarmerComponent = () => {
  const [web3Instance, setWeb3] = useState(null);
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [error, setError] = useState('');
  const [publicContract, setPublicContract] = useState(null);

  const [farmerName, setFarmerName] = useState('');
  const [cropName, setCropName] = useState('');
  const [quantity, setQuantity] = useState('');
  
  const [currentFarmerId, setCurrentFarmerId] = useState(null);
  const [farmerDetails, setFarmerDetails] = useState(null);
  const [crops, setCrops] = useState([]);

  useEffect(() => {
    // Initialize public contract for read-only operations
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
      setCurrentFarmerId(farmerCount);
      setFarmerName('');
      setCrops([]);
      fetchFarmerDetails(farmerCount);
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
      await contract.methods.addCrop(currentFarmerId, cropName, quantity)
        .send({ from: account });
      setCropName('');
      setQuantity('');
      fetchFarmerDetails(currentFarmerId);
    } catch (error) {
      setError(`Failed to add crop: ${error.message}`);
    }
  };

  const fetchFarmerDetails = async (farmerId) => {
    try {
      const contractToUse = contract || publicContract;
      const farmer = await contractToUse.methods.farmers(farmerId).call();
      setFarmerDetails({
        id: farmer.farmerId,
        name: farmer.name,
        cropCount: farmer.cropCount
      });

      const cropsList = [];
      for (let i = 1; i <= farmer.cropCount; i++) {
        const crop = await contractToUse.methods.getCrop(farmerId, i).call();
        cropsList.push({
          cropId: crop[0],
          cropName: crop[1],
          quantity: crop[2]
        });
      }
      setCrops(cropsList);
    } catch (error) {
      setError(`Failed to fetch farmer details: ${error.message}`);
    }
  };

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
              {currentFarmerId && <p className="text-green-400">Current Farmer ID: {currentFarmerId.toString()}</p>}
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
            className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition-colors"
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
            >
              Add Crop
            </button>
          </div>
        )}

        {farmerDetails && (
          <div className="mt-8 bg-gray-800 p-6 rounded">
            <h2 className="text-2xl font-semibold mb-4 text-purple-400">Farmer Information</h2>
            <div className="bg-gray-700 p-4 rounded">
              <p><strong>Farmer ID:</strong> {farmerDetails.id.toString()}</p>
              <p><strong>Farmer Name:</strong> {farmerDetails.name}</p>
            </div>
            <h3 className="text-xl font-semibold mt-4 mb-2 text-purple-400">Crops:</h3>
            {crops.length === 0 ? (
              <p>No crops added yet.</p>
            ) : (
              <ul className="space-y-4">
                {crops.map((crop) => (
                  <li key={`${farmerDetails.id}-${crop.cropId}`} className="bg-gray-700 p-4 rounded">
                    <p><strong>Crop ID:</strong> {crop.cropId.toString()}</p>
                    <p><strong>Crop Name:</strong> {crop.cropName}</p>
                    <p><strong>Price:</strong> {crop.quantity.toString()}</p>
                    <div className="mt-4">
                      <Link 
                        to={`/crop/${farmerDetails.id}-${crop.cropId}`}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        View Details
                      </Link>
                      <div className="mt-2">
                        <QRCodeSVG
                          value={`${window.location.origin}/crop/${farmerDetails.id}-${crop.cropId}`}
                          size={128}
                          level="H"
                          includeMargin={true}
                          className="bg-white p-2 rounded"
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
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

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        // Create a new contract instance using the public Web3
        const publicContract = new publicWeb3.eth.Contract(contractABI, contractAddress);
        
        // Fetch farmer details
        const farmer = await publicContract.methods.farmers(farmerId).call();
        setFarmerDetails({
          id: farmer.farmerId,
          name: farmer.name,
          cropCount: farmer.cropCount
        });

        // Fetch specific crop details
        const crop = await publicContract.methods.getCrop(farmerId, actualCropId).call();
        setCropDetails({
          cropId: crop[0],
          cropName: crop[1],
          quantity: crop[2]
        });
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
        <div className="bg-gray-700 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2 text-purple-400">Crop Information</h2>
          <p><strong>Crop ID:</strong> {cropDetails.cropId.toString()}</p>
          <p><strong>Crop Name:</strong> {cropDetails.cropName}</p>
          <p><strong>Price:</strong> {cropDetails.quantity.toString()}</p>
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

  useEffect(() => {
    initWeb3();
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
      } catch (error) {
        console.error("Failed to connect to MetaMask");
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
          <Route 
            path="/" 
            element={
              <Web3FarmerComponent 
                web3Instance={web3Instance}
                account={account}
                contract={contract}
                contractAddress={contractAddress}
              />
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <Dashboard 
                web3Instance={web3Instance}
                account={account}
                contract={contract}
                contractAddress={contractAddress}
              />
            } 
          />
          <Route path="/crop/:cropId" element={<CropDetailsPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
