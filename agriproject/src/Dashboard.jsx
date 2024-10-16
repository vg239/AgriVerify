import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, User } from 'lucide-react';
import QRCode from 'qrcode';

const contractAddress = "0xEe4F162B6b261Bc6260D70b2785431B3e44136B1";

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

const Dashboard = ({ web3Instance, account, contract, onConnect }) => {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchId, setSearchId] = useState('');
  const [filteredFarmers, setFilteredFarmers] = useState([]);
  const [showOnlyUserFarmers, setShowOnlyUserFarmers] = useState(false);

  useEffect(() => {
    if (contract && account) {
      fetchAllFarmers();
    } else {
      setError('Please connect your MetaMask wallet to view the dashboard.');
      setLoading(false);
    }
  }, [contract, account]);

  useEffect(() => {
    filterFarmers();
  }, [searchId, farmers, showOnlyUserFarmers]);

  const fetchAllFarmers = async () => {
    try {
      setLoading(true);
      const farmerCount = await contract.methods.farmerCount().call();
      const farmersData = [];

      for (let i = 1; i <= farmerCount; i++) {
        const farmer = await contract.methods.farmers(i).call();
        const crops = [];

        for (let j = 1; j <= farmer.cropCount; j++) {
          const crop = await contract.methods.getCrop(i, j).call();
          const qrCodeUrl = `${window.location.origin}/crop/${i}-${j}`;
          const qrCodeDataUrl = await generateQRCode(qrCodeUrl);
          const cropOwner = await contract.methods.ownerOfCropNFT(i, j).call();
          crops.push({
            cropId: Number(crop[0]),
            cropName: crop[1],
            quantity: Number(crop[2]),
            nftTokenId: Number(crop[3]),
            ipfsHash: crop[4],
            qrCodeDataUrl: qrCodeDataUrl,
            owner: cropOwner
          });
        }

        farmersData.push({
          id: Number(farmer.farmerId),
          name: farmer.name,
          cropCount: Number(farmer.cropCount),
          crops: crops,
          owner: crops.length > 0 ? crops[0].owner : null
        });
      }

      setFarmers(farmersData);
      setFilteredFarmers(farmersData);
      setError('');
    } catch (err) {
      setError('Failed to fetch farmers data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterFarmers = () => {
    let filtered = farmers;

    if (showOnlyUserFarmers) {
      filtered = filtered.filter(farmer => farmer.owner && farmer.owner.toLowerCase() === account.toLowerCase());
    }

    if (searchId.trim()) {
      filtered = filtered.filter(farmer => 
        farmer.id.toString().includes(searchId.trim())
      );
    }

    setFilteredFarmers(filtered);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-gray-800 p-6 rounded">
            <p className="text-purple-400">Loading farmer data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-gray-800 p-6 rounded">
            <p className="text-red-400">{error}</p>
            <button onClick={onConnect} className="mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-center text-purple-400">Farmer Dashboard</h1>
        
        <div className="mb-6 bg-gray-800 p-4 rounded">
          <p className="text-green-400">Connected Wallet: {account}</p>
        </div>

        {/* Search and Filter Controls */}
        <div className="mb-6 bg-gray-800 p-4 rounded">
          <div className="flex items-center justify-between mb-4">
            <div className="relative flex-grow mr-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by Farmer ID..."
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showOnlyUserFarmers"
                checked={showOnlyUserFarmers}
                onChange={(e) => setShowOnlyUserFarmers(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="showOnlyUserFarmers" className="text-sm text-gray-300 flex items-center">
                <User size={16} className="mr-1" />
                My Farmers
              </label>
            </div>
          </div>
          {filteredFarmers.length === 0 && (searchId || showOnlyUserFarmers) && (
            <p className="mt-2 text-yellow-400">No farmers found with the current filters.</p>
          )}
        </div>

        {farmers.length === 0 ? (
          <div className="bg-gray-800 p-6 rounded">
            <p className="text-center">No farmers registered yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredFarmers.map((farmer) => (
              <div key={farmer.id} className="bg-gray-800 p-6 rounded transition-all duration-300 hover:bg-gray-750">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-purple-400">Farmer: {farmer.name}</h2>
                    <p className="text-gray-300">Farmer ID: {farmer.id.toString()}</p>
                    <p className="text-gray-300">Total Crops: {farmer.cropCount.toString()}</p>
                    <p className="text-gray-300">Owner: {farmer.owner}</p>
                  </div>
                </div>

                <div className="space-y-4 mt-6">
                  <h3 className="text-xl font-semibold text-purple-400 border-b border-gray-700 pb-2">Crops</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {farmer.crops.map((crop) => (
                      <div key={`${farmer.id}-${crop.cropId}`} 
                           className="bg-gray-700 p-4 rounded hover:bg-gray-650 transition-colors">
                        <p className="font-semibold text-purple-300">Crop #{crop.cropId.toString()}</p>
                        <p><strong>Name:</strong> {crop.cropName}</p>
                        <p><strong>Quantity:</strong> {crop.quantity.toString()}</p>
                        <p><strong>NFT Token ID:</strong> {crop.nftTokenId.toString()}</p>
                        <img src={crop.qrCodeDataUrl} alt={`QR Code for Crop ${crop.cropId}`} className="my-2 w-32 h-32" />
                        <Link to={`/crop/${farmer.id}-${crop.cropId}`} 
                              className="text-blue-400 hover:text-blue-300 transition-colors mt-2 inline-block">
                          View Details
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
