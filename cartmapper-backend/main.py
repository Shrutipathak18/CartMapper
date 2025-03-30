import os
import io
import base64
import PyPDF2
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain.retrievers.multi_query import MultiQueryRetriever
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
import cv2
import numpy as np
from PIL import Image
import requests
from deep_translator import GoogleTranslator
import pandas as pd
from pydantic import BaseModel
from typing import Optional
import tempfile
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Check for required environment variables
if not os.getenv('GROQ_API_KEY'):
    raise ValueError("GROQ_API_KEY environment variable is not set. Please set it in your .env file.")

# Initialize FastAPI app
app = FastAPI(title="CartMapper Backend", 
              description="Backend for CartMapper application", 
              version="1.0.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models
class QRRequest(BaseModel):
    qr_data: str
    is_url: bool

class QueryRequest(BaseModel):
    query: str
    language: str = "English"
    output_method: str = "Text Only"

# Global variables for the RAG chain
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2",
    model_kwargs={'device': 'cpu'},
    encode_kwargs={'normalize_embeddings': True}
)
chain = None

def decode_qr(image):
    """Decode QR code using OpenCV"""
    try:
        # Convert PIL Image to OpenCV format if needed
        if isinstance(image, Image.Image):
            image = np.array(image)
            if image.ndim == 3 and image.shape[2] == 4:  # RGBA image
                image = cv2.cvtColor(image, cv2.COLOR_RGBA2RGB)
            elif image.ndim == 3:  # RGB image
                image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
            else:  # Grayscale
                image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
        
        # Initialize QR Code detector
        detector = cv2.QRCodeDetector()
        
        # Detect and decode
        data, _, _ = detector.detectAndDecode(image)
        
        return data if data else None
        
    except Exception as e:
        raise ValueError(f"QR decoding failed: {str(e)}")

# Utility Functions
def download_pdf_from_url(url):
    """Download a PDF from a URL and return its content as bytes."""
    try:
        response = requests.get(url)
        if response.status_code == 200:
            if response.content[:4] == b"%PDF":
                return response.content
            else:
                raise ValueError("The downloaded content is not a valid PDF.")
        else:
            raise ValueError(f"Failed to download PDF. Status code: {response.status_code}")
    except Exception as e:
        raise ValueError(f"An error occurred while downloading the PDF: {e}")

def process_pdf(pdf_file):
    """Process a PDF file and return a list of documents."""
    try:
        data = []
        reader = PyPDF2.PdfReader(pdf_file)
        for page_num in range(len(reader.pages)):
            page = reader.pages[page_num]
            page_text = page.extract_text()
            if page_text:
                data.append({
                    'page_number': page_num + 1,
                    'page_content': page_text
                })
        return [Document(page_content=page['page_content']) for page in data]
    except PyPDF2.errors.PdfReadError as e:
        raise ValueError(f"Failed to process the PDF: {e}")

def process_csv(csv_file):
    """Process a CSV file and return a list of documents."""
    try:
        df = pd.read_csv(csv_file)
        documents = []
        for index, row in df.iterrows():
            content = "\n".join([f"{col}: {row[col]}" for col in df.columns])
            documents.append(Document(page_content=content))
        return documents
    except Exception as e:
        raise ValueError(f"Failed to process the CSV file: {e}")

def setup_rag_chain(documents):
    """Set up the RAG (Retrieval-Augmented Generation) chain."""
    try:
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=3000, chunk_overlap=200)
        chunks = text_splitter.split_documents(documents)

        llm = ChatGroq(
            temperature=0,
            model_name="mistral-saba-24b",
            groq_api_key=os.getenv('GROQ_API_KEY')
        )

        vector_db = Chroma.from_documents(
            documents=chunks,
            embedding=embeddings,
            collection_name="huggingface-groq-rag",
            persist_directory="./chroma_db"
        )

        QUERY_PROMPT = PromptTemplate(
            input_variables=["question"],
            template="""You are an AI assistant generating alternative query perspectives.
            Generate 5 different versions of the given question to improve document retrieval:
            Original question: {question}"""
        )

        retriever = MultiQueryRetriever.from_llm(
            vector_db.as_retriever(),
            llm,
            prompt=QUERY_PROMPT
        )

        template = """Answer the question based ONLY on the following context:
        {context}
        Question: {question}
        """
        prompt = ChatPromptTemplate.from_template(template)

        return (
            {"context": retriever, "question": RunnablePassthrough()}
            | prompt
            | llm
            | StrOutputParser()
        )
    except Exception as e:
        raise ValueError(f"Failed to setup RAG chain: {e}")

def safe_translate(text, source_lang, target_lang, max_retries=2):
    """Safely translates text with retries and returns original text if translation fails."""
    if source_lang == target_lang:
        return text, True

    for attempt in range(max_retries):
        try:
            temp_translator = GoogleTranslator(source=source_lang, target=target_lang)
            translated = temp_translator.translate(text)
            if translated:
                return translated, True
            elif attempt == max_retries - 1:
                return text, False
        except Exception:
            if attempt == max_retries - 1:
                return text, False
            time.sleep(1)
    return text, False

# API Endpoints
@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...), file_type: str = Form(...)):
    try:
        # Validate file type
        if file_type not in ["pdf", "csv"]:
            return JSONResponse(
                status_code=400,
                content={"detail": "Invalid file type. Only PDF and CSV files are allowed."}
            )
        
        # Read file content
        content = await file.read()
        file_like = io.BytesIO(content)
        
        # Process file based on type
        if file_type == "pdf":
            documents = process_pdf(file_like)
        else:  # csv
            documents = process_csv(file_like)
        
        global chain
        chain = setup_rag_chain(documents)
        return JSONResponse(
            content={"message": f"{file_type.upper()} file processed successfully"}
        )
    
    except ValueError as e:
        return JSONResponse(
            status_code=400,
            content={"detail": str(e)}
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"detail": f"Internal server error: {str(e)}"}
        )

@app.post("/api/process-qr")
async def process_qr(request: QRRequest):
    try:
        if request.is_url:
            response = requests.get(request.qr_data, stream=True)
            image = Image.open(response.raw)
        else:
            image = Image.open(io.BytesIO(base64.b64decode(request.qr_data)))
        
        qr_data = decode_qr(image)
        if not qr_data:
            return JSONResponse(
                status_code=400,
                content={"detail": "No QR code found"}
            )
        
        if not (qr_data.startswith("http://") or qr_data.startswith("https://")):
            return JSONResponse(
                status_code=400,
                content={"detail": "QR code does not contain a valid URL"}
            )
        
        pdf_content = download_pdf_from_url(qr_data)
        if not pdf_content:
            return JSONResponse(
                status_code=400,
                content={"detail": "Failed to download PDF from QR URL"}
            )
        
        global chain
        documents = process_pdf(io.BytesIO(pdf_content))
        if not documents:
            return JSONResponse(
                status_code=400,
                content={"detail": "Failed to process PDF from QR"}
            )
        
        chain = setup_rag_chain(documents)
        return JSONResponse(
            content={
                "message": "QR processed successfully",
                "qr_data": qr_data
            }
        )
    
    except ValueError as e:
        return JSONResponse(
            status_code=400,
            content={"detail": str(e)}
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"detail": f"Internal server error: {str(e)}"}
        )

@app.post("/api/query")
async def handle_query(request: QueryRequest):
    try:
        if not chain:
            return JSONResponse(
                status_code=400,
                content={"detail": "No document processed yet"}
            )
        
        # Language mapping
        lang_map = {
            "English": "en",
            "Hindi": "hi",
            "Odia": "or",
            "Bengali": "bn",
            "Tamil": "ta"
        }
        src_lang = lang_map.get(request.language, "en")

        # Translate input if needed
        if request.language != "English":
            translated_query, translation_success = safe_translate(request.query, src_lang, "en")
            if not translation_success:
                return JSONResponse(
                    content={"warning": "Query translation failed, results may be less accurate"}
                )
        else:
            translated_query = request.query

        # Process query
        result = chain.invoke(translated_query)

        # Translate back if needed
        if request.language != "English":
            translated_result, translation_success = safe_translate(result, "en", src_lang)
            final_result = translated_result if translation_success else result
        else:
            final_result = result

        return JSONResponse(
            content={
                "answer": final_result,
                "language": request.language,
                "output_method": request.output_method
            }
        )
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"detail": f"Internal server error: {str(e)}"}
        )

@app.get("/api/health")
async def health_check():
    return JSONResponse(
        content={"status": "healthy", "service": "CartMapper Backend"}
    )

# For local testing
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)