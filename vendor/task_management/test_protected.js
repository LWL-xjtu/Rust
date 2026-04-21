const testProtectedRoute = async () => {
  try {
    // First, login to get a token
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.log('Login failed:', errorText);
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('Login successful, token received');

    // Now try to access a protected route
    const meResponse = await fetch('http://localhost:3001/api/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    console.log('Me response status:', meResponse.status);
    
    if (meResponse.ok) {
      const userData = await meResponse.json();
      console.log('Protected route access successful:', userData);
    } else {
      const errorText = await meResponse.text();
      console.log('Protected route access failed:', errorText);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

testProtectedRoute();