import axios from 'axios';

const testAPI = async () => {
  try {
    const salonId = '69fcd1274822cccbf5a9ad57'; // Sagar Hair Salon ID from earlier
    const url = `http://localhost:5000/api/salonMedia/salon/${salonId}/media`;
    console.log('Testing API endpoint:', url);
    
    const response = await axios.get(url);
    console.log('✅ API Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testAPI();
