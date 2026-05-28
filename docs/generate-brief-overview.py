from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem

OUTPUT = Path(r"D:\PRJ\docs\InfraSight-NonTechnical-Overview.pdf")
GZU_GREEN = colors.Color(43/255, 110/255, 96/255)


def make_styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="CoverTitle", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=22, leading=28, textColor=GZU_GREEN, alignment=TA_CENTER, spaceAfter=12))
    styles.add(ParagraphStyle(name="Subtitle", parent=styles["Normal"], fontName="Helvetica", fontSize=12, leading=16, alignment=TA_CENTER, textColor=colors.black, spaceAfter=6))
    styles.add(ParagraphStyle(name="Heading", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=13, leading=18, textColor=GZU_GREEN, spaceBefore=8, spaceAfter=6))
    styles.add(ParagraphStyle(name="Body", parent=styles["BodyText"], fontName="Helvetica", fontSize=11, leading=15, spaceAfter=6))
    return styles


STYLES = make_styles()

def bullet_list(items):
    return ListFlowable(
        [ListItem(Paragraph(text, STYLES["Body"])) for text in items],
        bulletType="bullet",
        start="-",
        leftIndent=14,
        bulletFontName="Helvetica",
        bulletFontSize=10,
    )


def build_story():
    story = []
    # Title
    story.extend([
        Spacer(1, 3.5 * cm),
        Paragraph("InfraSight", STYLES["CoverTitle"]),
        Paragraph("Plain-Language Overview (Non-Technical)", STYLES["Subtitle"]),
        Spacer(1, 0.6 * cm),
    ])

    # What it is
    story.append(Paragraph("What it is", STYLES["Heading"]))
    story.append(bullet_list([
        "A health monitor for ICT equipment that spots issues early and suggests what to do next.",
    ]))

    # Why it matters
    story.append(Paragraph("Why it matters", STYLES["Heading"]))
    story.append(bullet_list([
        "Prevents downtime.",
        "Saves time spent firefighting.",
        "Helps teams act before users notice problems.",
    ]))

    # How it works
    story.append(Paragraph("How it works (simple flow)", STYLES["Heading"]))
    story.append(bullet_list([
        "Collect: Devices send routine measurements like CPU, memory, and network loss.",
        "Organize: The system groups these readings into short time windows.",
        "Predict: A smart model looks for patterns linked to potential faults.",
        "Alert & act: If risk is high, it flags the device and recommends next steps.",
    ]))

    # What you see
    story.append(Paragraph("What you see", STYLES["Heading"]))
    story.append(bullet_list([
        "A dashboard with device health, active alerts, and risk predictions.",
        "Clear labels (Normal / At Risk) and short recommended actions.",
    ]))

    # Example
    story.append(Paragraph("A quick example", STYLES["Heading"]))
    story.append(bullet_list([
        "A router's packet loss and errors creep up; InfraSight predicts 'At Risk' and suggests checking the link or reseating a cable—so the team fixes it before an outage.",
    ]))

    # Trust and safety
    story.append(Paragraph("Trust and safety", STYLES["Heading"]))
    story.append(bullet_list([
        "Uses operational stats only (no personal data).",
        "Keeps a history so improvements are traceable and auditable.",
    ]))

    # What's next
    story.append(Paragraph("What’s next", STYLES["Heading"]))
    story.append(bullet_list([
        "Tune alerts to your environment.",
        "Add more device types and scenarios.",
        "Integrate with your ticketing workflow.",
    ]))

    # 30-second pitch
    story.append(Paragraph("30‑Second Pitch", STYLES["Heading"]))
    story.append(Paragraph(
        "InfraSight is like a smoke detector for your network. It watches simple device signals, learns what ‘not okay’ looks like, and warns you early with practical next steps—so you fix issues before they become incidents.",
        STYLES["Body"],
    ))

    return story


def main():
    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title="InfraSight - Non-Technical Overview",
        author="GZU Final Year Project",
    )
    story = build_story()
    doc.build(story)
    print(f"PDF={OUTPUT}")


if __name__ == "__main__":
    main()
