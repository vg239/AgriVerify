import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import Web3 from 'web3';
import contractABI from './abi.json';
import './App.css';

const contractAddress = "0x0c09bCC46FaA464f480f504F362C652C43D731dF";

const generateUniqueId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const Web3FarmerComponent = () => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [error, setError] = useState('');

  const [farmerName, setFarmerName] = useState('');
  const [farmerId, setFarmerId] = useState('');
  const [cropId, setCropId] = useState('');
  const [cropPrice, setCropPrice] = useState('');
  const [cropName, setCropName] = useState('');
  const [cropLocation, setCropLocation] = useState('');

  const [farmerDetails, setFarmerDetails] = useState(null);
  const [currentFarmerId, setCurrentFarmerId] = useState(null);
  const [cropsWithUniqueIds, setCropsWithUniqueIds] = useState([]);

  useEffect(() => {
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
    initWeb3();
  }, []);

  const addOrUpdateFarmer = async () => {
    setError('');
    if (!contract || !account) return setError('Please connect your wallet first');
    if (!farmerId || !farmerName) return setError('Please enter Farmer ID and Name');

    try {
      await contract.methods.addOrUpdateFarmer(farmerId, farmerName).send({ from: account });
      console.log('Farmer added/updated successfully');
      
      if (currentFarmerId !== farmerId) {
        setCropId('');
        setCropPrice('');
        setCropName('');
        setCropLocation('');
        setCurrentFarmerId(farmerId);
        setCropsWithUniqueIds([]);
      }
      
      setFarmerId('');
      setFarmerName('');
      fetchDetails();
    } catch (error) {
      setError(`Failed to add/update farmer: ${error.message}`);
    }
  };

  const addCrop = async () => {
    setError('');
    if (!contract || !account) return setError('Please connect your wallet first');
    if (!cropId || !cropPrice || !cropName || !cropLocation) return setError('Please fill in all crop details');

    try {
      await contract.methods.addCrop(cropId, cropPrice, cropName, cropLocation).send({ from: account });
      console.log('Crop added successfully');
      setCropId('');
      setCropPrice('');
      setCropName('');
      setCropLocation('');
      fetchDetails();
    } catch (error) {
      setError(`Failed to add crop: ${error.message}`);
    }
  };

  const fetchDetails = async () => {
    setError('');
    if (!contract || !account) return setError('Please connect your wallet first');

    try {
      const result = await contract.methods.getFarmerAndCropDetails(account).call();
      const updatedCrops = result[3].map(crop => ({
        ...crop,
        uniqueId: generateUniqueId()
      }));

      setFarmerDetails({
        farmerWallet: result[0],
        id: result[1],
        farmerName: result[2],
        crops: updatedCrops
      });
      setCurrentFarmerId(result[1]);
      setCropsWithUniqueIds(updatedCrops);
    } catch (error) {
      setError(`Failed to fetch details: ${error.message}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-900 shadow-md rounded-lg text-white">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-100">Farmer and Crop Management</h1>
      
      {!account && (
        <div className="mb-6">
          <p className="text-red-500 mb-2">Please connect your MetaMask wallet to use this application.</p>
        </div>
      )}

      {account && (
        <div className="mb-6">
          <p className="text-green-400 mb-2">Wallet connected: {account}</p>
          {currentFarmerId && <p className="text-green-400">Current Farmer ID: {currentFarmerId}</p>}
        </div>
      )}

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Farmer Details</h2>
        <input
          type="number"
          placeholder="Farmer ID"
          value={farmerId}
          onChange={(e) => setFarmerId(e.target.value)}
          className="w-full p-2 mb-2 border rounded bg-gray-800 text-white"
        />
        <input
          type="text"
          placeholder="Farmer Name"
          value={farmerName}
          onChange={(e) => setFarmerName(e.target.value)}
          className="w-full p-2 mb-2 border rounded bg-gray-800 text-white"
        />
        <button
          onClick={addOrUpdateFarmer}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Add/Update Farmer
        </button>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Add Crop</h2>
        <input
          type="number"
          placeholder="Crop ID"
          value={cropId}
          onChange={(e) => setCropId(e.target.value)}
          className="w-full p-2 mb-2 border rounded bg-gray-800 text-white"
        />
        <input
          type="number"
          placeholder="Crop Price"
          value={cropPrice}
          onChange={(e) => setCropPrice(e.target.value)}
          className="w-full p-2 mb-2 border rounded bg-gray-800 text-white"
        />
        <input
          type="text"
          placeholder="Crop Name"
          value={cropName}
          onChange={(e) => setCropName(e.target.value)}
          className="w-full p-2 mb-2 border rounded bg-gray-800 text-white"
        />
        <input
          type="text"
          placeholder="Crop Location"
          value={cropLocation}
          onChange={(e) => setCropLocation(e.target.value)}
          className="w-full p-2 mb-2 border rounded bg-gray-800 text-white"
        />
        <button
          onClick={addCrop}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Add Crop
        </button>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Fetch Farmer and Crop Details</h2>
        <button
          onClick={fetchDetails}
          className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
        >
          Fetch Details
        </button>
      </div>

      {farmerDetails && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Farmer and Crop Information</h2>
          <div className="bg-gray-800 p-4 rounded">
            <p><strong>Farmer Wallet:</strong> {farmerDetails.farmerWallet}</p>
            <p><strong>Farmer ID:</strong> {farmerDetails.id}</p>
            <p><strong>Farmer Name:</strong> {farmerDetails.farmerName}</p>
          </div>
          <h3 className="text-xl font-semibold mt-4 mb-2">Crops:</h3>
          {cropsWithUniqueIds.length === 0 ? (
            <p>No crops added yet.</p>
          ) : (
            <ul className="list-disc pl-5">
              {cropsWithUniqueIds.map((crop) => (
                <li key={crop.uniqueId} className="mb-2">
                  <p><strong>Crop ID:</strong> {crop.id}</p>
                  <p><strong>Price:</strong> {crop.price}</p>
                  <p><strong>Name:</strong> {crop.name}</p>
                  <p><strong>Location:</strong> {crop.location}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <div className="bg-gray-800 min-h-screen text-white">
        <nav className="bg-gray-900 p-4 mb-6">
          <Link to="/" className="text-white text-2xl font-bold">
            Farmer Management DApp
          </Link>
        </nav>
        <Routes>
          <Route path="/" element={<Web3FarmerComponent />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;