import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useParams, useNavigate } from 'react-router-dom';
import Web3 from 'web3';
import { QRCodeSVG } from 'qrcode.react';
import contractABI from './abi.json';
import Dashboard from './Dashboard';
import './App.css';

const contractAddress = "0x95f26527FC4b8E1bAE276Ec52056bc4A420dC0E8";

const Web3FarmerComponent = ({ web3Instance, account, contract, connectWallet, disconnectWallet }) => {
  const [error, setError] = useState('');
  const [farmerName, setFarmerName] = useState('');
  const [cropName, setCropName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [currentFarmerId, setCurrentFarmerId] = useState(null);
  const [farmerDetails, setFarmerDetails] = useState(null);
  const [crops, setCrops] = useState([]);

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
      const farmer = await contract.methods.farmers(farmerId).call();
      setFarmerDetails({
        id: farmer.farmerId,
        name: farmer.name,
        cropCount: farmer.cropCount
      });

      const cropsList = [];
      for (let i = 1; i <= farmer.cropCount; i++) {
        const crop = await contract.methods.getCrop(farmerId, i).call();
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

const CropDetailsPage = ({ web3Instance, contract }) => {
  const { cropId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [farmerDetails, setFarmerDetails] = useState(null);
  const [cropDetails, setCropDetails] = useState(null);

  useEffect(() => {
    if (contract) {
      fetchDetails();
    } else {
      initPublicWeb3AndFetchDetails();
    }
  }, [cropId, contract]);

  const initPublicWeb3AndFetchDetails = async () => {
    try {
      // Use a public RPC endpoint for read-only access
      const publicWeb3 = new Web3('https://eth-mainnet.g.alchemy.com/v2/your-api-key'); // Replace with your public RPC endpoint
      const publicContract = new publicWeb3.eth.Contract(contractABI, contractAddress);
      await fetchDetails(publicContract);
    } catch (error) {
      setError('Failed to connect to blockchain');
      setLoading(false);
    }
  };

  const fetchDetails = async (contractInstance = contract) => {
    try {
      const [farmerId, actualCropId] = cropId.split('-').map(Number);
      
      // Fetch farmer details
      const farmer = await contractInstance.methods.farmers(farmerId).call();
      setFarmerDetails({
        id: farmer.farmerId,
        name: farmer.name,
        cropCount: farmer.cropCount
      });

      // Fetch specific crop details
      const crop = await contractInstance.methods.getCrop(farmerId, actualCropId).call();
      setCropDetails({
        cropId: crop[0],
        cropName: crop[1],
        quantity: crop[2]
      });
    } catch (error) {
      setError("Failed to fetch details from blockchain");
    } finally {
      setLoading(false);
    }
  };

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
          <p><strong>Quantity:</strong> {cropDetails.quantity.toString()}</p>
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

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const web3Instance = new Web3(window.ethereum);
        await window.ethereum.enable();
        const accounts = await web3Instance.eth.getAccounts();
        const contractInstance = new web3Instance.eth.Contract(contractABI, contractAddress);
        
        setWeb3(web3Instance);
        setAccount(accounts[0]);
        setContract(contractInstance);

        // Add event listener for account changes
        window.ethereum.on('accountsChanged', handleAccountsChanged);
      } catch (error) {
        console.error("Failed to connect to MetaMask");
      }
    } else {
      console.error("Please install MetaMask");
    }
  };

  const disconnectWallet = () => {
    setWeb3(null);
    setAccount('');
    setContract(null);
    // Remove event listener
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      disconnectWallet();
    } else {
      // User switched accounts
      setAccount(accounts[0]);
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

    return () => {
      // Cleanup event listeners
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
                web3Instance={web3Instance}
                account={account}
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
                web3Instance={web3Instance}
                account={account}
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
                web3Instance={web3Instance}
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