from fastapi import APIRouter, File, UploadFile, Form
from typing import List
from pydantic import BaseModel
import aiofiles
import uuid
import os
from pathlib import Path
from google import genai
from google.genai.types import HttpOptions, Part
from dotenv import load_dotenv
from services.weaviate_service import weaviate_service

# Load environment variables
load_dotenv()

router = APIRouter(prefix="/weaviate", tags=["weaviate"])

# Pydantic models for request/response
class VAPIRequest(BaseModel):
    prompt: str
    phone_number: str = None

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Initialize Gemini client
def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in environment variables")
    
    return genai.Client(api_key=api_key)

async def process_with_gemini(prompt: str, pdf_paths: List[str], image_paths: List[str]) -> str:
    """
    Process the prompt, PDFs, and images using Gemini 2.0 Flash Lite
    Returns normalized text suitable for Weaviate storage
    """
    try:
        print(f"      🔧 Initializing Gemini client...")
        client = get_gemini_client()
        
        # Build the content array for Gemini
        contents = [prompt]
        print(f"      📝 Added prompt to contents ({len(prompt)} characters)")
        
        # Add PDF files (Note: Gemini may need PDFs to be converted to text first)
        print(f"      📄 Processing {len(pdf_paths)} PDF files...")
        for i, pdf_path in enumerate(pdf_paths):
            print(f"        Adding PDF {i+1}: {Path(pdf_path).name}")
            # For now, we'll add a note about the PDF
            # In a real implementation, you might want to extract text from PDFs first
            contents.append(f"[PDF file: {Path(pdf_path).name}]")
        
        # Add image files
        print(f"      🖼️  Processing {len(image_paths)} image files...")
        for i, image_path in enumerate(image_paths):
            print(f"        Reading image {i+1}: {Path(image_path).name}")
            with open(image_path, 'rb') as image_file:
                image_data = image_file.read()
            
            # Determine MIME type based on file extension
            if image_path.lower().endswith(('.jpg', '.jpeg')):
                mime_type = "image/jpeg"
            elif image_path.lower().endswith('.png'):
                mime_type = "image/png"
            else:
                mime_type = "image/jpeg"  # default
            
            print(f"        ✅ Added image {i+1} ({len(image_data)} bytes, {mime_type})")
            
            # Create inline data part for the image
            image_part = Part.from_bytes(
                data=image_data,
                mime_type=mime_type
            )
            contents.append(image_part)
        
        # Add instruction for normalization optimized for Weaviate
        normalization_instruction = """
        
        Please analyze and normalize the above content (prompt, PDFs, and images) into a comprehensive, well-structured text format that is specifically optimized for Weaviate vector database storage and semantic search.
        
        The normalized text should be structured for Weaviate with these characteristics:
        
        1. **Semantic Richness**: Use descriptive, context-rich language that captures the full meaning and relationships between concepts
        2. **Searchable Keywords**: Include relevant technical terms, business concepts, and domain-specific vocabulary
        3. **Hierarchical Structure**: Organize information in a logical hierarchy with clear sections and subsections
        4. **Entity Relationships**: Explicitly mention relationships between entities, concepts, and ideas
        5. **Context Preservation**: Maintain the original context and intent while making it more discoverable
        6. **Dense Information**: Pack maximum relevant information into coherent, searchable chunks
        7. **Cross-References**: Include references and connections between different parts of the content
        8. **Metadata Integration**: Embed implicit metadata and categorization within the text
        
        Format the output as structured, searchable content that will work optimally with Weaviate's vector embeddings and semantic search capabilities. Focus on creating text that will be highly retrievable and contextually relevant when users search for related information.
        
        Provide a comprehensive, Weaviate-optimized normalized summary of all the content.
        """
        
        contents.append(normalization_instruction)
        print(f"      📋 Added normalization instruction")
        print(f"      📊 Total content parts: {len(contents)}")
        
        # Generate content using Gemini 2.0 Flash
        print(f"      🚀 Sending to Gemini 2.0 Flash Thinking...")
        response = client.models.generate_content(
            model="gemini-2.0-flash-thinking-exp",  # Using Gemini 2.0 Flash
            contents=contents,
        )
        
        print(f"      ✅ Received response from Gemini ({len(response.text)} characters)")
        return response.text
        
    except Exception as e:
        print(f"      ❌ Gemini processing error: {str(e)}")
        import traceback
        print(f"      📋 Traceback: {traceback.format_exc()}")
        raise Exception(f"Error processing with Gemini: {str(e)}")

@router.post("/process-form")
async def process_form(
    prompt: str = Form(...),
    phone_number: str = Form(None),
    pdfs: List[UploadFile] = File(None),
    images: List[UploadFile] = File(None)
):
    """
    Process a form containing:
    - prompt: Text prompt
    - pdfs: List of PDF files (optional)
    - images: List of image files (optional)
    """
    
    print(f"\n🚀 ===== FORM PROCESSING STARTED =====")
    print(f"📝 Received form submission:")
    print(f"   - Prompt length: {len(prompt)} characters")
    print(f"   - Prompt preview: {prompt[:100]}...")
    print(f"   - PDFs received: {len(pdfs) if pdfs else 0}")
    print(f"   - Images received: {len(images) if images else 0}")
    
    # Create a unique session directory for this request
    session_id = str(uuid.uuid4())
    session_dir = UPLOAD_DIR / session_id
    session_dir.mkdir(exist_ok=True)
    print(f"🆔 Generated session ID: {session_id}")
    print(f"📁 Created session directory: {session_dir}")
    
    uploaded_files = {
        "prompt": prompt,
        "phone_number": phone_number,
        "pdfs": [],
        "images": [],
        "session_id": session_id
    }
    
    # Save PDF files
    print(f"\n📄 ===== PROCESSING PDF FILES =====")
    if pdfs:
        pdf_dir = session_dir / "pdfs"
        pdf_dir.mkdir(exist_ok=True)
        print(f"📁 Created PDF directory: {pdf_dir}")
        
        for i, pdf in enumerate(pdfs):
            if pdf.filename:
                print(f"   Processing PDF {i+1}/{len(pdfs)}: {pdf.filename}")
                file_path = pdf_dir / pdf.filename
                async with aiofiles.open(file_path, 'wb') as f:
                    content = await pdf.read()
                    await f.write(content)
                print(f"   ✅ Saved: {pdf.filename} ({len(content)} bytes)")
                uploaded_files["pdfs"].append({
                    "filename": pdf.filename,
                    "size": len(content),
                    "path": str(file_path)
                })
    else:
        print("   No PDF files to process")
    
    # Save image files
    print(f"\n🖼️  ===== PROCESSING IMAGE FILES =====")
    if images:
        image_dir = session_dir / "images"
        image_dir.mkdir(exist_ok=True)
        print(f"📁 Created image directory: {image_dir}")
        
        for i, image in enumerate(images):
            if image.filename:
                print(f"   Processing image {i+1}/{len(images)}: {image.filename}")
                file_path = image_dir / image.filename
                async with aiofiles.open(file_path, 'wb') as f:
                    content = await image.read()
                    await f.write(content)
                print(f"   ✅ Saved: {image.filename} ({len(content)} bytes)")
                uploaded_files["images"].append({
                    "filename": image.filename,
                    "size": len(content),
                    "path": str(file_path)
                })
    else:
        print("   No image files to process")
    
    # Process with Gemini
    print(f"\n🤖 ===== GEMINI AI PROCESSING =====")
    try:
        pdf_paths = [pdf["path"] for pdf in uploaded_files["pdfs"]]
        image_paths = [image["path"] for image in uploaded_files["images"]]
        
        print(f"   📄 PDF files to process: {len(pdf_paths)}")
        for pdf_path in pdf_paths:
            print(f"     - {pdf_path}")
        print(f"   🖼️  Image files to process: {len(image_paths)}")
        for image_path in image_paths:
            print(f"     - {image_path}")
        
        print(f"   🚀 Sending to Gemini AI...")
        normalized_text = await process_with_gemini(prompt, pdf_paths, image_paths)
        
        print(f"   ✅ Gemini processing completed!")
        print(f"   📊 Normalized text length: {len(normalized_text)} characters")
        print(f"   📝 First 200 characters: {normalized_text[:200]}...")
        
        # Add the normalized text to the response
        uploaded_files["normalized_text"] = normalized_text
        
        # Store in Weaviate
        print(f"\n💾 ===== WEAVIATE STORAGE =====")
        weaviate_stored = False
        try:
            # Connect to Weaviate
            print(f"   🔗 Connecting to Weaviate...")
            if weaviate_service.connect():
                print(f"   ✅ Connected to Weaviate successfully")
                print(f"   📊 Collection: {weaviate_service.collection_name}")
                
                # Create collection if it doesn't exist
                print(f"   🏗️  Ensuring collection exists...")
                weaviate_service.create_collection()
                
                # Store the document
                print(f"   💾 Storing document in Weaviate...")
                weaviate_stored = weaviate_service.store_document(
                    session_id=session_id,
                    prompt=prompt,
                    normalized_text=normalized_text,
                    pdf_files=uploaded_files["pdfs"],
                    image_files=uploaded_files["images"]
                )
                
                if weaviate_stored:
                    print(f"   ✅ Successfully stored in Weaviate!")
                    print(f"   🆔 Session ID: {session_id}")
                else:
                    print(f"   ❌ Failed to store in Weaviate")
                
                weaviate_service.close()
                print(f"   🔌 Disconnected from Weaviate")
            else:
                print(f"   ❌ Failed to connect to Weaviate")
        except Exception as weaviate_error:
            print(f"   ❌ Weaviate storage error: {weaviate_error}")
            import traceback
            print(f"   📋 Traceback: {traceback.format_exc()}")
        
        print(f"\n🎉 ===== FORM PROCESSING COMPLETED =====")
        print(f"   ✅ Session ID: {session_id}")
        print(f"   📁 Files processed: {len(uploaded_files['pdfs']) + len(uploaded_files['images'])}")
        print(f"   📄 PDFs: {len(uploaded_files['pdfs'])}")
        print(f"   🖼️  Images: {len(uploaded_files['images'])}")
        print(f"   💾 Weaviate stored: {weaviate_stored}")
        print(f"   📊 Normalized text length: {len(normalized_text)} characters")
        print(f"==========================================\n")
        
        return {
            "message": "Form processed successfully with Gemini",
            "data": uploaded_files,
            "weaviate_stored": weaviate_stored,
            "status": "success"
        }
        
    except Exception as e:
        print(f"\n❌ ===== FORM PROCESSING ERROR =====")
        print(f"   Error: {str(e)}")
        import traceback
        print(f"   Traceback: {traceback.format_exc()}")
        print(f"==========================================\n")
        return {
            "message": f"Error processing with Gemini: {str(e)}",
            "data": uploaded_files,
            "status": "error"
        }

@router.get("/search")
async def search_documents(query: str, limit: int = 5):
    """
    Search for documents using semantic search
    """
    try:
        if weaviate_service.connect():
            results = weaviate_service.search_documents(query, limit)
            weaviate_service.close()
            
            return {
                "message": "Search completed successfully",
                "query": query,
                "results": results,
                "count": len(results),
                "status": "success"
            }
        else:
            return {
                "message": "Failed to connect to Weaviate",
                "status": "error"
            }
    except Exception as e:
        return {
            "message": f"Error searching documents: {str(e)}",
            "status": "error"
        }

@router.post("/rag")
async def generate_rag_response(query: str, limit: int = 3):
    """
    Generate a response using Retrieval Augmented Generation (RAG)
    """
    try:
        if weaviate_service.connect():
            response = weaviate_service.generate_response(query, limit)
            weaviate_service.close()
            
            return {
                "message": "RAG response generated successfully",
                "query": query,
                "response": response,
                "status": "success"
            }
        else:
            return {
                "message": "Failed to connect to Weaviate",
                "status": "error"
            }
    except Exception as e:
        return {
            "message": f"Error generating RAG response: {str(e)}",
            "status": "error"
        }

@router.post("/test-generate")
async def test_generate_near_text(
    query: str,
    limit: int = 3,
    grouped_task: str = "Generate a comprehensive response based on the retrieved documents"
):
    """
    Test the collection.generate.near_text() method directly
    """
    try:
        if weaviate_service.connect():
            collection = weaviate_service.client.collections.get("NormalizedDocuments")
            
            # First, let's try the generate.near_text method
            try:
                response = collection.generate.near_text(
                    query=query,
                    limit=limit,
                    grouped_task=grouped_task
                )
                
                # Extract the generated text from the response
                generated_text = response.generated
                if generated_text:
                    response_text = generated_text
                else:
                    response_text = "No response generated"
                
                weaviate_service.close()
                
                return {
                    "message": "Direct generate.near_text test completed successfully",
                    "query": query,
                    "limit": limit,
                    "grouped_task": grouped_task,
                    "response": response_text,
                    "method": "generate.near_text",
                    "status": "success"
                }
            except Exception as gen_error:
                # If generate fails, fall back to regular search
                print(f"Generate failed: {gen_error}")
                
                # Fallback to regular search
                search_response = collection.query.near_text(
                    query=query,
                    limit=limit
                )
                
                # Format the search results
                results = []
                for obj in search_response.objects:
                    results.append({
                        "id": str(obj.uuid),
                        "content": obj.properties.get("normalized_content", "")[:500] + "..." if len(obj.properties.get("normalized_content", "")) > 500 else obj.properties.get("normalized_content", ""),
                        "session_id": obj.properties.get("session_id", ""),
                        "original_prompt": obj.properties.get("original_prompt", "")
                    })
                
                weaviate_service.close()
                
                return {
                    "message": "Generate failed, returning search results instead",
                    "query": query,
                    "limit": limit,
                    "grouped_task": grouped_task,
                    "response": f"Found {len(results)} relevant documents",
                    "method": "fallback_search",
                    "search_results": results,
                    "generate_error": str(gen_error),
                    "status": "partial_success"
                }
        else:
            return {
                "message": "Failed to connect to Weaviate",
                "status": "error"
            }
    except Exception as e:
        return {
            "message": f"Error in direct generate test: {str(e)}",
            "status": "error"
        }

@router.post("/test-cohere-direct")
async def test_cohere_direct():
    """
    Test Cohere API key directly through Weaviate
    """
    try:
        if weaviate_service.connect():
            collection = weaviate_service.client.collections.get("NormalizedDocuments")
            
            # Test with a simple query
            try:
                response = collection.generate.near_text(
                    query="test query",
                    limit=1,
                    grouped_task="Say hello"
                )
                
                generated_text = response.generated
                weaviate_service.close()
                
                return {
                    "message": "Cohere direct test successful",
                    "response": generated_text,
                    "status": "success"
                }
            except Exception as gen_error:
                weaviate_service.close()
                return {
                    "message": "Cohere direct test failed",
                    "error": str(gen_error),
                    "status": "error"
                }
        else:
            return {
                "message": "Failed to connect to Weaviate",
                "status": "error"
            }
    except Exception as e:
        return {
            "message": f"Error in Cohere direct test: {str(e)}",
            "status": "error"
        }

@router.post("/query-agent")
async def query_with_agent(query: str):
    """
    Use Weaviate Query Agent with Gemini to answer natural language queries
    """
    try:
        if weaviate_service.connect():
            response = weaviate_service.query_with_agent(query)
            weaviate_service.close()
            
            return {
                "message": "Query Agent response generated successfully",
                "query": query,
                "response": response,
                "status": "success"
            }
        else:
            return {
                "message": "Failed to connect to Weaviate",
                "status": "error"
            }
    except Exception as e:
        return {
            "message": f"Error with Query Agent: {str(e)}",
            "status": "error"
        }

@router.post("/weaviate-query-generator")
async def generate_weaviate_query_for_vapi(request: VAPIRequest):
    """
    Generate a focused Weaviate query from consultation prompt for VAPI context and make a VAPI call
    """
    try:
        print(f"\n🎯 ===== WEAVIATE QUERY GENERATOR FOR VAPI =====")
        print(f"📝 Original prompt: {request.prompt[:200]}...")
        print(f"📞 Phone number: {request.phone_number}")

        # Step 1: Generate focused query using Gemini
        print(f"\n🤖 ===== GENERATING FOCUSED QUERY =====")
        focused_query = await generate_focused_query_for_weaviate(request.prompt)
        print(f"🎯 Generated focused query: {focused_query}")

        # Step 2: Use the focused query to search Weaviate and extract raw data
        print(f"\n🔍 ===== SEARCHING WEAVIATE WITH FOCUSED QUERY =====")
        extracted_data = []
        if weaviate_service.connect():
            collection = weaviate_service.client.collections.get("NormalizedDocuments")
            print(f"      🔍 Performing semantic search with focused query...")
            search_results = collection.query.near_text(
                query=focused_query,
                limit=5,
                return_metadata=["distance", "score"]
            )
            weaviate_service.close()
            for result in search_results.objects:
                # Convert UUID to string and ensure all data is JSON serializable
                # Also convert any UUIDs in properties to strings
                properties = {}
                for key, value in result.properties.items():
                    if hasattr(value, '__str__'):
                        properties[key] = str(value)
                    else:
                        properties[key] = value
                
                data_object = {
                    "id": str(result.uuid),
                    "properties": properties,
                    "metadata": {
                        "distance": float(result.metadata.distance) if result.metadata.distance else None,
                        "score": float(result.metadata.score) if result.metadata.score else None
                    }
                }
                extracted_data.append(data_object)
            print(f"✅ Retrieved {len(extracted_data)} data objects from Weaviate")
        else:
            return {"message": "Failed to connect to Weaviate", "status": "error"}

        # Step 3: Make VAPI call using the proper VAPI API structure
        vapi_api_key = os.getenv("VAPI_API_KEY", "YOUR_VAPI_API_KEY")
        vapi_assistant_id = os.getenv("VAPI_ASSISTANT_ID", "your-assistant-id")
        vapi_phone_number_id = os.getenv("VAPI_PHONE_NUMBER_ID", "your-phone-number-id")
        
        # VAPI call endpoint - this initiates a call
        vapi_url = "https://api.vapi.ai/call"
        vapi_payload = {
            "assistantId": vapi_assistant_id,
            "phoneNumberId": vapi_phone_number_id,
            "customer": {
                "number": request.phone_number
            }
        }
        vapi_headers = {
            "Authorization": f"Bearer {vapi_api_key}",
            "Content-Type": "application/json"
        }
        import requests
        vapi_response = None
        try:
            print(f"\n📞 ===== MAKING VAPI CALL =====")
            print(f"📞 Calling: {request.phone_number}")
            print(f"🤖 Assistant ID: {vapi_assistant_id}")
            vapi_response = requests.post(vapi_url, json=vapi_payload, headers=vapi_headers)
            print(f"VAPI response status: {vapi_response.status_code}")
            vapi_response_json = vapi_response.json() if vapi_response.content else {}
            print(f"VAPI response: {vapi_response_json}")
        except Exception as vapi_error:
            print(f"❌ Error making VAPI call: {vapi_error}")
            vapi_response_json = {"error": str(vapi_error)}

        return {
            "message": "VAPI data extracted and call made successfully",
            "original_prompt": request.prompt,
            "focused_query": focused_query,
            "extracted_data": extracted_data,
            "data_count": len(extracted_data),
            "phone_number": request.phone_number,
            "vapi_response": vapi_response_json,
            "status": "success"
        }
    except Exception as e:
        print(f"❌ Error in Weaviate Query Generator: {str(e)}")
        import traceback
        print(f"📋 Traceback: {traceback.format_exc()}")
        return {
            "message": f"Error generating VAPI context: {str(e)}",
            "status": "error"
        }

async def generate_focused_query_for_weaviate(original_prompt: str) -> str:
    """
    Use Gemini to generate a focused query for Weaviate based on the original consultation prompt
    """
    try:
        print(f"      🔧 Initializing Gemini client for query generation...")
        client = get_gemini_client()
        
        # Create a prompt to generate a focused Weaviate query
        query_generation_prompt = f"""
        You are a query generation expert for a Weaviate vector database. Your task is to create a focused, specific query that will retrieve only the most relevant information from the database for a voice AI (VAPI) consultation.

        Original consultation prompt: "{original_prompt}"

        Based on this consultation prompt, generate a single, focused query that will:
        1. Retrieve only the most relevant context for the specific business challenge
        2. Focus on actionable insights and strategies
        3. Provide context that would be useful for a voice AI consultation
        4. Avoid generic information and focus on specific, actionable advice

        The query should be:
        - Specific to the business challenge mentioned
        - Focused on practical strategies and insights
        - Suitable for a voice AI to provide personalized advice
        - Concise but comprehensive

        Generate only the query text, nothing else.
        """
        
        print(f"      📝 Sending query generation prompt to Gemini...")
        response = client.models.generate_content(
            model="gemini-2.0-flash-thinking-exp",
            contents=[query_generation_prompt],
        )
        
        focused_query = response.text.strip()
        print(f"      ✅ Generated focused query: {focused_query}")
        
        return focused_query
        
    except Exception as e:
        print(f"      ❌ Error generating focused query: {str(e)}")
        # Fallback to a simple query based on the original prompt
        fallback_query = f"Provide specific strategies and insights for: {original_prompt[:100]}"
        print(f"      🔄 Using fallback query: {fallback_query}")
        return fallback_query
