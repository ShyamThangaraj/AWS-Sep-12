from fastapi import APIRouter, File, UploadFile, Form
from typing import List
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
