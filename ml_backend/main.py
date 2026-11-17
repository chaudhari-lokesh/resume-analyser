import uvicorn
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ml_engine import parse_resume_bytes, analyze_resume_ml

app = FastAPI(
    title="ResuMind AI - Machine Learning Engine",
    description="Custom Machine Learning & NLP Backend API for ATS Resume Scoring and Optimization",
    version="1.0.0"
)

# Enable CORS for frontend application
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "engine": "Machine Learning (TF-IDF + NLP Pipeline)",
        "version": "1.0.0"
    }

@app.post("/analyze")
async def analyze_resume_endpoint(resume: UploadFile = File(...)):
    filename = resume.filename or "resume.pdf"
    content_type = resume.content_type or ""
    
    # Check supported extensions
    ext = filename.split('.')[-1].lower()
    if ext not in ['pdf', 'docx', 'txt']:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Please upload a PDF or DOCX resume file."
        )
        
    try:
        # Read file into memory buffer (privacy-first, no file saving)
        file_bytes = await resume.read()
        print(f"[ML Server] Analyzing upload: {filename} ({len(file_bytes)} bytes)")
        
        # 1. Parse text from buffer
        extracted_text = parse_resume_bytes(file_bytes, filename)
        
        # 2. Run Machine Learning & NLP Evaluation Pipeline
        analysis = analyze_resume_ml(extracted_text)
        
        return analysis
        
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        print(f"[Error] ML Analysis failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred during machine learning resume analysis: {str(e)}"
        )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
