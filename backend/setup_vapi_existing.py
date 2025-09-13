#!/usr/bin/env python3
"""
VAPI Setup Script - Using Existing Assistant
Creates a phone number for the existing Riley assistant
"""

import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_existing_assistant():
    """Get the existing assistant ID"""
    print("🤖 Getting existing VAPI Assistant...")
    
    api_key = os.getenv("VAPI_API_KEY")
    
    try:
        response = requests.get(
            "https://api.vapi.ai/assistant",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            timeout=10
        )
        
        if response.status_code == 200:
            assistants = response.json()
            if assistants:
                assistant = assistants[0]  # Use the first assistant
                print(f"✅ Found existing assistant: {assistant['name']}")
                print(f"🆔 Assistant ID: {assistant['id']}")
                return assistant['id']
            else:
                print("❌ No assistants found")
                return None
        else:
            print(f"❌ Failed to get assistants: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Error getting assistant: {str(e)}")
        return None

def create_phone_number(assistant_id):
    """Create a VAPI phone number"""
    print(f"\n📞 Creating VAPI Phone Number for Assistant {assistant_id}...")
    
    api_key = os.getenv("VAPI_API_KEY")
    
    response = requests.post(
        "https://api.vapi.ai/phone-number",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "provider": "vapi",
            "assistantId": assistant_id,
            "numberDesiredAreaCode": "689",  # Available area code
        },
        timeout=30,
    )
    
    if response.status_code in [200, 201]:
        phone_data = response.json()
        print(f"✅ Phone number created successfully!")
        print(f"📞 Phone Number ID: {phone_data['id']}")
        print(f"📞 Phone Number: {phone_data.get('number', 'N/A')}")
        return phone_data
    else:
        print(f"❌ Failed to create phone number: {response.status_code}")
        print(f"Response: {response.text}")
        return None

def main():
    """Main setup function"""
    print("🚀 Setting up VAPI Phone Number for Existing Assistant")
    print("=" * 60)
    
    # Check if VAPI API key is set
    api_key = os.getenv("VAPI_API_KEY")
    if not api_key:
        print("❌ VAPI_API_KEY not set in .env file")
        return
    
    try:
        # Get existing assistant
        assistant_id = get_existing_assistant()
        
        if not assistant_id:
            print("❌ Could not get assistant ID")
            return
        
        # Create phone number
        phone_data = create_phone_number(assistant_id)
        
        if phone_data:
            print("\n🎉 VAPI Setup Complete!")
            print("=" * 60)
            print(f"Assistant ID: {assistant_id}")
            print(f"Phone Number: {phone_data.get('number', 'N/A')}")
            print(f"Phone Number ID: {phone_data['id']}")
            
            # Save to .env file
            with open('.env', 'a') as f:
                f.write(f"\n# VAPI Assistant and Phone Number\n")
                f.write(f"VAPI_ASSISTANT_ID={assistant_id}\n")
                f.write(f"VAPI_PHONE_NUMBER_ID={phone_data['id']}\n")
                f.write(f"VAPI_PHONE_NUMBER={phone_data.get('number', '')}\n")
            
            print(f"\n💾 Configuration saved to .env file")
            print(f"📝 You can now use these IDs in your application")
        
    except Exception as e:
        print(f"❌ Setup failed: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")

if __name__ == "__main__":
    main()
