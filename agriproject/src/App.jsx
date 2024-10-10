import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { QRCodeSVG } from 'qrcode.react';
import contractABI from './abi.json';
import Dashboard from './Dashboard';
import './App.css';

const contractAddress = "0x95f26527FC4b8E1bAE276Ec52056bc4A420dC0E8";
const ALCHEMY_RPC = `https://eth-sepolia.g.alchemy.com/v2/${process.env.VITE_REACT_APP_ALCHEMY_API_KEY}`;

const Web3FarmerComponent = ({ provider, signer, contract, connectWallet, disconnectWallet }) => {
  const [error, setError] = useState('');
  const [farmerName, setFarmerName] = useState('');
  const [cropName, setCropName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [currentFarmerId, setCurrentFarmerId] = useState(null);
  const [farmerDetails, setFarmerDetails] = useState(null);
  const [crops, setCrops] = useState([]);
  const [account, setAccount] = useState('');

  useEffect(() => {
    const getAccount = async () => {
      if (signer) {
        const address = await signer.getAddress();
        setAccount(address);
      }
    };
    getAccount();
  }, [signer]);

  const addFarmer = async () => {
    setError('');
    if (!contract || !signer) return setError('Please connect your wallet first');
    if (!farmerName) return setError('Please enter Farmer Name');

    try {
      const tx = await contract.connect(signer).addFarmer(farmerName);
      await tx.wait();
      const farmerCount = await contract.farmerCount();
      setCurrentFarmerId(farmerCount.toString());
      setFarmerName('');
      setCrops([]);
      fetchFarmerDetails(farmerCount.toString());
    } catch (error) {
      setError(`Failed to add farmer: ${error.message}`);
    }
  };

  const addCrop = async () => {
    setError('');
    if (!contract || !signer) return setError('Please connect your wallet first');
    if (!currentFarmerId) return setError('Please create or select a farmer first');
    if (!cropName || !quantity) return setError('Please fill in all crop details');

    try {
      const tx = await contract.connect(signer).addCrop(currentFarmerId, cropName, quantity);
      await tx.wait();
      setCropName('');
      setQuantity('');
      fetchFarmerDetails(currentFarmerId);
    } catch (error) {
      setError(`Failed to add crop: ${error.message}`);
    }
  };

  const fetchFarmerDetails = async (farmerId) => {
    try {
      const farmer = await contract.farmers(farmerId);
      setFarmerDetails({
        id: farmer.farmerId.toString(),
        name: farmer.name,
        cropCount: farmer.cropCount.toString()
      });

      const cropsList = [];
      for (let i = 1; i <= farmer.cropCount.toString(); i++) {
        const crop = await contract.getCrop(farmerId, i);
        cropsList.push({
          cropId: crop[0].toString(),
          cropName: crop[1],
          quantity: crop[2].toString()
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
        
        <div className="mb-6 bg-gray-800 p-4 rounded flex justify-between items-center">
          {account ? (
            <>
              <p className="text-green-400">Wallet connected: {account}</p>
              <button
                onClick={disconnectWallet}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={connectWallet}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
            >
              Connect Wallet
            </button>
          )}
        </div>

        {error && <p className="text-red-400 mb-4">{error}</p>}

        {/* Farmer Management Section */}
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
            disabled={!account}
          >
            Add Farmer
          </button>
          {!account && (
            <p className="text-yellow-400 mt-2 text-sm">Connect wallet to add farmers</p>
          )}
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
              disabled={!account}
            >
              Add Crop
            </button>
            {!account && (
              <p className="text-yellow-400 mt-2 text-sm">Connect wallet to add crops</p>
            )}
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
                    <p><strong>Quantity:</strong> {crop.quantity.toString()}</p>
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

const CropDetailsPage = ({ provider, contract }) => {
  const { cropId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [farmerDetails, setFarmerDetails] = useState(null);
  const [cropDetails, setCropDetails] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let contractInstance;

        if (contract) {
          contractInstance = contract;
        } else {
          // Create read-only contract instance with Alchemy provider
          const alchemyProvider = new ethers.providers.JsonRpcProvider(ALCHEMY_RPC);
          contractInstance = new ethers.Contract(contractAddress, contractABI, alchemyProvider);
        }

        const [farmerId, actualCropId] = cropId.split('-').map(Number);

        const farmer = await contractInstance.farmers(farmerId);
        
        if (!farmer || farmer.farmerId.toString() === '0') {
          throw new Error("Farmer not found");
        }

        setFarmerDetails({
          id: farmer.farmerId.toString(),
          name: farmer.name,
          cropCount: farmer.cropCount.toString()
        });

        const crop = await contractInstance.getCrop(farmerId, actualCropId);
        
        if (!crop || crop[0].toString() === '0') {
          throw new Error("Crop not found");
        }

        setCropDetails({
          cropId: crop[0].toString(),
          cropName: crop[1],
          quantity: crop[2].toString()
        });

        setError('');
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to fetch details from blockchain");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [cropId, contract]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
        <div className="max-w-2xl mx-auto bg-gray-800 p-6 rounded">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
            <p className="text-purple-400">Loading details from blockchain...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
        <div className="max-w-2xl mx-auto bg-gray-800 p-6 rounded">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              Back to Main Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-2xl mx-auto bg-gray-800 p-6 rounded">
        <h1 className="text-3xl font-bold mb-6 text-center text-purple-400">Authenticated Crop Details</h1>
        
        <div className="bg-gray-700 p-4 rounded mb-6">
          <p className="text-green-400 font-semibold flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Blockchain Verified Data
          </p>
        </div>

        <div className="bg-gray-700 p-4 rounded mb-6">
          <h2 className="text-xl font-semibold mb-2 text-purple-400">Farmer Information</h2>
          <p><strong>Farmer ID:</strong> {farmerDetails?.id}</p>
          <p><strong>Farmer Name:</strong> {farmerDetails?.name}</p>
        </div>

        <div className="bg-gray-700 p-4 rounded mb-6">
          <h2 className="text-xl font-semibold mb-2 text-purple-400">Crop Information</h2>
          <p><strong>Crop ID:</strong> {cropDetails?.cropId}</p>
          <p><strong>Crop Name:</strong> {cropDetails?.cropName}</p>
          <p><strong>Quantity:</strong> {cropDetails?.quantity}</p>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          >
            Back to Main Page
          </button>
          <QRCodeSVG
            value={`${window.location.origin}/crop/${cropId}`}
            size={128}
            level="H"
            includeMargin={true}
            className="bg-white p-2 rounded"
          />
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Create provider and signer (ethers v6 syntax)
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        // Create contract instance
        const contractInstance = new ethers.Contract(contractAddress, contractABI, provider);
        
        setProvider(provider);
        setSigner(signer);
        setContract(contractInstance);

        // Add event listener for account changes
        window.ethereum.on('accountsChanged', handleAccountsChanged);
      } catch (error) {
        console.error("Failed to connect to MetaMask:", error);
      }
    } else {
      console.error("Please install MetaMask");
    }
  };

  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setContract(null);
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      connectWallet(); // Reconnect with new account
    }
  };

  useEffect(() => {
    // Check if wallet was previously connected
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts.length > 0) {
            connectWallet();
          }
        })
        .catch(console.error);
    }

    // Initialize read-only provider for users without MetaMask (ethers v6 syntax)
    const initializeReadOnlyProvider = async () => {
      try {
        const alchemyProvider = new ethers.JsonRpcProvider(ALCHEMY_RPC);
        const contractInstance = new ethers.Contract(contractAddress, contractABI, alchemyProvider);
        setProvider(alchemyProvider);
        setContract(contractInstance);
      } catch (error) {
        console.error("Failed to initialize read-only provider:", error);
      }
    };

    initializeReadOnlyProvider();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-900">
        <nav className="bg-gray-800 p-4">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div className="flex space-x-6">
              <Link to="/" className="text-purple-400 hover:text-purple-300">
                Manage Farmers
              </Link>
              <Link to="/dashboard" className="text-purple-400 hover:text-purple-300">
                Dashboard
              </Link>
            </div>
          </div>
        </nav>

        <Routes>
          <Route 
            path="/" 
            element={
              <Web3FarmerComponent 
                provider={provider}
                signer={signer}
                contract={contract}
                connectWallet={connectWallet}
                disconnectWallet={disconnectWallet}
              />
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <Dashboard 
                provider={provider}
                signer={signer}
                contract={contract}
                connectWallet={connectWallet}
                disconnectWallet={disconnectWallet}
              />
            } 
          />
          <Route 
            path="/crop/:cropId" 
            element={
              <CropDetailsPage 
                provider={provider}
                contract={contract}
              />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;