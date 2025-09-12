"""
Weaviate service for storing and retrieving normalized data
"""

import weaviate
from weaviate.classes.init import Auth
from weaviate.classes.config import Configure
from weaviate.agents.query import QueryAgent
import os
from typing import Dict, List, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class WeaviateService:
    def __init__(self):
        self.client = None
        self.collection_name = "NormalizedDocuments"
        
    def connect(self) -> bool:
        """Connect to Weaviate Cloud instance"""
        try:
            weaviate_url = os.getenv("WEAVIATE_URL")
            weaviate_api_key = os.getenv("WEAVIATE_API_KEY")
            gemini_api_key = os.getenv("GEMINI_API_KEY")
            
            if not weaviate_url or not weaviate_api_key:
                raise ValueError("WEAVIATE_URL and WEAVIATE_API_KEY must be set in environment variables")
            
            # Prepare headers with Gemini API key for Query Agent
            headers = {}
            if gemini_api_key:
                headers["X-INFERENCE-PROVIDER-API-KEY"] = gemini_api_key
                print("✅ Gemini API key found, adding to headers for Query Agent")
            else:
                print("⚠️  No Gemini API key found - Query Agent features will not work")
            
            self.client = weaviate.connect_to_weaviate_cloud(
                cluster_url=weaviate_url,
                auth_credentials=Auth.api_key(weaviate_api_key),
                headers=headers if headers else None,
            )
            
            return self.client.is_ready()
            
        except Exception as e:
            print(f"Error connecting to Weaviate: {e}")
            return False
    
    def create_collection(self) -> bool:
        """Create the NormalizedDocuments collection if it doesn't exist"""
        try:
            if not self.client:
                raise ValueError("Not connected to Weaviate")
            
            # Check if collection already exists
            if self.client.collections.exists(self.collection_name):
                print(f"Collection '{self.collection_name}' already exists")
                return True
            
            # Create collection with Weaviate Embeddings and Cohere integration
            collection = self.client.collections.create(
                name=self.collection_name,
                vector_config=Configure.Vectors.text2vec_weaviate(),  # Use Weaviate Embeddings
                generative_config=Configure.Generative.cohere()       # Use Cohere for RAG
            )
            
            print(f"Collection '{self.collection_name}' created successfully")
            return True
            
        except Exception as e:
            print(f"Error creating collection: {e}")
            return False
    
    def store_document(self, session_id: str, prompt: str, normalized_text: str, 
                      pdf_files: List[Dict], image_files: List[Dict]) -> bool:
        """Store a normalized document in Weaviate"""
        try:
            if not self.client:
                raise ValueError("Not connected to Weaviate")
            
            collection = self.client.collections.use(self.collection_name)
            
            # Prepare document data
            document_data = {
                "session_id": session_id,
                "original_prompt": prompt,
                "normalized_content": normalized_text,
                "pdf_count": len(pdf_files),
                "image_count": len(image_files),
                "pdf_files": [pdf["filename"] for pdf in pdf_files],
                "image_files": [img["filename"] for img in image_files],
                "total_files": len(pdf_files) + len(image_files)
            }
            
            # Add the document to Weaviate
            result = collection.data.insert(document_data)
            
            print(f"Document stored successfully with ID: {result}")
            return True
            
        except Exception as e:
            print(f"Error storing document: {e}")
            return False
    
    def search_documents(self, query: str, limit: int = 5) -> List[Dict]:
        """Search for documents using semantic search"""
        try:
            if not self.client:
                raise ValueError("Not connected to Weaviate")
            
            collection = self.client.collections.use(self.collection_name)
            
            # Perform semantic search
            response = collection.query.near_text(
                query=query,
                limit=limit
            )
            
            results = []
            for obj in response.objects:
                results.append({
                    "id": str(obj.uuid),
                    "properties": obj.properties,
                    "metadata": obj.metadata
                })
            
            return results
            
        except Exception as e:
            print(f"Error searching documents: {e}")
            return []
    
    def generate_response(self, query: str, limit: int = 3) -> str:
        """Generate a response using RAG (Retrieval Augmented Generation)"""
        try:
            if not self.client:
                raise ValueError("Not connected to Weaviate")
            
            collection = self.client.collections.use(self.collection_name)
            
            # Perform RAG query
            response = collection.generate.near_text(
                query=query,
                limit=limit,
                grouped_task=f"Based on the retrieved documents, provide a comprehensive answer to: {query}"
            )
            
            return response.generative.text
            
        except Exception as e:
            print(f"Error generating response: {e}")
            return f"Error generating response: {str(e)}"
    
    def query_with_agent(self, query: str) -> str:
        """Use Weaviate Query Agent to answer natural language queries"""
        try:
            if not self.client:
                raise ValueError("Not connected to Weaviate")
            
            # Create Query Agent instance
            qa = QueryAgent(
                client=self.client,
                collections=[self.collection_name]
            )
            
            # Run the query using the Query Agent
            response = qa.run(query)
            
            # Return the final answer from the Query Agent
            return response.final_answer
            
        except Exception as e:
            print(f"Error with Query Agent: {e}")
            return f"Error with Query Agent: {str(e)}"
    
    def close(self):
        """Close the Weaviate connection"""
        if self.client:
            self.client.close()
            self.client = None

# Global instance
weaviate_service = WeaviateService()
