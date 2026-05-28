from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem, PageBreak

OUTPUT = Path(r"D:\PRJ\docs\InfraSight-Dashboard-User-Guide.pdf")
GZU_GREEN = colors.Color(43/255, 110/255, 96/255)


def make_styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="CoverTitle", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=22, leading=28, textColor=GZU_GREEN, alignment=TA_CENTER, spaceAfter=12))
    styles.add(ParagraphStyle(name="Subtitle", parent=styles["Normal"], fontName="Helvetica", fontSize=12, leading=16, alignment=TA_CENTER, textColor=colors.black, spaceAfter=6))
    styles.add(ParagraphStyle(name="Heading", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=14, leading=19, textColor=GZU_GREEN, spaceBefore=10, spaceAfter=6))
    styles.add(ParagraphStyle(name="Body", parent=styles["BodyText"], fontName="Helvetica", fontSize=11, leading=15, spaceAfter=6))
    return styles


STYLES = make_styles()


def bullet_list(items):
    return ListFlowable(
        [ListItem(Paragraph(text, STYLES["Body"])) for text in items],
        bulletType="bullet",
        leftIndent=14,
        bulletFontName="Helvetica",
        bulletFontSize=10,
    )


def build_story():
    story = []

    # Cover
    story.extend([
        Spacer(1, 3.5 * cm),
        Paragraph("InfraSight", STYLES["CoverTitle"]),
        Paragraph("Dashboard User Guide (Simple)", STYLES["Subtitle"]),
        Spacer(1, 0.6 * cm),
    ])

    # Getting around
    story.append(Paragraph("Getting around", STYLES["Heading"]))
    story.append(bullet_list([
        "Use the left sidebar to navigate: Dashboard, Devices, Telemetry, Predictions, Alerts, Scenarios, Evaluation, Settings.",
        "Click a device name anywhere to open its detail page.",
        "Look for clear labels: Normal or At Risk.",
    ]))

    # Quick start
    story.append(Paragraph("Quick start", STYLES["Heading"]))
    story.append(bullet_list([
        "Open Dashboard to see overall health, top alerts, recent predictions, and trends.",
        "If something is At Risk, click through to investigate the device.",
        "Use Alerts to acknowledge or resolve issues and track status.",
    ]))

    # Dashboard page
    story.append(Paragraph("Dashboard", STYLES["Heading"]))
    story.append(bullet_list([
        "KPI cards: quick counts for devices, active alerts, and recent predictions.",
        "Devices: list of monitored assets with current state.",
        "Alerts & Predictions: summaries of what needs attention now.",
        "Trend: recent prediction risk trend to spot patterns.",
    ]))

    # Devices & Device Detail
    story.append(Paragraph("Devices and Device Detail", STYLES["Heading"]))
    story.append(bullet_list([
        "Devices: browse and search for an asset; click to open its details.",
        "Device Detail: see current health, recent telemetry window summary, and latest prediction.",
        "Actions (demo mode): Simulate Telemetry to create fresh readings; Run Prediction to update risk.",
    ]))

    # Telemetry
    story.append(Paragraph("Telemetry", STYLES["Heading"]))
    story.append(bullet_list([
        "Live table of recent readings (CPU, Memory, Disk, Packet Loss, Latency, Errors, Restarts, Uptime).",
        "Used to build short time windows for model input.",
        "Check timestamps and values when investigating spikes.",
    ]))

    # Predictions
    story.append(Paragraph("Predictions", STYLES["Heading"]))
    story.append(bullet_list([
        "List of recent predictions with predicted class (Normal / Fault‑Prone) and confidence.",
        "Model info includes feature importance and evaluation summary.",
        "Use as decision support; combine with alerts and telemetry.",
    ]))

    # Alerts
    story.append(Paragraph("Alerts", STYLES["Heading"]))
    story.append(bullet_list([
        "Filter by severity and status to focus on what matters.",
        "Open an alert to view details and recommended action.",
        "Acknowledge or Resolve once addressed to keep the queue clean.",
    ]))

    # Scenarios & Evaluation
    story.append(Paragraph("Scenarios and Evaluation", STYLES["Heading"]))
    story.append(bullet_list([
        "Scenarios: run demo fault patterns to validate detection and prediction.",
        "Evaluation: view metrics and export a report for documentation.",
    ]))

    # Settings
    story.append(Paragraph("Settings", STYLES["Heading"]))
    story.append(bullet_list([
        "Update basic preferences and review system information.",
        "If running in demo/mock mode, some actions will simulate data.",
    ]))

    # Tips
    story.append(Paragraph("Tips", STYLES["Heading"]))
    story.append(bullet_list([
        "Start at Dashboard, drill down via Devices, confirm via Telemetry, act via Alerts.",
        "Look at confidence and recent trend to avoid false positives.",
        "Use Evaluation export for summaries in reports.",
    ]))

    story.append(PageBreak())

    # Glossary
    story.append(Paragraph("Glossary (plain language)", STYLES["Heading"]))
    story.append(bullet_list([
        "Normal: device looks healthy.",
        "At Risk / Fault‑Prone: device shows patterns linked to faults.",
        "Confidence: how strongly the model believes the prediction.",
        "Severity: how urgent an alert is.",
    ]))

    return story


essential_pages = [
    "Dashboard", "Devices", "Device Detail", "Telemetry", "Predictions", "Alerts", "Scenarios", "Evaluation", "Settings"
]


def main():
    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title="InfraSight - Dashboard User Guide",
        author="GZU Final Year Project",
    )
    story = build_story()
    doc.build(story)
    print(f"PDF={OUTPUT}")


if __name__ == "__main__":
    main()
