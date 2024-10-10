import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Web3 from 'web3';
import { QRCodeSVG } from 'qrcode.react';

const Dashboard = ({ web3Instance, account, contract, contractAddress }) => {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (contract && account) {
      fetchAllFarmers();
    }
  }, [contract, account]);

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
          crops.push({
            cropId: crop[0],
            cropName: crop[1],
            quantity: crop[2]
          });
        }

        farmersData.push({
          id: farmer.farmerId,
          name: farmer.name,
          cropCount: farmer.cropCount,
          crops: crops
        });
      }

      setFarmers(farmersData);
      setError('');
    } catch (err) {
      setError('Failed to fetch farmers data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-gray-800 p-6 rounded">
            <p className="text-red-400">Please connect your MetaMask wallet to view the dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-center text-purple-400">Farmer Dashboard</h1>
        
        <div className="mb-6 bg-gray-800 p-4 rounded">
          <p className="text-green-400">Connected Wallet: {account}</p>
        </div>

        {error && <p className="text-red-400 mb-4">{error}</p>}

        {farmers.length === 0 ? (
          <div className="bg-gray-800 p-6 rounded">
            <p className="text-center">No farmers registered yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {farmers.map((farmer) => (
              <div key={farmer.id} className="bg-gray-800 p-6 rounded">
                <h2 className="text-2xl font-semibold mb-4 text-purple-400">
                  Farmer: {farmer.name}
                </h2>
                <p className="mb-2">Farmer ID: {farmer.id}</p>
                <p className="mb-4">Total Crops: {farmer.cropCount}</p>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-purple-400">Crops</h3>
                  {farmer.crops.map((crop) => (
                    <div key={`${farmer.id}-${crop.cropId}`} className="bg-gray-700 p-4 rounded">
                      <p><strong>Crop Name:</strong> {crop.cropName}</p>
                      <p><strong>Quantity:</strong> {crop.quantity}</p>
                      <div className="mt-4">
                        <Link 
                          to={`/crop/${farmer.id}-${crop.cropId}`}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          View Details
                        </Link>
                        <div className="mt-2">
                          <QRCodeSVG
                            value={`${window.location.origin}/crop/${farmer.id}-${crop.cropId}`}
                            size={128}
                            level="H"
                            includeMargin={true}
                            className="bg-white p-2 rounded"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
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