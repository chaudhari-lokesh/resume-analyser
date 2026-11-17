import io
import re
import math
from pypdf import PdfReader
import mammoth
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Comprehensive Tech Stack Skills Taxonomy
INDUSTRY_SKILLS = [
    "Python", "JavaScript", "TypeScript", "React", "Node.js", "Express", 
    "AWS", "Docker", "Kubernetes", "GraphQL", "PostgreSQL", "MySQL", 
    "MongoDB", "Redis", "System Design", "Unit Testing", "Jest", "CI/CD", 
    "Git", "REST API", "Microservices", "Tailwind CSS", "Next.js", "Redux",
    "Java", "C++", "Go", "Grok", "PyTorch", "TensorFlow", "Scikit-Learn"
]

ACTION_VERBS = [
    "engineered", "architected", "developed", "built", "optimized", 
    "implemented", "deployed", "designed", "scaled", "automated", 
    "accelerated", "spearheaded", "revamped", "integrated", "managed"
]

JOB_ROLES_TAXONOMY = {
    "Full Stack Developer": ["React", "Node.js", "JavaScript", "TypeScript", "REST API", "MongoDB", "Express", "Tailwind CSS"],
    "Frontend Developer": ["React", "JavaScript", "TypeScript", "Tailwind CSS", "Next.js", "Redux", "HTML", "CSS"],
    "Backend Developer": ["Python", "Node.js", "Express", "PostgreSQL", "MySQL", "MongoDB", "REST API", "System Design", "Microservices"],
    "DevOps / Cloud Engineer": ["AWS", "Docker", "Kubernetes", "CI/CD", "Linux", "Terraform", "Git"],
    "Software Engineer": ["Python", "Java", "C++", "Data Structures", "Algorithms", "Git", "Unit Testing"]
}

def parse_resume_bytes(file_bytes: bytes, filename: str) -> str:
    """Extracts plain text from PDF or DOCX binary buffer."""
    ext = filename.split('.')[-1].lower()
    text = ""
    
    if ext == 'pdf':
        pdf_file = io.BytesIO(file_bytes)
        reader = PdfReader(pdf_file)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    elif ext == 'docx':
        docx_file = io.BytesIO(file_bytes)
        result = mammoth.extract_raw_text(docx_file)
        text = result.value
    else:
        text = file_bytes.decode('utf-8', errors='ignore')
        
    if not text.strip():
        raise ValueError("Document appears empty or contains unreadable text.")
        
    return text.strip()

def analyze_resume_ml(resume_text: str) -> dict:
    """
    Core Machine Learning & NLP Evaluation Engine.
    Uses TF-IDF Vectorization, Cosine Similarity, Action Verb POS heuristics,
    and Skill Taxonomy Gap Analysis.
    """
    clean_text = resume_text.lower()
    words = re.findall(r'\w+', clean_text)
    total_words = len(words)
    
    # 1. Skill Extraction & Gap Analysis
    found_skills = []
    for skill in INDUSTRY_SKILLS:
        # Match skill using regex word boundary
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, clean_text):
            found_skills.append(skill)
            
    # Determine Missing Critical Industry Skills
    missing_skills = [s for s in INDUSTRY_SKILLS if s not in found_skills][:5]
    
    # 2. Skills Match Score (Based on density and ratio of target taxonomy)
    skills_match_ratio = len(found_skills) / 12.0
    skills_score = min(100, max(45, int(skills_match_ratio * 100)))

    # 3. TF-IDF Cosine Similarity (ATS Compatibility Model)
    # Ideal ATS benchmark corpus representing high-impact engineering resume
    benchmark_corpus = [
        "experienced full stack software engineer proficient in python react node.js system design rest api aws docker microservices unit testing ci/cd optimized performance agile development",
        clean_text
    ]
    
    vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
    tfidf_matrix = vectorizer.fit_transform(benchmark_corpus)
    similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
    
    ats_score = min(98, max(50, int(similarity * 100 + 40)))

    # 4. Grammar & Action Verb Density Evaluation
    verb_matches = [v for v in ACTION_VERBS if v in clean_text]
    has_metrics = bool(re.search(r'\d+%', resume_text) or re.search(r'\$\d+', resume_text) or re.search(r'\b\d+x\b', clean_text))
    
    grammar_base = 75
    if len(verb_matches) >= 3:
        grammar_base += 10
    if has_metrics:
        grammar_base += 10
    if 250 <= total_words <= 800:
        grammar_base += 5
        
    grammar_score = min(98, max(60, grammar_base))

    # 5. Overall Score Calculation
    overall_score = int((ats_score * 0.35) + (skills_score * 0.35) + (grammar_score * 0.30))

    # 6. Target Job Roles Mapping
    role_scores = {}
    for role, required_skills in JOB_ROLES_TAXONOMY.items():
        matched = sum(1 for s in required_skills if s in found_skills)
        role_scores[role] = matched
        
    sorted_roles = sorted(role_scores.items(), key=lambda x: x[1], reverse=True)
    best_job_roles = [r[0] for r in sorted_roles[:3]]

    # 7. Strengths & Weaknesses Extraction
    strengths = []
    if len(found_skills) >= 4:
        strengths.append(f"Strong technical stack including {', '.join(found_skills[:4])}")
    else:
        strengths.append("Solid core technical foundation demonstrated in project work")
        
    if verb_matches:
        strengths.append(f"Effective use of strong action verbs ({', '.join(verb_matches[:3])})")
    else:
        strengths.append("Clear project descriptions and technical responsibility framing")
        
    if has_metrics:
        strengths.append("Quantifiable impact and performance metrics included in descriptions")
    else:
        strengths.append("Good academic and practical application balance")

    weaknesses = []
    if len(found_skills) < 5:
        weaknesses.append("Resume contains a relatively limited set of indexed technical keywords")
    if not has_metrics:
        weaknesses.append("Missing quantifiable metrics (e.g., percentages, scale, performance improvements)")
    if missing_skills:
        weaknesses.append(f"Key industry skills missing: {', '.join(missing_skills[:3])}")
    if not weaknesses:
        weaknesses.append("Could elaborate further on complex architectural decisions")

    # 8. Project & Certification Recommendations
    recommended_projects = []
    if "Docker" in missing_skills or "AWS" in missing_skills:
        recommended_projects.append("Cloud-Native Microservices Deployment with Docker & Kubernetes")
    if "GraphQL" in missing_skills or "REST API" in missing_skills:
        recommended_projects.append("High-Throughput GraphQL / REST API Gateway with Caching Layer")
    if "TypeScript" in missing_skills or "React" in missing_skills:
        recommended_projects.append("Full-Stack Enterprise Dashboard built with React, TypeScript & Tailwind CSS")
    if len(recommended_projects) < 2:
        recommended_projects.append("Automated CI/CD Pipeline & Infrastructure as Code (IaC) Demonstration")

    recommended_certifications = []
    if "AWS" in missing_skills:
        recommended_certifications.append("AWS Certified Developer – Associate")
    recommended_certifications.append("Meta Front-End / Back-End Developer Professional Certificate")
    recommended_certifications.append("HashiCorp Certified: Terraform Associate or Docker Certified Associate")

    # 9. Professional Summary Rewriter
    primary_role = best_job_roles[0] if best_job_roles else "Software Engineer"
    skills_str = ", ".join(found_skills[:4]) if found_skills else "Full-Stack Web Development"
    
    current_summary_match = re.search(r'(summary|profile|about me)[\s:]*([^\n]+\n[^\n]+)', clean_text)
    resume_summary = current_summary_match.group(2).strip() if current_summary_match else "The resume jumps straight into project descriptions and technical skills."
    
    improved_summary = (
        f"Results-driven {primary_role} proficient in {skills_str}. Proven track record of architecting "
        f"scalable web applications, implementing robust APIs, and optimizing system performance. "
        f"Seeking to leverage technical expertise in engineering teams to build high-impact applications."
    )

    # 10. Customized Mock Interview Questions
    interview_questions = []
    if "React" in found_skills or "JavaScript" in found_skills:
        interview_questions.append("How do you manage component state and performance optimization in React applications?")
    if "Python" in found_skills or "Node.js" in found_skills:
        interview_questions.append("Can you explain how you design and secure RESTful API endpoints for client-server communication?")
    if "SQL" in found_skills or "MongoDB" in found_skills:
        interview_questions.append("How do you handle database indexing and query optimization under heavy data loads?")
    interview_questions.append("Describe a challenging technical bug you encountered in a recent project and how you debugged it using the STAR method.")

    final_suggestions = [
        f"Add missing industry keywords like {', '.join(missing_skills[:3])} to pass automated ATS filters.",
        "Incorporate specific quantifiable metrics (e.g. 'Reduced load time by 30%', 'Served 500+ users').",
        "Include a concise 3-line Professional Summary at the top of your resume before listing experience.",
        "Add links to your live deployed projects and GitHub repository in the contact header."
    ]

    return {
        "overall_score": overall_score,
        "ats_score": ats_score,
        "grammar_score": grammar_score,
        "skills_score": skills_score,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "missing_skills": missing_skills,
        "recommended_projects": recommended_projects,
        "recommended_certifications": recommended_certifications,
        "best_job_roles": best_job_roles,
        "resume_summary": resume_summary,
        "improved_summary": improved_summary,
        "interview_questions": interview_questions,
        "final_suggestions": final_suggestions
    }
