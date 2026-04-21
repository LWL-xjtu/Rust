const loginUser = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });

    console.log('Login response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Login successful:', data);
      return data;
    } else {
      const errorText = await response.text();
      console.log('Login failed:', errorText);
      return null;
    }
  } catch (error) {
    console.error('Error during login:', error);
    return null;
  }
};

loginUser();