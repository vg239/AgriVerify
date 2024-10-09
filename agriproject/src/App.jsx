import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import contractABI from './abi.json';
import './App.css';

const contractAddress = "0x853C8A9bc0E74c363D016aC7baD03DFaeDfA0305"; // Replace with your actual deployed contract address

const Web3FarmerCropComponent = () => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [error, setError] = useState('');

  // Farmer state
  const [farmerId, setFarmerId] = useState('');
  const [farmerName, setFarmerName] = useState('');
  const [farmerData, setFarmerData] = useState(null);

  // Crop state
  const [cropId, setCropId] = useState('');
  const [cropPrice, setCropPrice] = useState('');
  const [cropName, setCropName] = useState('');
  const [cropLocation, setCropLocation] = useState('');
  const [crops, setCrops] = useState([]);

  useEffect(() => {
    const initWeb3AndContract = async () => {
      if (window.ethereum) {
        try {
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);

          const contractInstance = new web3Instance.eth.Contract(contractABI, contractAddress);
          setContract(contractInstance);

          const accounts = await web3Instance.eth.getAccounts();
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          }

          console.log('Web3 and contract initialized successfully');
        } catch (error) {
          console.error('Error initializing Web3 or contract:', error);
          setError('Failed to initialize Web3 or contract. Check console for details.');
        }
      } else {
        setError('Please install MetaMask!');
      }
    };
    initWeb3AndContract();
  }, []);

  const connectWallet = async () => {
    if (web3) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        console.log('Wallet connected:', accounts[0]);
      } catch (error) {
        console.error('Error connecting to MetaMask', error);
        setError('Failed to connect wallet. Check console for details.');
      }
    }
  };

  const addFarmer = async () => {
    setError('');
    if (!contract || !account) {
      setError('Please connect your wallet first');
      return;
    }
    if (!farmerId || !farmerName) {
      setError('Please enter both Farmer ID and Name');
      return;
    }

    try {
      await contract.methods.addFarmer(farmerId, farmerName).send({ from: account });
      console.log('Farmer added successfully');
      setFarmerId('');
      setFarmerName('');
    } catch (error) {
      console.error('Error adding farmer:', error);
      setError(`Failed to add farmer: ${error.message}`);
    }
  };

  const getFarmer = async () => {
    setError('');
    if (!contract || !account) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      const farmer = await contract.methods.getFarmerByAddress(account).call({gas: 3000000});
      setFarmerData({
        FarmerWallet: farmer[0],
        id: farmer[1],
        Farmername: farmer[2],
        crops: farmer[3],
      });
      console.log('Fetched farmer data:', farmer);
    } catch (error) {
      console.error('Error fetching farmer data:', error);
      setError(`Failed to fetch farmer data: ${error.message}`);
    }
  };

  const addCrop = async () => {
    setError('');
    if (!contract || !account) {
      setError('Please connect your wallet first');
      return;
    }
    if (!cropId || !cropPrice || !cropName || !cropLocation) {
      setError('Please fill in all crop details');
      return;
    }

    try {
      await contract.methods.addCrop(account, cropId, cropPrice, cropName, cropLocation).send({ from: account });
      console.log('Crop added successfully');
      setCropId('');
      setCropPrice('');
      setCropName('');
      setCropLocation('');
    } catch (error) {
      console.error('Error adding crop:', error);
      setError(`Failed to add crop: ${error.message}`);
    }
  };

  const getCrops = async () => {
    setError('');
    if (!contract || !account) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      const cropData = await contract.methods.getCropForFarmer(account).call();
      const formattedCrops = cropData.map((crop) => ({
        cropId: crop[0].toString(),
        cropPrice: crop[1].toString(),
        cropName: crop[2],
        location: crop[3],
      }));
      setCrops(formattedCrops);
      console.log('Fetched crop data:', formattedCrops);
    } catch (error) {
      console.error('Error fetching crop data:', error);
      setError(`Failed to fetch crop data: ${error.message}`);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-4 text-center">Web3 Farmer and Crop Management</h1>

      <button
        onClick={connectWallet}
        className="w-full bg-blue-500 text-white py-2 rounded mb-4 hover:bg-blue-600"
      >
        Connect Wallet
      </button>
      {account && <p className="text-center mb-4">Wallet connected: {account}</p>}

      <h2 className="text-lg font-semibold mb-2">Add Farmer</h2>
      <input
        type="number"
        placeholder="Farmer ID"
        value={farmerId}
        onChange={(e) => setFarmerId(e.target.value)}
        className="w-full p-2 mb-2 border rounded"
      />
      <input
        type="text"
        placeholder="Farmer Name"
        value={farmerName}
        onChange={(e) => setFarmerName(e.target.value)}
        className="w-full p-2 mb-2 border rounded"
      />
      <button
        onClick={addFarmer}
        className="w-full bg-green-500 text-white py-2 rounded mb-4 hover:bg-green-600"
      >
        Add Farmer
      </button>

      <h2 className="text-lg font-semibold mb-2">Get Farmer Data</h2>
      <button
        onClick={getFarmer}
        className="w-full bg-purple-500 text-white py-2 rounded mb-4 hover:bg-purple-600"
      >
        Fetch Farmer Data
      </button>
      {farmerData && (
        <div className="mb-4">
          <p><strong>Farmer ID:</strong> {farmerData.id}</p>
          <p><strong>Farmer Name:</strong> {farmerData.Farmername}</p>
          <p><strong>Farmer Wallet:</strong> {farmerData.FarmerWallet}</p>
          <p><strong>Crops:</strong> {farmerData.crops.length === 0 ? 'No crops' : JSON.stringify(farmerData.crops)}</p>
        </div>
      )}

      <h2 className="text-lg font-semibold mb-2">Add Crop</h2>
      <input
        type="number"
        placeholder="Crop ID"
        value={cropId}
        onChange={(e) => setCropId(e.target.value)}
        className="w-full p-2 mb-2 border rounded"
      />
      <input
        type="number"
        placeholder="Crop Price"
        value={cropPrice}
        onChange={(e) => setCropPrice(e.target.value)}
        className="w-full p-2 mb-2 border rounded"
      />
      <input
        type="text"
        placeholder="Crop Name"
        value={cropName}
        onChange={(e) => setCropName(e.target.value)}
        className="w-full p-2 mb-2 border rounded"
      />
      <input
        type="text"
        placeholder="Crop Location"
        value={cropLocation}
        onChange={(e) => setCropLocation(e.target.value)}
        className="w-full p-2 mb-2 border rounded"
      />
      <button
        onClick={addCrop}
        className="w-full bg-yellow-500 text-white py-2 rounded mb-4 hover:bg-yellow-600"
      >
        Add Crop
      </button>

      <h2 className="text-lg font-semibold mb-2">Get Crops</h2>
      <button
        onClick={getCrops}
        className="w-full bg-indigo-500 text-white py-2 rounded mb-4 hover:bg-indigo-600"
      >
        Fetch Crops
      </button>
      <ul>
        {crops.map((crop, index) => (
          <li key={index} className="p-2 bg-gray-100 border-b">
            <p><strong>Crop ID:</strong> {crop.cropId}</p>
            <p><strong>Price:</strong> {crop.cropPrice}</p>
            <p><strong>Name:</strong> {crop.cropName}</p>
            <p><strong>Location:</strong> {crop.location}</p>
          </li>
        ))}
      </ul>

      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
};

export default Web3FarmerCropComponent;