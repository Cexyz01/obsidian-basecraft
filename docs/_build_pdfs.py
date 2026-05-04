from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    PageBreak,
    Table,
    TableStyle,
)
from pathlib import Path

ACCENT = HexColor("#6E4FE6")
INK = HexColor("#1F1B2E")
MUTED = HexColor("#5C5872")
RULE = HexColor("#E5E2EE")

OUTDIR = Path(__file__).parent

base_styles = getSampleStyleSheet()

cover_title = ParagraphStyle(
    "CoverTitle",
    parent=base_styles["Title"],
    fontName="Helvetica-Bold",
    fontSize=28,
    leading=34,
    textColor=INK,
    spaceAfter=8,
    alignment=TA_LEFT,
)
cover_subtitle = ParagraphStyle(
    "CoverSubtitle",
    parent=base_styles["Normal"],
    fontName="Helvetica",
    fontSize=12,
    leading=16,
    textColor=MUTED,
    spaceAfter=18,
)
h1 = ParagraphStyle(
    "H1",
    parent=base_styles["Heading1"],
    fontName="Helvetica-Bold",
    fontSize=16,
    leading=20,
    textColor=ACCENT,
    spaceBefore=16,
    spaceAfter=6,
)
h2 = ParagraphStyle(
    "H2",
    parent=base_styles["Heading2"],
    fontName="Helvetica-Bold",
    fontSize=12,
    leading=16,
    textColor=INK,
    spaceBefore=10,
    spaceAfter=4,
)
body = ParagraphStyle(
    "Body",
    parent=base_styles["BodyText"],
    fontName="Helvetica",
    fontSize=10.5,
    leading=15,
    textColor=INK,
    spaceAfter=6,
    alignment=TA_LEFT,
)
muted = ParagraphStyle(
    "Muted",
    parent=body,
    textColor=MUTED,
    fontSize=9.5,
    leading=13,
)
bullet = ParagraphStyle(
    "Bullet",
    parent=body,
    leftIndent=14,
    bulletIndent=2,
    spaceAfter=3,
)
big_price = ParagraphStyle(
    "BigPrice",
    parent=base_styles["Title"],
    fontName="Helvetica-Bold",
    fontSize=44,
    leading=50,
    textColor=ACCENT,
    spaceAfter=4,
)
sales_h = ParagraphStyle(
    "SalesH",
    parent=base_styles["Heading1"],
    fontName="Helvetica-Bold",
    fontSize=20,
    leading=24,
    textColor=INK,
    spaceAfter=10,
    spaceBefore=10,
)


def hr(width):
    t = Table([[""]], colWidths=[width], rowHeights=[0.6])
    t.setStyle(TableStyle([("LINEBELOW", (0, 0), (-1, -1), 0.6, RULE)]))
    return t


def make_doc(filename):
    return SimpleDocTemplate(
        str(OUTDIR / filename),
        pagesize=A4,
        leftMargin=2.4 * cm,
        rightMargin=2.4 * cm,
        topMargin=2.2 * cm,
        bottomMargin=2.2 * cm,
        title="Basecraft",
        author="Hewnpath",
    )


def manual():
    doc = make_doc("basecraft-user-manual.pdf")
    width = doc.width
    story = []

    story.append(Paragraph("Basecraft", cover_title))
    story.append(Paragraph("User Manual", h1))
    story.append(Paragraph("Version 0.2.0 &middot; By Hewnpath", cover_subtitle))
    story.append(hr(width))
    story.append(Spacer(1, 18))

    story.append(Paragraph("What Basecraft does", h1))
    story.append(
        Paragraph(
            "Basecraft adds a Pivot view to Obsidian Bases. Pick one property as rows, "
            "another as columns, choose an aggregation, and your entries are grouped "
            "into a cross-table — like a spreadsheet pivot, but native to your vault. "
            "It is built on the official Bases plugin API introduced in Obsidian 1.10.",
            body,
        )
    )

    story.append(Paragraph("Installation", h1))

    story.append(Paragraph("From the community store", h2))
    story.append(
        Paragraph(
            "Coming soon. Once Basecraft is approved by Obsidian, you will be able to install it "
            "from Settings &rarr; Community plugins &rarr; Browse.",
            body,
        )
    )

    story.append(Paragraph("Manual install", h2))
    story.append(
        Paragraph(
            "1. Download <b>main.js</b>, <b>manifest.json</b> and <b>styles.css</b> from the "
            "<a color='#6E4FE6' href='https://github.com/Cexyz01/obsidian-basecraft/releases'>"
            "latest release</a>.",
            body,
        )
    )
    story.append(
        Paragraph(
            "2. Place them inside <b>&lt;your-vault&gt;/.obsidian/plugins/basecraft/</b>.",
            body,
        )
    )
    story.append(
        Paragraph(
            "3. In Obsidian: Settings &rarr; Community plugins &rarr; turn on community plugins, "
            "find Basecraft in Installed plugins, toggle it on.",
            body,
        )
    )
    story.append(
        Paragraph(
            "4. Make sure the <b>Bases</b> core plugin is enabled "
            "(Settings &rarr; Core plugins &rarr; Bases). Bases requires Obsidian 1.10 or newer.",
            body,
        )
    )

    story.append(Paragraph("Quick start", h1))
    story.append(
        Paragraph(
            "1. Create a <b>.base</b> file from the command palette: "
            "<i>Bases: Create new base</i>.",
            body,
        )
    )
    story.append(
        Paragraph(
            "2. In the new base, add a new view and choose <b>Pivot</b>.",
            body,
        )
    )
    story.append(
        Paragraph(
            "3. In the Basecraft toolbar, set <b>Rows</b>, <b>Columns</b>, and an <b>Aggregation</b>. "
            "The pivot recomputes immediately.",
            body,
        )
    )

    story.append(Paragraph("Toolbar reference", h1))
    rows = [
        ["Control", "What it does"],
        ["Rows", "Property whose unique values become the row headers."],
        ["Columns", "Property whose unique values become the column headers."],
        [
            "Aggregation",
            "Count and Sum are free. Average, Min, Max, Median and Distinct count are Pro.",
        ],
        [
            "Value",
            "The numeric property used by Sum / Average / Min / Max / Median. Ignored for Count.",
        ],
        [
            "Display",
            "Raw values (free), or % of total / row / column (Pro).",
        ],
        ["Heatmap", "Pro. Tints each cell based on its value across the grid."],
        ["Export CSV", "Pro. Saves the current pivot as a .csv file."],
    ]
    table = Table(rows, colWidths=[3.5 * cm, width - 3.5 * cm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), HexColor("#F4F2FA")),
                ("TEXTCOLOR", (0, 0), (-1, 0), INK),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LINEBELOW", (0, 0), (-1, -1), 0.4, RULE),
            ]
        )
    )
    story.append(table)

    story.append(PageBreak())
    story.append(Paragraph("Pro features", h1))
    pro_items = [
        (
            "Advanced aggregations",
            "Average, Min, Max, Median and Distinct count, in addition to the free Count and Sum.",
        ),
        (
            "Drill-down",
            "Click a cell to open a list of the notes that contributed to it. Click any name to jump to the note.",
        ),
        (
            "Heatmap conditional formatting",
            "Each cell is tinted based on where its value sits between the smallest and largest cell in the grid.",
        ),
        (
            "Percentage display",
            "Show values as % of total, % of row, or % of column instead of raw numbers.",
        ),
        ("CSV export", "Save the current pivot as a .csv file with one click."),
        ("Future Pro additions", "Multi-dimensional rows / columns and PNG export are next, included in your purchase."),
    ]
    for name, desc in pro_items:
        story.append(Paragraph(f"<b>{name}.</b> {desc}", bullet, bulletText="&bull;"))

    story.append(Paragraph("Activating Pro", h1))
    story.append(
        Paragraph(
            "After your purchase you will receive a license key by email. "
            "Open Obsidian &rarr; Settings &rarr; Basecraft, paste the key into "
            "<b>Pro license key</b>, and the toolbar will switch from gated to unlocked. "
            "A single license activates on up to three devices.",
            body,
        )
    )

    story.append(Paragraph("Troubleshooting", h1))
    story.append(Paragraph("Pivot view does not appear in the view selector", h2))
    story.append(
        Paragraph(
            "Check that the Bases core plugin is enabled and that Obsidian is at least 1.10. "
            "Reload Obsidian (Ctrl+R) after enabling the plugin.",
            body,
        )
    )
    story.append(Paragraph("The pivot is empty", h2))
    story.append(
        Paragraph(
            "You probably have not picked a Rows or Columns property yet. Both are required.",
            body,
        )
    )
    story.append(Paragraph("Property dropdowns are empty", h2))
    story.append(
        Paragraph(
            "The base has no properties to pivot on. Open a few of the matching notes, "
            "add some frontmatter (status, priority, etc.), then return to the pivot.",
            body,
        )
    )
    story.append(Paragraph("Pro features stay locked after pasting the key", h2))
    story.append(
        Paragraph(
            "Make sure the key was copied without trailing whitespace. The status line under the key "
            "field will read &quot;Pro: active&quot; once the key is accepted.",
            body,
        )
    )

    story.append(Paragraph("Support", h1))
    story.append(
        Paragraph(
            "Bug reports and feature requests are welcome at "
            "<a color='#6E4FE6' href='https://github.com/Cexyz01/obsidian-basecraft/issues'>"
            "github.com/Cexyz01/obsidian-basecraft/issues</a>.",
            body,
        )
    )
    story.append(Spacer(1, 18))
    story.append(hr(width))
    story.append(Spacer(1, 6))
    story.append(
        Paragraph(
            "Hewnpath &mdash; focused utilities for the software you use every day.",
            muted,
        )
    )

    doc.build(story)
    print(f"Wrote {OUTDIR / 'basecraft-user-manual.pdf'}")


def sales_sheet():
    doc = make_doc("basecraft-sales-sheet.pdf")
    width = doc.width
    story = []

    story.append(Paragraph("Basecraft", cover_title))
    story.append(Paragraph("Pivot tables for Obsidian Bases", cover_subtitle))
    story.append(Paragraph("$14", big_price))
    story.append(Paragraph("one-time, three-device license", muted))
    story.append(Spacer(1, 14))
    story.append(hr(width))
    story.append(Spacer(1, 18))

    story.append(Paragraph("The problem", sales_h))
    story.append(
        Paragraph(
            "Obsidian Bases ships with a table view and a card view. "
            "There is no built-in way to summarize. "
            "If you want to count tasks per status &times; priority, "
            "sum hours per project &times; week, or compare entries across two dimensions, "
            "you have to leave the vault.",
            body,
        )
    )

    story.append(Paragraph("The solution", sales_h))
    story.append(
        Paragraph(
            "One Pivot view that handles it. Built on the official Bases plugin API, "
            "native to your vault, no external sync, no cloud accounts.",
            body,
        )
    )

    story.append(Paragraph("Pro &mdash; $14 one-time", sales_h))
    sales_items = [
        ("Drill-down.", "Click any cell to see and open the matching notes."),
        ("Heatmap.", "Conditional formatting that makes outliers obvious."),
        ("Percentage display.", "Show values as % of total, row, or column."),
        ("Advanced aggregations.", "Average, min, max, median and distinct count."),
        ("CSV export.", "Save the current pivot in one click."),
        ("Future Pro features included.", "Multi-dimensional rows / columns and PNG export are next."),
    ]
    for name, desc in sales_items:
        story.append(Paragraph(f"<b>{name}</b> {desc}", bullet, bulletText="&bull;"))

    story.append(Paragraph("Why one-time", sales_h))
    story.append(
        Paragraph(
            "No subscription. The license works on up to three devices and never expires. "
            "Updates &mdash; including new Pro features &mdash; are included.",
            body,
        )
    )

    story.append(Paragraph("Built by Hewnpath", sales_h))
    story.append(
        Paragraph(
            "An indie developer who answers emails. "
            "Bug reports and feature requests are read and acted on.",
            body,
        )
    )

    story.append(Spacer(1, 12))
    story.append(hr(width))
    story.append(Spacer(1, 10))

    cta = ParagraphStyle(
        "CTA",
        parent=body,
        fontSize=14,
        leading=18,
        textColor=ACCENT,
        fontName="Helvetica-Bold",
        alignment=TA_CENTER,
        spaceAfter=4,
    )
    story.append(Paragraph("Buy at hewnpath.lemonsqueezy.com", cta))
    story.append(
        Paragraph(
            "Hewnpath &mdash; focused utilities for the software you use every day.",
            ParagraphStyle("FootMuted", parent=muted, alignment=TA_CENTER),
        )
    )

    doc.build(story)
    print(f"Wrote {OUTDIR / 'basecraft-sales-sheet.pdf'}")


if __name__ == "__main__":
    manual()
    sales_sheet()
