const registerUser = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'newuser' + Date.now(),
        email: 'newuser' + Date.now() + '@example.com',
        password: 'password123'
      })
    });

    console.log('Registration response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Registration successful:', data);
      return data;
    } else {
      const errorText = await response.text();
      console.log('Registration failed:', errorText);
      return null;
    }
  } catch (error) {
    console.error('Error during registration:', error);
    return null;
  }
};

registerUser();