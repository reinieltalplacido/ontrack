import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def create_document():
    doc = Document()
    
    # Page setup - Margins (1 inch all around)
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)
        
    # Color palette
    PRIMARY = RGBColor(0x2B, 0x55, 0x78)    # #2B5578 Dark Navy/Steel
    SECONDARY = RGBColor(0x54, 0x77, 0x92)  # #547792 Slate Blue
    EMERALD = RGBColor(0x04, 0x78, 0x57)    # #047857 Deep Emerald
    TEXT_DARK = RGBColor(0x1E, 0x29, 0x3B)  # #1E293B Slate 800
    TEXT_MUTED = RGBColor(0x64, 0x74, 0x8B) # #64748B Slate 500
    
    # Configure default style
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = TEXT_DARK
    
    def set_cell_background(cell, fill_hex):
        shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
        cell._tc.get_or_add_tcPr().append(shading)

    def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = OxmlElement('w:tcMar')
        for margin, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
            node = OxmlElement(f'w:{margin}')
            node.set(qn('w:w'), str(val))
            node.set(qn('w:type'), 'dxa')
            tcMar.append(node)
        tcPr.append(tcMar)

    # ==================== HEADER TITLE BLOCK ====================
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(4)
    run_title = title_p.add_run("OnTrack: System Features & Specifications")
    run_title.font.name = 'Calibri'
    run_title.font.size = Pt(24)
    run_title.font.bold = True
    run_title.font.color.rgb = PRIMARY

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_before = Pt(0)
    sub_p.paragraph_format.space_after = Pt(18)
    run_sub = sub_p.add_run("Mobile Application Technology — System Specifications & AI Usage Disclosure")
    run_sub.font.size = Pt(12)
    run_sub.font.italic = True
    run_sub.font.color.rgb = SECONDARY

    # Horizontal divider line via border paragraph
    p_div = doc.add_paragraph()
    p_div.paragraph_format.space_before = Pt(0)
    p_div.paragraph_format.space_after = Pt(16)
    pBdr = parse_xml(f'<w:pBdr {nsdecls("w")}><w:bottom w:val="single" w:sz="18" w:space="1" w:color="2B5578"/></w:pBdr>')
    p_div._p.get_or_add_pPr().append(pBdr)

    # Document Overview Box
    desc_table = doc.add_table(rows=1, cols=1)
    desc_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    desc_cell = desc_table.cell(0, 0)
    set_cell_background(desc_cell, "F1F5F9")
    set_cell_margins(desc_cell, top=140, bottom=140, left=180, right=180)
    dp = desc_cell.paragraphs[0]
    dp.paragraph_format.space_before = Pt(0)
    dp.paragraph_format.space_after = Pt(0)
    drun1 = dp.add_run("System Overview: ")
    drun1.bold = True
    drun1.font.color.rgb = PRIMARY
    drun2 = dp.add_run(
        "OnTrack is a cross-platform mobile application and web administration portal engineered for On-the-Job Training (OJT) monitoring. "
        "It replaces manual Daily Time Records (DTR) by integrating automated hour computation, GPS geolocation verification, selfie proof-of-work, and comprehensive academic coordinator oversight."
    )
    drun2.font.color.rgb = TEXT_DARK
    
    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Helper functions for sections and items
    def add_major_heading(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(20)
        h.paragraph_format.space_after = Pt(8)
        h.paragraph_format.keep_with_next = True
        r = h.add_run(text)
        r.font.name = 'Calibri'
        r.font.size = Pt(15)
        r.font.bold = True
        r.font.color.rgb = PRIMARY
        # Add bottom border
        pBdr = parse_xml(f'<w:pBdr {nsdecls("w")}><w:bottom w:val="single" w:sz="12" w:space="2" w:color="547792"/></w:pBdr>')
        h._p.get_or_add_pPr().append(pBdr)

    def add_sub_heading(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(12)
        h.paragraph_format.space_after = Pt(4)
        h.paragraph_format.keep_with_next = True
        r = h.add_run(text)
        r.font.name = 'Calibri'
        r.font.size = Pt(12.5)
        r.font.bold = True
        r.font.color.rgb = SECONDARY

    def add_bullet(bold_prefix, text, level=0):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.left_indent = Inches(0.25 * (level + 1))
        if bold_prefix:
            r1 = p.add_run(bold_prefix + " ")
            r1.bold = True
            r1.font.color.rgb = TEXT_DARK
        r2 = p.add_run(text)
        r2.font.color.rgb = TEXT_DARK

    # ==================== PART 1: CLIENT SIDE ====================
    add_major_heading("PART 1: Client Side (Student Intern Mobile App)")
    
    intro_client = doc.add_paragraph()
    intro_client.paragraph_format.space_after = Pt(8)
    intro_client.add_run(
        "The client side application is built using Ionic 9 and Angular 22 (Standalone Components) paired with Capacitor native plugins. "
        "It provides interns with an intuitive interface to log attendance, record daily activities, track required duty hours, and manage academic submissions."
    )

    add_sub_heading("1. Authentication & Onboarding")
    add_bullet("Multi-Step Student Registration:", "Guided 3-step registration workflow that captures comprehensive student OJT information.")
    add_bullet("Step 1 (Academic Details):", "Inputs Student ID Number, Full Name, Academic Program, Year Level, and Section selection (BSIT 4-A to 4-K).", level=1)
    add_bullet("Automated Coordinator Pairing:", "Selecting an academic section automatically pairs the student with that section's designated faculty coordinator.", level=1)
    add_bullet("Step 2 (OJT Placement):", "Records Host Training Establishment (HTE) / Company Name, Assigned Department, Supervisor Name, and Supervisor Contact Details.", level=1)
    add_bullet("Step 3 (Security & Review):", "Secure password creation with BCrypt encryption, password visibility toggles, and an instant summary review card before submitting.", level=1)
    add_bullet("Student Login & Session Handling:", "Secure authentication using Student ID or Institutional Email with hashed password verification. Includes persistent local session storage and Angular Route Guards.")

    add_sub_heading("2. Student Dashboard (Home)")
    add_bullet("Profile Header:", "Displays user avatar with initials, active duty beacon indicator, student name, student ID, academic section, and assigned company badge.")
    add_bullet("Daily Attendance Card:", "Streamlined single-card attendance console with one-tap Clock In / Clock Out button, dynamic duty indicator, and shift start timestamp.")
    add_bullet("Rendered vs. Required Hours:", "Real-time counter displaying accumulated rendering hours against the target requirement (e.g., 120.00 / 486 hrs).")
    add_bullet("Visual Progress Ring & Bar:", "Live percentage indicator illustrating overall OJT completion progress (0% to 100%).")
    add_bullet("Hours Remaining Metric:", "Automatically computed countdown showing exact hours left to complete internship requirements.")
    add_bullet("Target Completion Countdown:", "Calculates calendar days remaining until the intern's target completion date.")
    add_bullet("Edit Goal Modal:", "Allows students to adjust their required hours target (e.g., 486 or 500 hours) and targeted completion date.")
    add_bullet("Quick Navigation Shortcuts:", "2x2 icon grid providing one-tap access to Time Logs (DTR), Tasks, Reports, and Profile.")
    add_bullet("Recent Activity Feeds:", "Instant preview of latest attendance logs and pending tasks directly on the main dashboard feed.")

    add_sub_heading("3. Geolocation & Photo Duty Tracking (Time Logs / DTR)")
    add_bullet("GPS Geolocation Verification:", "Captures high-accuracy latitude and longitude coordinates upon check-in via @capacitor/geolocation to verify physical workplace presence.")
    add_bullet("Interactive Leaflet Map:", "Displays the student's real-time physical GPS location pin on an interactive map inside the clock-in modal.")
    add_bullet("Proof Selfie Camera Integration:", "Prompts the student to capture an instant front-facing selfie or duty photo via @capacitor/camera as proof of presence.")
    add_bullet("Tactile Haptic Feedback:", "Triggers device vibration via @capacitor/haptics upon successful check-in or check-out.")
    add_bullet("Clock-Out Accomplishment Logging:", "Includes an accomplishment summary text area where students log daily duties and tasks finished upon duty completion.")
    add_bullet("Automated Hour Computation:", "Accurately computes total hours rendered for the shift based on Time In and Time Out timestamps.")
    add_bullet("DTR History & Timesheet Explorer:", "Complete reverse-chronological list of past attendance entries showing date, timestamps, rendered hours, accomplishment logs, and photo verification thumbnails.")

    add_sub_heading("4. Task & Deliverable Management (Tasks)")
    add_bullet("Task Status Filtering:", "Organizes deliverables into All, Pending, In Progress, and Completed filter tabs.")
    add_bullet("Personal Task Creation:", "Interns can create deliverables with custom titles, scope descriptions, and target completion deadlines.")
    add_bullet("Deliverable Submission & Proof Upload:", "Allows interns to upload proof files (PDFs, images) or external repository/documentation links to prove task completion.")
    add_bullet("Status Toggling:", "One-tap mechanism to update task status from pending to completed.")

    add_sub_heading("5. Reports & Profile Management")
    add_bullet("Weekly & Monthly Summaries:", "Aggregates weekly rendered hours, daily averages, and attendance consistency.")
    add_bullet("Digital DTR Export:", "Prepares structured attendance summary tables ready for printing and academic submission.")
    add_bullet("Profile & Contact Management:", "Displays academic details, adviser credentials, and emergency contact details with secure one-tap logout.")

    # ==================== PART 2: ADMIN SIDE ====================
    add_major_heading("PART 2: Admin / Coordinator Side (Academic Faculty Portal)")
    
    intro_admin = doc.add_paragraph()
    intro_admin.paragraph_format.space_after = Pt(8)
    intro_admin.add_run(
        "The coordinator portal provides academic OJT supervisors with real-time oversight tools to monitor student attendance, "
        "audit Daily Time Records, inspect GPS coordinates and photo evidence, review student deliverables, and filter cohorts by academic section."
    )

    add_sub_heading("1. Coordinator Authentication & Section Filtering")
    add_bullet("Faculty Authentication:", "Dedicated faculty sign-in using Employee ID (e.g., PROF-2026-001) or institutional email with role-based permissions (admin, coordinator, adviser).")
    add_bullet("Interactive Section Switcher:", "Header tab dropdown allowing the coordinator to instantly filter the dashboard across sections (BSIT 4-A to 4-K or All Sections).")
    add_bullet("Automated Roster Scoping:", "Selecting a section dynamically scopes all KPI analytics, intern lists, and attendance logs to that class.")

    add_sub_heading("2. System-Wide Analytics & KPI Metrics")
    add_bullet("Total Monitored Interns:", "Live count of registered students currently active in the selected academic section.")
    add_bullet("Active on Duty Counter:", "Real-time count of students who are currently clocked in at their company placements.")
    add_bullet("Total Rendered Hours:", "Aggregate sum of all internship hours rendered across the student cohort.")
    add_bullet("Task Completion Metrics:", "Visual breakdown of pending versus completed student deliverables.")

    add_sub_heading("3. Monitored Intern Roster")
    add_bullet("Live Search & Filter:", "Filter students in real time by full name, school ID number, or company placement.")
    add_bullet("Duty Status Chips:", "Instant filter pills for All, On Duty (live green beacon), and Off Duty (gray indicator).")
    add_bullet("Intern Summary Cards:", "Displays student name, student number, company agency, live duty badge, hours remaining, and progress bar (e.g., 245 / 486 hrs · 50.4%).")
    add_bullet("Quick View Action Button:", "One-click 'View >' button on every card that opens the student's complete record.")

    add_sub_heading("4. Detailed Student Record & Audit View")
    add_bullet("Student Overview Modal:", "In-depth modal presenting the student's complete profile, contact details, total hours rendered, remaining hours, and progress percentage.")
    add_bullet("Tab 1: Complete Attendance History (DTR Audit):", "Audit log showing every shift rendered by the student, including date, exact Time In, Time Out, and rendered hours.", level=1)
    add_bullet("Daily Accomplishment Review:", "Inspects the daily accomplishment notes written by the student upon clocking out.", level=1)
    add_bullet("GPS Coordinates & Map Inspection:", "Verifies exact GPS latitude and longitude captured at the moment of clock-in.", level=1)
    add_bullet("Photo Proof Viewer:", "High-resolution viewer allowing coordinators to inspect selfie/duty photos captured via the camera.", level=1)
    add_bullet("Tab 2: Student Tasks & Deliverables:", "Displays all deliverables submitted by the student with status indicators and submitted attachments.", level=1)

    add_sub_heading("5. Student Task Monitoring & Proof Verification Console")
    add_bullet("Task Overview Metrics:", "Summary statistics of Total Tasks, Pending Tasks, and Completed Tasks across the section.")
    add_bullet("Deliverables Table:", "Interactive table displaying student name, task title, completion date, and file attachment badges.")
    add_bullet("Document & Proof Inspection:", "One-click modal to preview and download submitted PDF documents, diagrams, or image proofs.")
    add_bullet("Official Deliverable Verification Stamp:", "Allows the coordinator to officially verify and approve submitted internship milestones with a digital verification stamp and timestamp.")

    add_sub_heading("6. Real-Time Attendance & Verification Feed")
    add_bullet("Live Duty Feed:", "Chronological stream of real-time check-in events across the student cohort.")
    add_bullet("Compliance Audit:", "Enables immediate auditing of whether students arrive at their workplaces on time and within assigned geographical boundaries.")

    # ==================== PART 3: COMPARISON MATRIX ====================
    add_major_heading("PART 3: Feature Comparison Matrix")
    
    doc.add_paragraph("The table below compares the functional responsibilities between the Student Intern and Academic Coordinator sides of the platform:")

    # Table creation
    headers = ["Capability / Functional Area", "Student Intern (Client Side)", "Academic Coordinator (Admin Side)"]
    rows_data = [
        ("Authentication & Access", "Multi-step registration & student login", "Faculty ID login with role-based access"),
        ("Section Assignment", "Selects section (BSIT 4-A to 4-K)", "Switches & filters by sections (A to K)"),
        ("Duty Status Tracking", "Single-tap Clock In / Clock Out", "Live monitoring of on-duty interns"),
        ("GPS Verification", "Captures device latitude/longitude", "Audits coordinates and location tags"),
        ("Photo Evidence", "Captures duty selfie via camera", "Inspects photo proof in Student Record"),
        ("Rendered Hours Computation", "Automated daily & remaining hours", "Cohort-wide aggregated hours & stats"),
        ("Accomplishment Logging", "Submits daily accomplishment logs", "Audits accomplishment notes per shift"),
        ("Task & Deliverables", "Creates tasks and uploads proof files", "Monitors deliverables & verifies proofs"),
        ("Student Record Audit", "Views personal metrics & progress", "Audits complete DTR history & deliverables"),
        ("Timesheet & DTR Export", "Exports formatted timesheet summary", "Inspects digital timesheets across weeks")
    ]

    table = doc.add_table(rows=len(rows_data) + 1, cols=3)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    col_widths = [Inches(2.2), Inches(2.2), Inches(2.4)]
    
    # Format Header Row
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        hdr_cells[i].width = col_widths[i]
        set_cell_background(hdr_cells[i], "2B5578")
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=140, right=140)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        for run in p.runs:
            run.font.bold = True
            run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
            run.font.size = Pt(10)

    # Format Data Rows
    for r_idx, row_content in enumerate(rows_data):
        row_cells = table.rows[r_idx + 1].cells
        bg_hex = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, cell_value in enumerate(row_content):
            row_cells[c_idx].text = cell_value
            row_cells[c_idx].width = col_widths[c_idx]
            set_cell_background(row_cells[c_idx], bg_hex)
            set_cell_margins(row_cells[c_idx], top=90, bottom=90, left=140, right=140)
            p = row_cells[c_idx].paragraphs[0]
            for run in p.runs:
                run.font.size = Pt(9.5)
                run.font.color.rgb = TEXT_DARK
                if c_idx == 0:
                    run.font.bold = True

    # ==================== PART 4: AI USAGE DISCLOSURE ====================
    add_major_heading("PART 4: AI Usage Disclosure")
    
    add_sub_heading("1. Identification of AI Tools Used")
    add_bullet("Primary AI Tool:", "Google Antigravity / Gemini AI Coding Assistant (DeepMind Advanced Agentic Environment).")
    add_bullet("Deployment Context:", "Integrated agentic pair-programming assistant operating directly inside the codebase workspace.")
    add_bullet("Underlying Capabilities:", "Context-aware static analysis, real-time TypeScript/PHP code synthesis, terminal automation, and native mobile build synchronization.")

    add_sub_heading("2. How the AI Assisted Development")
    add_bullet("Architecture & Scaffolding:", "Assisted in structuring the Ionic 9 and Angular 22 standalone component architecture, configuring routes, models, and type-safe HTTP communication with the backend.")
    add_bullet("Device Hardware Integration:", "Guided the configuration of Capacitor plugins (@capacitor/camera for selfie capture, @capacitor/geolocation for workplace GPS coordinate recording, and @capacitor/haptics for tactile user feedback).")
    add_bullet("Backend RESTful API & Database Integration:", "Constructed secure PHP REST API endpoints utilizing PDO prepared statements to eliminate SQL injection, implemented CORS headers, and authored the normalized MySQL database schema.")
    add_bullet("Native Android Bridge Configuration:", "Generated and synchronized native Android platform assets, configured AndroidManifest.xml permissions (Camera, Location, and cleartext HTTP traffic), and prepared Gradle integration for Android Studio.")
    add_bullet("Bug Diagnosis & Query Optimization:", "Diagnosed UI change detection locks during registration, applied Angular ChangeDetectorRef updates, and eliminated database latency by introducing targeted composite indexes on high-traffic tables.")

    add_sub_heading("3. What the Group Reviewed, Tested, or Modified")
    add_bullet("UI/UX & Mobile Visual Hierarchy Review:", "The group reviewed mobile viewport layouts and removed redundant interface clutter—such as repeated company tags and unnecessary 'Off Duty' badges—to maintain a clean and accessible user experience.")
    add_bullet("Academic Workflow & Section Assignment Review:", "Reviewed university coordination requirements and structured automated section mapping (BSIT 4-A through 4-K), ensuring newly registered students are automatically paired with their respective academic coordinators.")
    add_bullet("Database Schema & Integrity Verification:", "Audited database tables and schema structures in phpMyAdmin to verify referential integrity, foreign key relations, and accurate storage across ontrack_db.")
    add_bullet("Comprehensive Functional Testing:", "Conducted end-to-end testing of student registration, duplicate credential validation (handling HTTP 409 conflict states), GPS coordinate capture, selfie camera uploads, and automated daily rendering hour calculation.")
    add_bullet("Multi-Environment Network Testing:", "Tested API connectivity across web browsers (localhost), Android Studio Emulators (10.0.2.2), and physical mobile hardware connected via local Wi-Fi.")
    add_bullet("Administrative Scope Modifications:", "Refactored the Coordinator Portal to eliminate unnecessary 'add task' buttons, refocusing the coordinator role purely on oversight, DTR auditing, and student deliverable verification.")
    add_bullet("Performance Tuning:", "Added composite database indexes (idx_user_date_time and idx_user_id_desc), resolving slow loading times when fetching detailed student attendance histories.")

    # Output path
    output_dir = os.path.abspath(os.path.join(os.getcwd(), "docs"))
    os.makedirs(output_dir, exist_ok=True)
    docx_path = os.path.join(output_dir, "OnTrack_System_Features.docx")
    doc.save(docx_path)
    print(f"DOCX successfully generated: {docx_path}")
    return docx_path

if __name__ == "__main__":
    create_document()
