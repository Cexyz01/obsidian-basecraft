from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    PageBreak,
    Table,
    TableStyle,
    Frame,
    KeepInFrame,
)
from reportlab.pdfgen import canvas
from reportlab.pdfbase.pdfmetrics import stringWidth
from pathlib import Path

ACCENT = HexColor("#6E4FE6")
ACCENT_DEEP = HexColor("#2A1B5C")
ACCENT_LIGHT = HexColor("#EDE7FB")
INK = HexColor("#1A1726")
MUTED = HexColor("#6E6A82")
RULE = HexColor("#E5E2EE")
PAPER = HexColor("#F8F7FB")

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


def hr(width):
    t = Table([[""]], colWidths=[width], rowHeights=[0.6])
    t.setStyle(TableStyle([("LINEBELOW", (0, 0), (-1, -1), 0.6, RULE)]))
    return t


def manual():
    doc = SimpleDocTemplate(
        str(OUTDIR / "basecraft-user-manual.pdf"),
        pagesize=A4,
        leftMargin=2.4 * cm,
        rightMargin=2.4 * cm,
        topMargin=2.2 * cm,
        bottomMargin=2.2 * cm,
        title="Basecraft User Manual",
        author="Hewnpath",
    )
    width = doc.width
    story = []

    story.append(Paragraph("Basecraft", cover_title))
    story.append(Paragraph("User Manual", h1))
    story.append(Paragraph("Version 0.3.2 · By Hewnpath", cover_subtitle))
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
    story.append(Paragraph("2. Place them inside <b>&lt;your-vault&gt;/.obsidian/plugins/basecraft/</b>.", body))
    story.append(
        Paragraph(
            "3. In Obsidian: Settings &rarr; Community plugins &rarr; turn on community plugins, "
            "find Basecraft in Installed plugins, toggle it on.",
            body,
        )
    )
    story.append(
        Paragraph(
            "4. Make sure the <b>Bases</b> core plugin is enabled. Bases requires Obsidian 1.10 or newer.",
            body,
        )
    )

    story.append(Paragraph("Quick start", h1))
    story.append(Paragraph("1. Create a <b>.base</b> file from the command palette: <i>Bases: Create new base</i>.", body))
    story.append(Paragraph("2. In the new base, add a new view and choose <b>Pivot</b>.", body))
    story.append(Paragraph("3. In the Basecraft toolbar, set <b>Rows</b>, <b>Columns</b>, and an <b>Aggregation</b>.", body))

    story.append(Paragraph("Toolbar reference", h1))
    rows = [
        ["Control", "What it does"],
        ["Rows", "Property whose unique values become the row headers."],
        ["Columns", "Property whose unique values become the column headers."],
        ["Aggregation", "Count and Sum are free. Average, Min, Max, Median and Distinct count are Pro."],
        ["Value", "The numeric property used by Sum / Average / Min / Max / Median. Ignored for Count."],
        ["Display", "Raw values (free), or % of total / row / column (Pro)."],
        ["Heatmap", "Pro. Tints each cell based on its value across the grid."],
        ["Export CSV", "Pro. Saves the current pivot as a .csv file."],
        ["Export Excel", "Pro. Saves a styled .xlsx with the heatmap and totals preserved."],
    ]
    table = Table(rows, colWidths=[3.5 * cm, width - 3.5 * cm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), ACCENT_LIGHT),
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
        ("Advanced aggregations", "Average, Min, Max, Median and Distinct count, in addition to the free Count and Sum."),
        ("Drill-down", "Click a cell to open a list of the notes that contributed to it."),
        ("Heatmap conditional formatting", "Each cell is tinted between the smallest and largest in the grid."),
        ("Percentage display", "Show values as % of total, % of row, or % of column."),
        ("CSV export", "Save the current pivot as a CSV file with one click."),
        ("Excel export", "Save a styled .xlsx with header colors, heatmap fills, percentages and totals preserved."),
        ("Future Pro additions", "Multi-dimensional rows / columns and PNG export are next, included in your purchase."),
    ]
    for name, desc in pro_items:
        story.append(Paragraph(f"<b>{name}.</b> {desc}", bullet, bulletText="&bull;"))

    story.append(Paragraph("Activating Pro", h1))
    story.append(
        Paragraph(
            "After your purchase you receive a license key by email. "
            "Open Obsidian &rarr; Settings &rarr; Basecraft, paste the key into "
            "<b>Pro license key</b>, and the toolbar switches from gated to unlocked. "
            "A single license activates on up to three devices.",
            body,
        )
    )

    story.append(Paragraph("Troubleshooting", h1))
    story.append(Paragraph("Pivot view does not appear in the view selector", h2))
    story.append(Paragraph("Check that Bases is enabled in Core plugins and that Obsidian is 1.10 or newer. Reload Obsidian after enabling.", body))
    story.append(Paragraph("The pivot is empty", h2))
    story.append(Paragraph("You need to pick both a Rows and a Columns property — they are required.", body))
    story.append(Paragraph("Property dropdowns are empty", h2))
    story.append(Paragraph("The base has no properties yet. Add some frontmatter (status, priority, etc.) to a few notes.", body))
    story.append(Paragraph("Pro features stay locked after pasting the key", h2))
    story.append(Paragraph("Make sure the key was copied without trailing whitespace. The status under the field reads &quot;Pro: active&quot; when accepted.", body))

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
    story.append(Paragraph("Hewnpath — focused utilities for the software you use every day.", muted))

    doc.build(story)
    print(f"Wrote {OUTDIR / 'basecraft-user-manual.pdf'}")


def draw_pivot_mock(c, x, y, w, h):
    """Simple stylized pivot grid as a hero illustration."""
    cols = 4
    rows = 3
    cell_w = w / cols
    cell_h = h / (rows + 1)

    c.setFillColor(HexColor("#FFFFFF"))
    c.setStrokeColor(HexColor("#FFFFFF"))
    c.setLineWidth(0.4)
    c.roundRect(x - 4, y - 4, w + 8, h + 8, 8, fill=0, stroke=1)

    c.setFillColor(ACCENT)
    c.rect(x, y + h - cell_h, w, cell_h, fill=1, stroke=0)

    c.setFillColor(HexColor("#FFFFFF"))
    c.setFont("Helvetica-Bold", 8)
    headers = ["", "high", "low", "med"]
    for i, t in enumerate(headers):
        c.drawCentredString(x + cell_w * (i + 0.5), y + h - cell_h / 2 - 3, t)

    rowdata = [
        ("doing", [3, 2, 1]),
        ("done", [1, 4, 2]),
        ("todo", [2, 1, 3]),
    ]
    max_v = 4

    for ri, (label, values) in enumerate(rowdata):
        ry = y + h - cell_h * (ri + 2)
        c.setFillColor(ACCENT_LIGHT)
        c.rect(x, ry, cell_w, cell_h, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 8)
        c.drawCentredString(x + cell_w * 0.5, ry + cell_h / 2 - 3, label)

        for ci, v in enumerate(values):
            cx = x + cell_w * (ci + 1)
            t = v / max_v
            r0, g0, b0 = 1.0, 1.0, 1.0
            r1, g1, b1 = 0x6e / 255, 0x4f / 255, 0xe6 / 255
            cr = r0 + (r1 - r0) * t * 0.85
            cg = g0 + (g1 - g0) * t * 0.85
            cb = b0 + (b1 - b0) * t * 0.85
            c.setFillColor(Color(cr, cg, cb))
            c.rect(cx, ry, cell_w, cell_h, fill=1, stroke=0)
            c.setFillColor(INK if t < 0.55 else HexColor("#FFFFFF"))
            c.setFont("Helvetica", 8)
            c.drawCentredString(cx + cell_w * 0.5, ry + cell_h / 2 - 3, str(v))

    c.setStrokeColor(HexColor("#FFFFFF"))
    c.setLineWidth(0.3)
    for i in range(cols + 1):
        c.line(x + cell_w * i, y, x + cell_w * i, y + h)
    for i in range(rows + 2):
        c.line(x, y + cell_h * i, x + w, y + cell_h * i)


def feature_card(c, x, y, w, h, num, title, body_lines):
    c.setFillColor(HexColor("#FFFFFF"))
    c.setStrokeColor(RULE)
    c.setLineWidth(0.5)
    c.roundRect(x, y, w, h, 4, fill=1, stroke=1)

    c.setFillColor(ACCENT)
    c.roundRect(x + 12, y + h - 30, 18, 18, 3, fill=1, stroke=0)
    c.setFillColor(HexColor("#FFFFFF"))
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(x + 12 + 9, y + h - 30 + 5, str(num))

    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(x + 38, y + h - 24, title)

    c.setFillColor(MUTED)
    c.setFont("Helvetica", 9)
    leading = 12
    yt = y + h - 44
    for line in body_lines:
        c.drawString(x + 12, yt, line)
        yt -= leading


def wrap_text(text, font, size, max_width):
    words = text.split()
    if not words:
        return [""]
    lines = []
    cur = words[0]
    for w in words[1:]:
        candidate = cur + " " + w
        if stringWidth(candidate, font, size) <= max_width:
            cur = candidate
        else:
            lines.append(cur)
            cur = w
    lines.append(cur)
    return lines


def sales_sheet():
    out = OUTDIR / "basecraft-sales-sheet.pdf"
    c = canvas.Canvas(str(out), pagesize=A4)
    page_w, page_h = A4

    c.setFillColor(PAPER)
    c.rect(0, 0, page_w, page_h, fill=1, stroke=0)

    hero_h = 9.0 * cm
    c.setFillColor(ACCENT_DEEP)
    c.rect(0, page_h - hero_h, page_w, hero_h, fill=1, stroke=0)
    c.setFillColor(ACCENT)
    c.rect(0, page_h - hero_h, page_w * 0.55, hero_h, fill=1, stroke=0)

    margin_l = 2.0 * cm
    margin_r = 2.0 * cm

    c.setFillColor(HexColor("#FFFFFF"))
    c.setFont("Helvetica-Bold", 10)
    c.drawString(margin_l, page_h - 1.2 * cm, "HEWNPATH")
    c.setFillColor(HexColor("#D8CEFF"))
    c.setFont("Helvetica", 9)
    c.drawString(margin_l + 2.0 * cm, page_h - 1.2 * cm, "· A FOCUSED UTILITY")

    c.setFillColor(HexColor("#FFFFFF"))
    c.setFont("Helvetica-Bold", 46)
    c.drawString(margin_l, page_h - 4.0 * cm, "Basecraft")

    c.setFillColor(HexColor("#E1D8FF"))
    c.setFont("Helvetica", 14)
    c.drawString(margin_l, page_h - 5.0 * cm, "Pivot tables for Obsidian Bases")

    c.setFillColor(HexColor("#D8CEFF"))
    c.setFont("Helvetica-Oblique", 10)
    tag = "Group, summarize and explore your vault — without leaving Obsidian."
    c.drawString(margin_l, page_h - 5.7 * cm, tag)

    price_x = page_w - margin_r - 5.4 * cm
    price_y = page_h - hero_h + 2.6 * cm

    c.setFillColor(ACCENT_DEEP)
    c.roundRect(price_x - 0.4 * cm, price_y - 0.4 * cm, 5.4 * cm, 3.6 * cm, 8, fill=1, stroke=0)

    c.setFillColor(HexColor("#FFFFFF"))
    c.setFont("Helvetica-Bold", 48)
    c.drawString(price_x + 0.5 * cm, price_y + 1.6 * cm, "$14")

    c.setFillColor(HexColor("#D8CEFF"))
    c.setFont("Helvetica-Bold", 9)
    c.drawString(price_x + 0.5 * cm, price_y + 1.1 * cm, "ONE-TIME")

    c.setFillColor(HexColor("#A99CDC"))
    c.setFont("Helvetica", 8)
    c.drawString(price_x + 0.5 * cm, price_y + 0.5 * cm, "3 devices · lifetime updates")

    mock_x = page_w - margin_r - 6.2 * cm
    mock_y = page_h - hero_h + 0.6 * cm
    mock_w = 0
    mock_h = 0

    pivot_y = page_h - hero_h - 4.5 * cm
    pivot_x = margin_l
    pivot_w = page_w - margin_l - margin_r - 0.5 * cm
    pivot_h = 4.0 * cm

    draw_pivot_mock(c, pivot_x + pivot_w * 0.55, pivot_y, pivot_w * 0.45, pivot_h)

    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 17)
    c.drawString(margin_l, pivot_y + pivot_h - 0.3 * cm, "The gap.")

    c.setFillColor(MUTED)
    c.setFont("Helvetica", 10)
    body_lines = wrap_text(
        "Bases ships with a table view and a card view. Nothing summarizes. "
        "Counting tasks per status by priority, summing hours per project by week, "
        "comparing entries across two dimensions — there is no built-in answer.",
        "Helvetica", 10, pivot_w * 0.5,
    )
    yt = pivot_y + pivot_h - 1.2 * cm
    for line in body_lines:
        c.drawString(margin_l, yt, line)
        yt -= 14

    c.setFillColor(ACCENT)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(margin_l, yt - 6, "Basecraft fills it. One Pivot view, native to your vault.")

    grid_top_y = pivot_y - 1.0 * cm
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(margin_l, grid_top_y, "What you get with Pro.")

    grid_y = grid_top_y - 0.8 * cm
    card_w = (page_w - margin_l - margin_r - 0.5 * cm) / 2
    card_h = 1.9 * cm
    gap_x = 0.5 * cm
    gap_y = 0.4 * cm

    features = [
        ("Drill-down", ["Click a cell to see the matching", "notes. Click a name to open it."]),
        ("Heatmap", ["Conditional formatting that makes", "outliers obvious at a glance."]),
        ("Percentages", ["Show values as % of total,", "% of row or % of column."]),
        ("Advanced aggregations", ["Average, min, max, median,", "distinct count."]),
        ("CSV + Excel export", ["Styled XLSX preserves header,", "heatmap and totals."]),
        ("Future Pro included", ["Multi-dim rows/cols and PNG", "export are next, included free."]),
    ]

    for i, (title, lines) in enumerate(features):
        col = i % 2
        row = i // 2
        x = margin_l + col * (card_w + gap_x)
        y = grid_y - card_h - row * (card_h + gap_y)
        feature_card(c, x, y, card_w, card_h, i + 1, title, lines)

    bottom_band_h = 3.6 * cm
    c.setFillColor(ACCENT_DEEP)
    c.rect(0, 0, page_w, bottom_band_h, fill=1, stroke=0)

    c.setFillColor(HexColor("#FFFFFF"))
    c.setFont("Helvetica-Bold", 11)
    c.drawString(margin_l, bottom_band_h - 0.9 * cm, "ONE-TIME · THREE DEVICES · LIFETIME UPDATES")

    c.setFillColor(HexColor("#FFFFFF"))
    c.setFont("Helvetica-Bold", 22)
    c.drawString(margin_l, bottom_band_h - 1.95 * cm, "Buy at hewnpath.lemonsqueezy.com")

    c.setFillColor(HexColor("#A99CDC"))
    c.setFont("Helvetica-Oblique", 9)
    c.drawString(margin_l, 0.7 * cm, "Hewnpath — focused utilities for the software you use every day.")

    c.setFillColor(HexColor("#A99CDC"))
    c.setFont("Helvetica", 8)
    c.drawRightString(page_w - margin_r, 0.7 * cm, "github.com/Cexyz01/obsidian-basecraft")

    c.showPage()
    c.save()
    print(f"Wrote {out}")


if __name__ == "__main__":
    manual()
    sales_sheet()
