import os
import urllib.request
import base64
import asyncio
from playwright.async_api import async_playwright

def get_base64_from_file(file_path, mime_type):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return ""
    with open(file_path, 'rb') as f:
        data = f.read()
        encoded = base64.b64encode(data).decode('utf-8')
        return f"data:{mime_type};base64,{encoded}"

async def print_html_to_pdf(html_path, pdf_path):
    print("Launching Playwright Chromium to print PDF...")
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        print(f"Loading {html_path}...")
        await page.goto(f"file:///{html_path.replace(os.sep, '/')}")
        
        # Wait for fonts and layout to render
        await page.wait_for_timeout(2000)
        
        print(f"Saving PDF to: {pdf_path}")
        await page.pdf(
            path=pdf_path,
            format="A4",
            print_background=True,
            margin={"top": "0mm", "right": "0mm", "bottom": "0mm", "left": "0mm"}
        )
        await browser.close()
        
    if os.path.exists(pdf_path):
        print(f"Successfully generated: {pdf_path} ({os.path.getsize(pdf_path)} bytes)")
    else:
        print(f"Failed to generate: {pdf_path}")

async def main():
    assets_dir = os.path.dirname(os.path.abspath(__file__))
    workspace_dir = os.path.dirname(assets_dir)
    
    # 1. Load brand identity assets and screenshots
    print("Encoding logos from local extracted files...")
    logo_bharatcares = get_base64_from_file(os.path.join(assets_dir, "extracted", "page_1_1.jpg"), "image/jpeg")
    logo_ibm = get_base64_from_file(os.path.join(assets_dir, "extracted", "page_1_2.jpg"), "image/jpeg")
    
    print("Encoding screenshots from files...")
    img_hero = get_base64_from_file(os.path.join(assets_dir, "media__1784354909085.png"), "image/png")
    img_upload = get_base64_from_file(os.path.join(assets_dir, "media__1784354909025.png"), "image/png")
    img_dashboard = get_base64_from_file(os.path.join(assets_dir, "media__1784354909047.png"), "image/png")
    img_details = get_base64_from_file(os.path.join(assets_dir, "media__1784354909048.png"), "image/png")
    
    # ================= COMPILE PROJECT REPORT =================
    print("\n--- Compiling Project Report ---")
    report_template_path = os.path.join(assets_dir, "report_template.html")
    compiled_report_path = os.path.join(assets_dir, "compiled_report.html")
    report_pdf_path = os.path.join(workspace_dir, "ResuMind_AI_Project_Report.pdf")
    
    with open(report_template_path, 'r', encoding='utf-8') as f:
        report_content = f.read()
        
    report_content = report_content.replace("{{logo_bharatcares}}", logo_bharatcares)
    report_content = report_content.replace("{{logo_ibm}}", logo_ibm)
    report_content = report_content.replace("{{img_hero}}", img_hero)
    report_content = report_content.replace("{{img_upload}}", img_upload)
    report_content = report_content.replace("{{img_dashboard}}", img_dashboard)
    report_content = report_content.replace("{{img_details}}", img_details)
    
    with open(compiled_report_path, 'w', encoding='utf-8') as f:
        f.write(report_content)
        
    await print_html_to_pdf(compiled_report_path, report_pdf_path)
    
    # ================= COMPILE CONCEPT NOTE =================
    print("\n--- Compiling Concept Note ---")
    concept_template_path = os.path.join(assets_dir, "concept_note_template.html")
    compiled_concept_path = os.path.join(assets_dir, "compiled_concept_note.html")
    concept_pdf_path = os.path.join(workspace_dir, "ResuMind_AI_Concept_Note.pdf")
    
    with open(concept_template_path, 'r', encoding='utf-8') as f:
        concept_content = f.read()
        
    concept_content = concept_content.replace("{{logo_bharatcares}}", logo_bharatcares)
    concept_content = concept_content.replace("{{logo_ibm}}", logo_ibm)
    
    with open(compiled_concept_path, 'w', encoding='utf-8') as f:
        f.write(concept_content)
        
    await print_html_to_pdf(compiled_concept_path, concept_pdf_path)
    
    print("\nAll PDF generations complete!")

if __name__ == "__main__":
    asyncio.run(main())
