import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import contractABI from "./abi.json"

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

          console.log("Web3 and contract initialized successfully");
        } catch (error) {
          console.error("Error initializing Web3 or contract:", error);
          setError("Failed to initialize Web3 or contract. Check console for details.");
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
        console.log("Wallet connected:", accounts[0]);
      } catch (error) {
        console.error("Error connecting to MetaMask", error);
        setError("Failed to connect wallet. Check console for details.");
      }
    }
  };

  const addFarmer = async () => {
    setError('');
    if (!contract || !account) {
      setError("Please connect your wallet first");
      return;
    }
    if (!farmerId || !farmerName) {
      setError("Please enter both Farmer ID and Name");
      return;
    }

    try {
      await contract.methods.addFarmer(farmerId, farmerName).send({ from: account });
      console.log("Farmer added successfully");
      setFarmerId('');
      setFarmerName('');
    } catch (error) {
      console.error("Error adding farmer:", error);
      setError(`Failed to add farmer: ${error.message}`);
    }
  };

  const getFarmer = async () => {
    setError('');
    if (!contract || !account) {
      setError("Please connect your wallet first");
      return;
    }

    try {
      const farmer = await contract.methods.getFarmerByAddress(account).call();
      setFarmerData({   
        FarmerWallet: farmer[0],
        id: farmer[1],
        Farmername: farmer[2],
        crops: farmer[3]
      });
      console.log("Fetched farmer data:", farmer);
    } catch (error) {
      console.error("Error fetching farmer data:", error);
      setError(`Failed to fetch farmer data: ${error.message}`);
    }
  };

  const addCrop = async () => {
    setError('');
    if (!contract || !account) {
      setError("Please connect your wallet first");
      return;
    }
    if (!cropId || !cropPrice || !cropName || !cropLocation) {
      setError("Please fill in all crop details");
      return;
    }

    try {
      await contract.methods.addCrop(account, cropId, cropPrice, cropName, cropLocation).send({ from: account });
      console.log("Crop added successfully");
      setCropId('');
      setCropPrice('');
      setCropName('');
      setCropLocation('');
    } catch (error) {
      console.error("Error adding crop:", error);
      setError(`Failed to add crop: ${error.message}`);
    }
  };

  const getCrops = async () => {
    setError('');
    if (!contract || !account) {
      setError("Please connect your wallet first");
      return;
    }

    try {
      const cropData = await contract.methods.getCropForFarmer(account).call();
      const formattedCrops = cropData.map(crop => ({
        cropId: crop[0].toString(),
        cropPrice: crop[1].toString(),
        cropName: crop[2],
        location: crop[3]
      }));
      setCrops(formattedCrops);
      console.log("Fetched crop data:", formattedCrops);
    } catch (error) {
      console.error("Error fetching crop data:", error);
      setError(`Failed to fetch crop data: ${error.message}`);
    }
  };

  return (
    <div>
      <h1>Web3 Farmer and Crop Management</h1>
      
      <button onClick={connectWallet}>Connect Wallet</button>
      {account && <p>Wallet connected: {account}</p>}
      
      <h2>Add Farmer</h2>
      <input 
        type="number" 
        placeholder="Farmer ID" 
        value={farmerId} 
        onChange={(e) => setFarmerId(e.target.value)} 
      />
      <input 
        type="text" 
        placeholder="Farmer Name" 
        value={farmerName} 
        onChange={(e) => setFarmerName(e.target.value)} 
      />
      <button onClick={addFarmer}>Add Farmer</button>
      
      <h2>Get Farmer Data</h2>
      <button onClick={getFarmer}>Fetch Farmer Data</button>
      {farmerData && (
        <div>
          <p>Farmer ID: {farmerData.id.toString()}</p>
          <p>Farmer Name: {farmerData.Farmername}</p>
          <p>Farmer Wallet: {farmerData.FarmerWallet}</p>
          <p>Crops: {farmerData.crops.length === 0 ? "No crops" : JSON.stringify(farmerData.crops)}</p>
        </div>
      )}

      <h2>Add Crop</h2>
      <input 
        type="number" 
        placeholder="Crop ID" 
        value={cropId} 
        onChange={(e) => setCropId(e.target.value)} 
      />
      <input 
        type="number" 
        placeholder="Crop Price" 
        value={cropPrice} 
        onChange={(e) => setCropPrice(e.target.value)} 
      />
      <input 
        type="text" 
        placeholder="Crop Name" 
        value={cropName} 
        onChange={(e) => setCropName(e.target.value)} 
      />
      <input 
        type="text" 
        placeholder="Crop Location" 
        value={cropLocation} 
        onChange={(e) => setCropLocation(e.target.value)} 
      />
      <button onClick={addCrop}>Add Crop</button>

      <h2>Get Crops</h2>
      <button onClick={getCrops}>Fetch Crops</button>
      {crops.length > 0 && (
        <div>
          <h3>Crops:</h3>
          {crops.map((crop, index) => (
            <div key={index}>
              <p>Crop ID: {crop.cropId}</p>
              <p>Crop Name: {crop.cropName}</p>
              <p>Crop Price: {crop.cropPrice}</p>
              <p>Location: {crop.location}</p>
            </div>
          ))}
        </div>
      )}


    </div>
  );
};

export default Web3FarmerCropComponent;