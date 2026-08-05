const API_URL = 'https://k1f5xsammd.execute-api.ap-south-1.amazonaws.com/';
const CLIENT_ID = '7tliavfpsko0ugfrkidm8lj2te';
const EMAIL = 'admin@eventtrail.dev';
const PASSWORD = 'Admin@EventTrail123!';

async function run() {
  const res = await fetch('https://cognito-idp.ap-south-1.amazonaws.com/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth'
    },
    body: JSON.stringify({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: { USERNAME: EMAIL, PASSWORD: PASSWORD }
    })
  });
  
  const data = await res.json();
  const idToken = data.AuthenticationResult.IdToken;

  const eventPayload = {
    title: "Test Event 2",
    coverImage: "",
    organizerId: "",
    date: "2026-07-10",
    time: "10:00 AM - 01:00 PM",
    location: "Test Location 2",
    category: "Tech",
    faculty: "Science",
    seatsTotal: 50,
    description: "test description",
    schedule: [{ time: "10:00 AM", title: "Opening", desc: "test" }],
    locationDetails: {
      entranceLat: 10.0,
      entranceLng: 76.0,
      indoorSteps: ["step 1"]
    }
  };

  const postRes = await fetch(`${API_URL}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify(eventPayload)
  });

  console.log(`Status: ${postRes.status}`);
  console.log(`Body:`, await postRes.text());
}

run().catch(console.error);
