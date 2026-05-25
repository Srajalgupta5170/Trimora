import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testBarberjoinRequest() {
  try {
    console.log('\n🧪 BARBER JOIN REQUEST WORKFLOW TEST\n');
    console.log('═'.repeat(60));

    // Step 1: Create Salon Owner Account
    console.log('\n📝 Step 1: Creating Salon Owner Account...');
    const ownerSignup = await axios.post(`${API_URL}/auth/register-salon`, {
      name: 'Owner Alice',
      email: `owner${Date.now()}@test.com`,
      password: 'password123',
      salonName: 'Premium Salon',
      salonLocation: '456 Oak Ave'
    });
    const ownerToken = ownerSignup.data.token;
    const salonId = ownerSignup.data.salon.id;
    console.log('✅ Salon Owner Created!');
    console.log('   Email:', ownerSignup.data.owner.email);
    console.log('   Salon ID:', salonId);

    // Step 2: Create Barber Account
    console.log('\n👨‍💼 Step 2: Creating Barber Account...');
    const barberEmail = `barber${Date.now()}@test.com`;
    const barberSignup = await axios.post(`${API_URL}/auth/signup`, {
      name: 'Barber Bob',
      email: barberEmail,
      password: 'password123',
      role: 'barber'
    });
    const barberId = barberSignup.data.user.id;
    console.log('✅ Barber Created!');
    console.log('   Email:', barberSignup.data.user.email);
    console.log('   Barber ID:', barberId);

    // Step 2B: Login as Barber to get token
    console.log('\n🔑 Step 2B: Barber Login to Get Token...');
    const barberLogin = await axios.post(`${API_URL}/auth/login`, {
      email: barberEmail,
      password: 'password123'
    });
    const barberToken = barberLogin.data.token;
    console.log('✅ Barber Logged In!');
    console.log('   Token:', barberToken.substring(0, 20) + '...');

    // Step 3: Barber requests to join salon
    console.log('\n📤 Step 3: Barber Requests to Join Salon...');
    const joinRequest = await axios.post(
      `${API_URL}/join-requests/request`,
      {
        salonId,
        experience: 5,
        basePrice: 200,
        bio: 'Experienced barber specializing in modern cuts',
        specializations: ['Modern Cuts', 'Fades', 'Shaves']
      },
      { headers: { 'Authorization': `Bearer ${barberToken}` } }
    );
    const requestId = joinRequest.data.request._id;
    console.log('✅ Join Request Submitted!');
    console.log('   Request ID:', requestId);
    console.log('   Status:', joinRequest.data.request.status);
    console.log('   Experience:', joinRequest.data.request.experience);

    // Step 4: Salon owner views pending requests
    console.log('\n👀 Step 4: Salon Owner Views Pending Requests...');
    const pendingRequests = await axios.get(
      `${API_URL}/join-requests/pending`,
      { headers: { 'Authorization': `Bearer ${ownerToken}` } }
    );
    console.log('✅ Pending Requests Retrieved!');
    console.log('   Total Pending:', pendingRequests.data.count);
    console.log('   First Request:');
    console.log('     - Barber Name:', pendingRequests.data.requests[0].barberName);
    console.log('     - Experience:', pendingRequests.data.requests[0].experience);
    console.log('     - Status:', pendingRequests.data.requests[0].status);

    // Step 5: Barber views their own requests
    console.log('\n📋 Step 5: Barber Views Their Own Requests...');
    const myRequests = await axios.get(
      `${API_URL}/join-requests/my-requests`,
      { headers: { 'Authorization': `Bearer ${barberToken}` } }
    );
    console.log('✅ My Requests Retrieved!');
    console.log('   Total Requests:', myRequests.data.count);
    console.log('   First Request Status:', myRequests.data.requests[0].status);

    // Step 6: Salon owner ACCEPTS the request
    console.log('\n✅ Step 6: Salon Owner Accepts Request...');
    const acceptResponse = await axios.post(
      `${API_URL}/join-requests/${requestId}/accept`,
      {},
      { headers: { 'Authorization': `Bearer ${ownerToken}` } }
    );
    console.log('✅ Request ACCEPTED!');
    console.log('   Barber Profile Created:', acceptResponse.data.barberProfile.name);
    console.log('   Profile ID:', acceptResponse.data.barberProfile._id);
    console.log('   Status Changed:', acceptResponse.data.request.status);

    // Step 7: Verify barber is now in salon
    console.log('\n🔍 Step 7: Verifying Barber Joined Salon...');
    const verifyRequests = await axios.get(
      `${API_URL}/join-requests/my-requests`,
      { headers: { 'Authorization': `Bearer ${barberToken}` } }
    );
    const acceptedRequest = verifyRequests.data.requests.find(r => r.status === 'accepted');
    console.log('✅ Verification Complete!');
    console.log('   Request Status:', acceptedRequest.status);
    console.log('   Salon Name:', acceptedRequest.salonName);

    console.log('\n' + '═'.repeat(60));
    console.log('✅ ALL TESTS PASSED!');
    console.log('\n🎯 BARBER JOIN REQUEST WORKFLOW SUMMARY:');
    console.log('   1. ✅ Barber can request to join a salon');
    console.log('   2. ✅ Salon owner can view pending requests');
    console.log('   3. ✅ Barber can view their own requests');
    console.log('   4. ✅ Salon owner can accept requests');
    console.log('   5. ✅ Accepting creates barber profile in salon');
    console.log('\n💡 NEXT STEPS FOR FRONTEND:');
    console.log('   1. Barbers: Go to "Join Salon" tab');
    console.log('   2. Barbers: Browse available salons');
    console.log('   3. Barbers: Click "Request to Join"');
    console.log('   4. Owners: Go to "Join Requests" tab');
    console.log('   5. Owners: View pending requests');
    console.log('   6. Owners: Click "Accept" or "Reject"\n');

  } catch (error) {
    console.error('\n❌ ERROR:');
    console.error('Message:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run test
testBarberjoinRequest();
