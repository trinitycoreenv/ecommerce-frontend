// Test the policy API endpoint
async function testPolicyAPI() {
  try {
    // First, login to get a token
    console.log('🔐 Logging in as admin...')
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@trinitycore.com',
        password: 'admin123'
      })
    })

    const loginData = await loginResponse.json()
    console.log('Login response:', loginData)

    if (!loginData.success || !loginData.data?.token) {
      console.error('❌ Login failed')
      return
    }

    const token = loginData.data.token
    console.log('✅ Login successful, token:', token.substring(0, 20) + '...\n')

    // Now test the policies endpoint
    console.log('📋 Fetching policies from /api/admin/policies...')
    const policiesResponse = await fetch('http://localhost:3000/api/admin/policies', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    const policiesData = await policiesResponse.json()
    console.log('Policies response:', JSON.stringify(policiesData, null, 2))

    if (policiesData.success) {
      console.log(`\n✅ Successfully fetched ${policiesData.data.length} policies`)
    } else {
      console.log('\n❌ Failed to fetch policies:', policiesData.error)
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testPolicyAPI()

