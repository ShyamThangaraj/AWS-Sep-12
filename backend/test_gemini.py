#!/usr/bin/env python3
"""
Test script for the Gemini integration endpoint
Tests the /weaviate/process-form endpoint with sample data
"""

import requests
import os
from pathlib import Path

def test_gemini_endpoint():
    """Test the Gemini processing endpoint with sample files"""
    
    # API endpoint
    url = "http://localhost:8000/weaviate/process-form"
    
    # Sample prompt
    prompt = """
    I want to simulate a conversation with a 2024 investor at FuturaTech Inc. about how the company is using its stock portfolio to generate capital for R&D.
    """
    
    # File paths
    test_input_dir = Path("test")
    
    # Prepare files
    files = []
    data = {"prompt": prompt}
    
    # Add PDF files
    pdf_files = [
        "futuratech_financials.pdf",
        "futuratech_overview.pdf"
    ]
    
    for pdf_file in pdf_files:
        pdf_path = test_input_dir / pdf_file
        if pdf_path.exists():
            files.append(("pdfs", (pdf_file, open(pdf_path, "rb"), "application/pdf")))
            print(f"Added PDF: {pdf_file}")
        else:
            print(f"PDF not found: {pdf_file}")
    
    # Add image files
    image_files = [
        "futuratech_diagram.png"
    ]
    
    for image_file in image_files:
        image_path = test_input_dir / image_file
        if image_path.exists():
            files.append(("images", (image_file, open(image_path, "rb"), "image/png")))
            print(f"Added Image: {image_file}")
        else:
            print(f"Image not found: {image_file}")
    
    if not files:
        print("No files found to upload!")
        return
    
    print(f"\n🚀 Testing Gemini endpoint with:")
    print(f"📝 Prompt: {prompt[:100]}...")
    print(f"📁 Files: {len(files)} files")
    print(f"🌐 URL: {url}")
    
    try:
        # Make the request
        response = requests.post(url, data=data, files=files)
        
        print(f"\n📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success: {result['message']}")
            print(f"🆔 Session ID: {result['data']['session_id']}")
            
            if 'normalized_text' in result['data']:
                print(f"\n🤖 Gemini Normalized Text:")
                print("=" * 50)
                print(result['data']['normalized_text'])
                print("=" * 50)
            else:
                print("❌ No normalized text in response")
                
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Make sure the backend server is running!")
        print("Run: python main.py")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    finally:
        # Close file handles
        for _, (_, file_handle, _) in files:
            file_handle.close()

if __name__ == "__main__":
    print("🧪 Testing Gemini Integration")
    print("=" * 40)
    test_gemini_endpoint()
