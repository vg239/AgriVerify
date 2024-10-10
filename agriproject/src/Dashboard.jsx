import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Search } from 'lucide-react';

const Dashboard = ({ web3Instance, account, contract, contractAddress }) => {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchId, setSearchId] = useState('');
  const [filteredFarmers, setFilteredFarmers] = useState([]);

  useEffect(() => {
    if (contract && account) {
      fetchAllFarmers();
    }
  }, [contract, account]);

  useEffect(() => {
    filterFarmers();
  }, [searchId, farmers]);

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

  const filterFarmers = () => {
    if (!searchId.trim()) {
      setFilteredFarmers(farmers);
      return;
    }

    const filtered = farmers.filter(farmer => 
      farmer.id.toString().includes(searchId.trim())
    );
    setFilteredFarmers(filtered);
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

        {/* Search Box */}
        <div className="mb-6 bg-gray-800 p-4 rounded">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by Farmer ID..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />
          </div>
          {filteredFarmers.length === 0 && searchId && (
            <p className="mt-2 text-yellow-400">No farmers found with ID: {searchId}</p>
          )}
        </div>

        {error && <p className="text-red-400 mb-4">{error}</p>}

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
                    <h2 className="text-2xl font-semibold text-purple-400">
                      Farmer: {farmer.name}
                    </h2>
                    <p className="text-gray-300">Farmer ID: {farmer.id.toString()}</p>
                    <p className="text-gray-300">Total Crops: {farmer.cropCount.toString()}</p>
                  </div>
                </div>

                <div className="space-y-4 mt-6">
                  <h3 className="text-xl font-semibold text-purple-400 border-b border-gray-700 pb-2">
                    Crops
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {farmer.crops.map((crop) => (
                      <div 
                        key={`${farmer.id}-${crop.cropId}`} 
                        className="bg-gray-700 p-4 rounded hover:bg-gray-650 transition-colors"
                      >
                        <p className="font-semibold text-purple-300">Crop #{crop.cropId.toString()}</p>
                        <p><strong>Name:</strong> {crop.cropName}</p>
                        <p><strong>Quantity:</strong> {crop.quantity.toString()}</p>
                        <div className="mt-4">
                          <Link 
                            to={`/crop/${farmer.id}-${crop.cropId}`}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;