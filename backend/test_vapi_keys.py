#!/usr/bin/env python3
"""
Test both VAPI API keys to see which one works
"""

import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_vapi_key(api_key, key_name):
    """Test a VAPI API key by making a simple request"""
    print(f"\n🔑 Testing {key_name}: {api_key[:8]}...")
    
    try:
        # Test with a simple API call to list assistants
        response = requests.get(
            "https://api.vapi.ai/assistant",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            timeout=10
        )
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print(f"   ✅ {key_name} is VALID!")
            data = response.json()
            print(f"   📊 Response: {data}")
            return True
        elif response.status_code == 401:
            print(f"   ❌ {key_name} is INVALID (Unauthorized)")
            return False
        else:
            print(f"   ⚠️  {key_name} returned status {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Error testing {key_name}: {str(e)}")
        return False

def main():
    print("🔍 Testing VAPI API Keys")
    print("=" * 40)
    
    # Get both keys from environment
    key1 = os.getenv("VAPI_API_KEY")
    key2 = os.getenv("YOUR_VAPI_API_KEY")
    
    if not key1 and not key2:
        print("❌ No VAPI keys found in .env file")
        return
    
    valid_key = None
    
    if key1:
        if test_vapi_key(key1, "VAPI_API_KEY"):
            valid_key = key1
    
    if key2:
        if test_vapi_key(key2, "YOUR_VAPI_API_KEY"):
            valid_key = key2
    
    print("\n" + "=" * 40)
    if valid_key:
        print(f"✅ Found valid key: {valid_key[:8]}...")
        print("🎉 You can now run the VAPI setup script!")
    else:
        print("❌ No valid VAPI keys found")
        print("💡 Please check your VAPI dashboard for the correct API key")

if __name__ == "__main__":
    main()

