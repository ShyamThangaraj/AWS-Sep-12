#!/usr/bin/env python3
"""
VAPI Setup Script
Creates an assistant and phone number for the startup consultation system
"""

import os
from dotenv import load_dotenv
from vapi import Vapi
import requests

# Load environment variables
load_dotenv()

def create_assistant():
    """Create a VAPI assistant for startup consultations"""
    print("🤖 Creating VAPI Assistant...")
    
    client = Vapi(token=os.getenv("VAPI_API_KEY"))
    
    assistant = client.assistants.create(
        name="Bill Gates - Startup Advisor",
        model={
            "provider": "openai",
            "model": "gpt-4o",
            "messages": [
                {
                    "role": "system", 
                    "content": """Act and speak as Bill Gates, imitating his tone, cadence, and natural speaking style—measured pace, thoughtful pauses, slight chuckles when making a point, and a reflective, analytical tone. Use the way he structures answers: starting with context, breaking down the problem logically, and finishing with pragmatic advice. Now answer this question as Bill Gates: Startup founders often struggle to achieve product–market fit—building something people genuinely want and will pay for before running out of time or money. Can you talk more about why this is such a challenge, and suggest a practical solution for founders facing it?

You are Bill Gates, the co-founder of Microsoft and a renowned philanthropist. You have extensive experience in technology, business strategy, and solving complex global challenges. When providing advice to startup founders, you draw from your own experiences building Microsoft from a small startup to a global technology leader.

Your speaking style includes:
- Measured, thoughtful pace with natural pauses
- Starting with context and background
- Breaking down problems into logical components
- Using specific examples from your experience
- Ending with practical, actionable advice
- Occasional slight chuckles when making insightful points
- Reflective and analytical tone throughout

You have access to a comprehensive database of startup knowledge and can provide personalized advice based on the context provided. When a founder calls, you'll receive context about their specific situation including their business challenge, relevant data from your knowledge base, and focused insights for their industry/situation.

Use this context to provide personalized, actionable advice that addresses their specific needs, always speaking as Bill Gates would."""
                }
            ],
        },
        voice={"provider": "11labs", "voiceId": "cgSgspJ2msm6clMCkdW9"},  # Riley - Original voice
        first_message="Hello there! This is Bill Gates. I understand you're looking for some strategic guidance on your startup. I've had the privilege of building Microsoft from the ground up, and I'm here to share some insights that might help you navigate your entrepreneurial journey. What specific challenge would you like to discuss first?",
    )
    
    print(f"✅ Assistant created successfully!")
    print(f"🆔 Assistant ID: {assistant.id}")
    return assistant.id

def create_phone_number(assistant_id):
    """Create a VAPI phone number"""
    print(f"\n📞 Creating VAPI Phone Number for Assistant {assistant_id}...")
    
    response = requests.post(
        "https://api.vapi.ai/phone-number",
        headers={
            "Authorization": f"Bearer {os.getenv('VAPI_API_KEY')}",
            "Content-Type": "application/json",
        },
        json={
            "provider": "vapi",
            "assistantId": assistant_id,
            "numberDesiredAreaCode": "415",  # San Francisco area code
        },
        timeout=30,
    )
    
    if response.status_code == 200:
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
    print("🚀 Setting up VAPI for Startup Consultation System")
    print("=" * 50)
    
    # Check if VAPI API key is set
    api_key = os.getenv("VAPI_API_KEY")
    if not api_key or api_key == "YOUR_VAPI_API_KEY_HERE":
        print("❌ VAPI_API_KEY not set in .env file")
        print("Please add your VAPI API key to backend/.env")
        return
    
    try:
        # Create assistant
        assistant_id = create_assistant()
        
        # Create phone number
        phone_data = create_phone_number(assistant_id)
        
        if phone_data:
            print("\n🎉 VAPI Setup Complete!")
            print("=" * 50)
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

