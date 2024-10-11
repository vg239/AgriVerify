
import axios from 'axios';

const PINATA_API_KEY = 'YOUR_PINATA_API_KEY';
const PINATA_SECRET_KEY = 'YOUR_PINATA_SECRET_KEY';

export const pinJSONToIPFS = async (JSONBody) => {
  const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
  
  try {
    const response = await axios.post(url, JSONBody, {
      headers: {
        'Content-Type': 'application/json',
        '1547904667caa674ab32': PINATA_API_KEY,
        '71627debb1bd62c8892935c45688feaccc09c8df7da195612738f92006845b8f': PINATA_SECRET_KEY
      }
    });
    
    return response.data.IpfsHash;
  } catch (error) {
    console.error("Error pinning to IPFS", error);
    throw new Error('Failed to upload to IPFS');
  }
};

export const generateNFTMetadata = (cropData, qrCodeImage, farmerId) => {
  return {
    name: `Farm Crop #${cropData.cropId}`,
    description: `Crop Details:\nFarmer ID: ${farmerId}\nCrop Name: ${cropData.cropName}\nQuantity: ${cropData.quantity}`,
    image: qrCodeImage,
    attributes: [
      {
        trait_type: "Farmer ID",
        value: farmerId
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