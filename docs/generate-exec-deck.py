from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, ListFlowable, ListItem

OUTPUT = Path(r"D:\PRJ\docs\InfraSight-Executive-Deck.pdf")
GZU_GREEN = colors.Color(43/255, 110/255, 96/255)


def make_styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="CoverTitle", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=28, leading=34, textColor=GZU_GREEN, alignment=TA_CENTER, spaceAfter=14))
    styles.add(ParagraphStyle(name="CoverSub", parent=styles["Normal"], fontName="Helvetica", fontSize=13, leading=18, alignment=TA_CENTER, textColor=colors.black, spaceAfter=8))
    styles.add(ParagraphStyle(name="SlideTitle", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=20, leading=26, textColor=GZU_GREEN, spaceAfter=10))
    styles.add(ParagraphStyle(name="Body", parent=styles["BodyText"], fontName="Helvetica", fontSize=12, leading=16, spaceAfter=6))
    styles.add(ParagraphStyle(name="Subhead", parent=styles["BodyText"], fontName="Helvetica-Bold", fontSize=12, leading=16, textColor=colors.black, spaceBefore=6, spaceAfter=4))
    return styles


STYLES = make_styles()


def bullet_list(items):
    return ListFlowable(
        [ListItem(Paragraph(text, STYLES["Body"])) for text in items],
        bulletType="bullet",
        leftIndent=16,
        bulletFontName="Helvetica",
        bulletFontSize=10,
    )


def build_story():
    story = []

    story.extend([
        Spacer(1, 5 * cm),
        Paragraph("InfraSight", STYLES["CoverTitle"]),
        Paragraph("ICT Fault Detection and Predictive Maintenance", STYLES["CoverSub"]),
        Spacer(1, 0.8 * cm),
        bullet_list([
            "Monitors device health and finds early warning signs.",
            "Predicts fault risk and sends clear, actionable alerts.",
            "Reduces downtime and firefighting across ICT operations.",
        ]),
        PageBreak(),
    ])

    story.append(Paragraph("How it works", STYLES["SlideTitle"]))
    story.append(bullet_list([
        "Collect: Devices send routine signals like CPU, memory, and network loss.",
        "Organize: Readings are grouped into short time windows.",
        "Predict: A model looks for patterns linked to potential faults.",
        "Alert & act: If risk is high, the system flags the device and recommends next steps.",
    ]))
    story.append(PageBreak())

    story.append(Paragraph("Value and next steps", STYLES["SlideTitle"]))
    story.append(Paragraph("Value", STYLES["Subhead"]))
    story.append(bullet_list([
        "Fewer incidents and faster response times.",
        "Clear priorities for support teams.",
        "Evidence for continuous improvement.",
    ]))
    story.append(Paragraph("Example", STYLES["Subhead"]))
    story.append(bullet_list([
        "A router's packet loss and errors creep up; InfraSight predicts 'At Risk' and suggests checking the link or reseating a cable—so the team fixes it before an outage.",
    ]))
    story.append(Paragraph("What’s next", STYLES["Subhead"]))
    story.append(bullet_list([
        "Tune alerts to your environment.",
        "Add more device types and fault scenarios.",
        "Integrate with your ticketing workflow.",
    ]))

    return story


def main():
    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title="InfraSight - Executive Deck",
        author="GZU Final Year Project",
    )
    story = build_story()
    doc.build(story)
    print(f"PDF={OUTPUT}")


if __name__ == "__main__":
    main()
