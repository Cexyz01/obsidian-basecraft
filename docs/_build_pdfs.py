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
)
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import stringWidth
from pathlib import Path

OUTDIR = Path(__file__).parent
WIN_FONTS = Path("C:/Windows/Fonts")

REGULAR = "Helvetica"
ITALIC = "Helvetica-Oblique"
SEMI = "Helvetica-Bold"
BOLD = "Helvetica-Bold"
LIGHT = "Helvetica"

try:
    pdfmetrics.registerFont(TTFont("SegoeUI", str(WIN_FONTS / "segoeui.ttf")))
    pdfmetrics.registerFont(TTFont("SegoeUI-Bold", str(WIN_FONTS / "segoeuib.ttf")))
    pdfmetrics.registerFont(TTFont("SegoeUI-Italic", str(WIN_FONTS / "segoeuii.ttf")))
    pdfmetrics.registerFont(TTFont("SegoeUI-Light", str(WIN_FONTS / "segoeuil.ttf")))
    pdfmetrics.registerFont(TTFont("SegoeUI-Semi", str(WIN_FONTS / "segoeuisl.ttf")))
    REGULAR = "SegoeUI"
    ITALIC = "SegoeUI-Italic"
    SEMI = "SegoeUI-Semi"
    BOLD = "SegoeUI-Bold"
    LIGHT = "SegoeUI-Light"
except Exception as e:
    print(f"Font fallback to Helvetica ({e})")

ACCENT = HexColor("#6E4FE6")
ACCENT_DEEP = HexColor("#1F1745")
ACCENT_LIGHT = HexColor("#EDE7FB")
INK = HexColor("#14111F")
MUTED = HexColor("#6E6A82")
SUBTLE = HexColor("#A8A4BB")
RULE = HexColor("#E5E2EE")
PAPER = HexColor("#FAFAFC")
WHITE = HexColor("#FFFFFF")


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


def draw_pivot_mockup(c, x, y, w, h):
    cols = 4
    rows = 3
    cell_w = w / cols
    head_h = h * 0.22
    body_h = h - head_h
    cell_h = body_h / rows

    c.setFillColor(WHITE)
    c.setStrokeColor(RULE)
    c.setLineWidth(0.6)
    c.roundRect(x, y, w, h, 6, fill=1, stroke=1)

    c.setFillColor(ACCENT)
    c.rect(x, y + h - head_h, w, head_h, fill=1, stroke=0)

    c.setFillColor(WHITE)
    c.setFont(BOLD, 10)
    headers = ["", "high", "low", "med"]
    for i, t in enumerate(headers):
        c.drawCentredString(x + cell_w * (i + 0.5), y + h - head_h / 2 - 3, t)

    rowdata = [
        ("doing", [3, 2, 1]),
        ("done", [1, 4, 2]),
        ("todo", [2, 1, 3]),
    ]
    max_v = 4

    for ri, (label, values) in enumerate(rowdata):
        ry = y + body_h - cell_h * (ri + 1)
        c.setFillColor(ACCENT_LIGHT)
        c.rect(x, ry, cell_w, cell_h, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont(SEMI, 9.5)
        c.drawCentredString(x + cell_w * 0.5, ry + cell_h / 2 - 3, label)

        for ci, v in enumerate(values):
            cx = x + cell_w * (ci + 1)
            t = v / max_v
            r0, g0, b0 = 1.0, 1.0, 1.0
            r1, g1, b1 = 0x6E / 255, 0x4F / 255, 0xE6 / 255
            cr = r0 + (r1 - r0) * t * 0.85
            cg = g0 + (g1 - g0) * t * 0.85
            cb = b0 + (b1 - b0) * t * 0.85
            c.setFillColor(Color(cr, cg, cb))
            c.rect(cx, ry, cell_w, cell_h, fill=1, stroke=0)
            c.setFillColor(INK if t < 0.55 else WHITE)
            c.setFont(REGULAR, 10)
            c.drawCentredString(cx + cell_w * 0.5, ry + cell_h / 2 - 3, str(v))

    c.setStrokeColor(WHITE)
    c.setLineWidth(0.6)
    for i in range(cols + 1):
        c.line(x + cell_w * i, y, x + cell_w * i, y + body_h)
    for i in range(rows + 1):
        c.line(x, y + cell_h * i, x + w, y + cell_h * i)


def feature_pill(c, x, y, w, h, dot_color, title, lines):
    c.setFillColor(WHITE)
    c.setStrokeColor(RULE)
    c.setLineWidth(0.5)
    c.roundRect(x, y, w, h, 6, fill=1, stroke=1)

    c.setFillColor(dot_color)
    c.circle(x + 0.55 * cm, y + h - 0.55 * cm, 0.18 * cm, fill=1, stroke=0)

    c.setFillColor(INK)
    c.setFont(SEMI, 11)
    c.drawString(x + 0.95 * cm, y + h - 0.65 * cm, title)

    c.setFillColor(MUTED)
    c.setFont(REGULAR, 8.8)
    yt = y + h - 1.2 * cm
    for line in lines:
        c.drawString(x + 0.55 * cm, yt, line)
        yt -= 11


def sales_sheet():
    out = OUTDIR / "basecraft-sales-sheet.pdf"
    c = canvas.Canvas(str(out), pagesize=A4)
    page_w, page_h = A4

    c.setFillColor(PAPER)
    c.rect(0, 0, page_w, page_h, fill=1, stroke=0)

    margin_l = 2.4 * cm
    margin_r = 2.4 * cm
    content_w = page_w - margin_l - margin_r

    y = page_h - 1.6 * cm

    c.setFillColor(SUBTLE)
    c.setFont(BOLD, 8.5)
    c.drawString(margin_l, y, "HEWNPATH")
    label_w = stringWidth("HEWNPATH", BOLD, 8.5)
    c.setFillColor(SUBTLE)
    c.setFont(REGULAR, 8.5)
    c.drawString(margin_l + label_w + 0.25 * cm, y, "·  A FOCUSED UTILITY")

    c.setFillColor(ACCENT)
    c.rect(margin_l, y + 0.05 * cm, 0.18 * cm, 0.18 * cm, fill=1, stroke=0)

    y = page_h - 4.0 * cm
    c.setFillColor(INK)
    c.setFont(BOLD, 56)
    c.drawString(margin_l, y, "Basecraft.")

    y -= 1.3 * cm
    c.setFillColor(MUTED)
    c.setFont(LIGHT, 18)
    c.drawString(margin_l, y, "Pivot tables for Obsidian Bases.")

    y -= 0.9 * cm
    c.setFillColor(SUBTLE)
    c.setFont(ITALIC, 10.5)
    c.drawString(margin_l, y, "Group, summarize and explore your vault — without leaving Obsidian.")

    chip_w = 4.6 * cm
    chip_h = 3.2 * cm
    chip_x = page_w - margin_r - chip_w
    chip_y = page_h - 6.6 * cm

    c.setFillColor(ACCENT_DEEP)
    c.roundRect(chip_x, chip_y, chip_w, chip_h, 12, fill=1, stroke=0)

    c.setFillColor(SUBTLE)
    c.setFont(BOLD, 7.5)
    c.drawString(chip_x + 0.55 * cm, chip_y + chip_h - 0.6 * cm, "BASECRAFT PRO")

    c.setFillColor(WHITE)
    c.setFont(BOLD, 38)
    c.drawString(chip_x + 0.55 * cm, chip_y + 1.25 * cm, "$14")

    c.setFillColor(HexColor("#D8CEFF"))
    c.setFont(SEMI, 8.5)
    c.drawString(chip_x + 0.55 * cm, chip_y + 0.85 * cm, "ONE-TIME PURCHASE")

    c.setFillColor(SUBTLE)
    c.setFont(REGULAR, 7.5)
    c.drawString(chip_x + 0.55 * cm, chip_y + 0.45 * cm, "3 devices · lifetime updates")

    rule_y = page_h - 7.9 * cm
    c.setStrokeColor(RULE)
    c.setLineWidth(0.6)
    c.line(margin_l, rule_y, page_w - margin_r, rule_y)

    mock_w = content_w * 0.78
    mock_h = 5.4 * cm
    mock_x = margin_l + (content_w - mock_w) / 2
    mock_y = rule_y - 0.9 * cm - mock_h
    draw_pivot_mockup(c, mock_x, mock_y, mock_w, mock_h)

    c.setFillColor(SUBTLE)
    c.setFont(ITALIC, 8.5)
    caption = "Sample pivot — status × priority with heatmap"
    cw = stringWidth(caption, ITALIC, 8.5)
    c.drawString(margin_l + (content_w - cw) / 2, mock_y - 0.55 * cm, caption)

    section_y = mock_y - 1.7 * cm
    c.setFillColor(ACCENT)
    c.rect(margin_l, section_y, 0.6 * cm, 0.08 * cm, fill=1, stroke=0)
    c.setFillColor(INK)
    c.setFont(BOLD, 14)
    c.drawString(margin_l, section_y - 0.65 * cm, "What you get with Pro.")

    grid_y = section_y - 1.3 * cm
    grid_cols = 3
    gap = 0.45 * cm
    card_w = (content_w - gap * (grid_cols - 1)) / grid_cols
    card_h = 2.3 * cm

    features = [
        ("Drill-down", ["Click a cell to see and open", "the matching notes."], ACCENT),
        ("Heatmap", ["Conditional formatting that", "makes outliers obvious."], ACCENT),
        ("Percentages", ["Show values as % of total,", "% of row or % of column."], ACCENT),
        ("Advanced aggregations", ["Average, min, max, median,", "distinct count."], ACCENT),
        ("CSV + Excel export", ["Styled XLSX preserves header,", "heatmap and totals."], ACCENT),
        ("Future Pro included", ["Multi-dim rows/cols and PNG", "export are next, free."], ACCENT),
    ]

    for i, (title, lines, dot) in enumerate(features):
        col = i % grid_cols
        row = i // grid_cols
        cx = margin_l + col * (card_w + gap)
        cy = grid_y - card_h - row * (card_h + gap)
        feature_pill(c, cx, cy, card_w, card_h, dot, title, lines)

    cta_h = 3.0 * cm
    cta_y = 0
    c.setFillColor(ACCENT_DEEP)
    c.rect(0, cta_y, page_w, cta_h, fill=1, stroke=0)

    c.setFillColor(SUBTLE)
    c.setFont(BOLD, 8.5)
    c.drawString(margin_l, cta_y + cta_h - 0.7 * cm, "ONE-TIME  ·  THREE DEVICES  ·  LIFETIME UPDATES")

    c.setFillColor(WHITE)
    c.setFont(BOLD, 22)
    c.drawString(margin_l, cta_y + cta_h - 1.85 * cm, "Buy at hewnpath.lemonsqueezy.com")

    c.setFillColor(SUBTLE)
    c.setFont(ITALIC, 9)
    c.drawString(margin_l, cta_y + 0.7 * cm, "Hewnpath — focused utilities for the software you use every day.")

    c.setFillColor(SUBTLE)
    c.setFont(REGULAR, 8)
    url = "github.com/Cexyz01/obsidian-basecraft"
    uw = stringWidth(url, REGULAR, 8)
    c.drawString(page_w - margin_r - uw, cta_y + 0.7 * cm, url)

    c.showPage()
    c.save()
    print(f"Wrote {out}")


def manual():
    base_styles = getSampleStyleSheet()
    cover_title = ParagraphStyle("CT", parent=base_styles["Title"], fontName=BOLD, fontSize=28, leading=34, textColor=INK, spaceAfter=8, alignment=TA_LEFT)
    cover_subtitle = ParagraphStyle("CS", parent=base_styles["Normal"], fontName=REGULAR, fontSize=12, leading=16, textColor=MUTED, spaceAfter=18)
    h1 = ParagraphStyle("H1", parent=base_styles["Heading1"], fontName=BOLD, fontSize=15, leading=20, textColor=ACCENT, spaceBefore=14, spaceAfter=6)
    h2 = ParagraphStyle("H2", parent=base_styles["Heading2"], fontName=SEMI, fontSize=11.5, leading=15, textColor=INK, spaceBefore=8, spaceAfter=3)
    body = ParagraphStyle("B", parent=base_styles["BodyText"], fontName=REGULAR, fontSize=10.5, leading=15, textColor=INK, spaceAfter=5, alignment=TA_LEFT)
    muted_st = ParagraphStyle("M", parent=body, textColor=MUTED, fontSize=9.5, leading=13)
    bullet = ParagraphStyle("BL", parent=body, leftIndent=14, bulletIndent=2, spaceAfter=3)

    doc = SimpleDocTemplate(
        str(OUTDIR / "basecraft-user-manual.pdf"),
        pagesize=A4, leftMargin=2.4 * cm, rightMargin=2.4 * cm,
        topMargin=2.2 * cm, bottomMargin=2.2 * cm,
        title="Basecraft User Manual", author="Hewnpath",
    )
    width = doc.width
    story = []

    story.append(Paragraph("Basecraft", cover_title))
    story.append(Paragraph("User Manual", h1))
    story.append(Paragraph("Version 0.3.2 · By Hewnpath", cover_subtitle))

    rule = Table([[""]], colWidths=[width], rowHeights=[0.6])
    rule.setStyle(TableStyle([("LINEBELOW", (0, 0), (-1, -1), 0.6, RULE)]))
    story.append(rule)
    story.append(Spacer(1, 16))

    story.append(Paragraph("What Basecraft does", h1))
    story.append(Paragraph(
        "Basecraft adds a Pivot view to Obsidian Bases. Pick one property as rows, "
        "another as columns, choose an aggregation, and your entries are grouped "
        "into a cross-table — like a spreadsheet pivot, but native to your vault. "
        "It is built on the official Bases plugin API introduced in Obsidian 1.10.",
        body,
    ))

    story.append(Paragraph("Installation", h1))
    story.append(Paragraph("From the community store", h2))
    story.append(Paragraph(
        "Coming soon. Once Basecraft is approved by Obsidian, you will be able to install it "
        "from Settings → Community plugins → Browse.",
        body,
    ))
    story.append(Paragraph("Manual install", h2))
    story.append(Paragraph(
        "1. Download <b>main.js</b>, <b>manifest.json</b> and <b>styles.css</b> from the "
        "<a color='#6E4FE6' href='https://github.com/Cexyz01/obsidian-basecraft/releases'>"
        "latest release</a>.",
        body,
    ))
    story.append(Paragraph("2. Place them inside <b>&lt;your-vault&gt;/.obsidian/plugins/basecraft/</b>.", body))
    story.append(Paragraph("3. Settings → Community plugins → enable, then toggle Basecraft on.", body))
    story.append(Paragraph("4. Make sure the <b>Bases</b> core plugin is enabled (Obsidian 1.10 or newer).", body))

    story.append(Paragraph("Quick start", h1))
    story.append(Paragraph("1. Create a <b>.base</b> file from the command palette: <i>Bases: Create new base</i>.", body))
    story.append(Paragraph("2. Add a new view, choose <b>Pivot</b>.", body))
    story.append(Paragraph("3. In the Basecraft toolbar, set <b>Rows</b>, <b>Columns</b> and an <b>Aggregation</b>.", body))

    story.append(Paragraph("Toolbar reference", h1))
    rows = [
        ["Control", "What it does"],
        ["Rows", "Property whose unique values become the row headers."],
        ["Columns", "Property whose unique values become the column headers."],
        ["Aggregation", "Count and Sum are free. Average, Min, Max, Median, Distinct count are Pro."],
        ["Value", "The property aggregated by Sum / Average / Min / Max / Median. Ignored for Count."],
        ["Display", "Raw values (free), or % of total / row / column (Pro)."],
        ["Heatmap", "Pro. Tints each cell based on its value across the grid."],
        ["Export CSV", "Pro. Saves the pivot as a .csv (Excel-friendly)."],
        ["Export Excel", "Pro. Saves a styled .xlsx with header colors, heatmap and totals."],
    ]
    table = Table(rows, colWidths=[3.5 * cm, width - 3.5 * cm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), ACCENT_LIGHT),
        ("TEXTCOLOR", (0, 0), (-1, 0), INK),
        ("FONTNAME", (0, 0), (-1, 0), BOLD),
        ("FONTNAME", (0, 1), (-1, -1), REGULAR),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, RULE),
    ]))
    story.append(table)

    story.append(PageBreak())
    story.append(Paragraph("Pro features", h1))
    pro_items = [
        ("Advanced aggregations", "Average, Min, Max, Median, Distinct count, in addition to free Count and Sum."),
        ("Drill-down", "Click a cell to open a list of the notes that contributed to it."),
        ("Heatmap conditional formatting", "Each cell is tinted between the smallest and largest in the grid."),
        ("Percentage display", "Show values as % of total, % of row, or % of column."),
        ("CSV export", "Save the pivot as Excel-friendly CSV in one click."),
        ("Excel export", "Save a styled .xlsx — header in accent color, heatmap fills, totals preserved."),
        ("Future Pro additions", "Multi-dimensional rows / columns and PNG export are next, included in your purchase."),
    ]
    for name, desc in pro_items:
        story.append(Paragraph(f"<b>{name}.</b> {desc}", bullet, bulletText="•"))

    story.append(Paragraph("Activating Pro", h1))
    story.append(Paragraph(
        "After purchase you receive a license key by email. "
        "Settings → Basecraft → paste the key into <b>Pro license key</b>. "
        "The toolbar switches from gated to unlocked. A single license activates on up to three devices.",
        body,
    ))

    story.append(Paragraph("Troubleshooting", h1))
    story.append(Paragraph("Pivot view does not appear", h2))
    story.append(Paragraph("Check that Bases is enabled in Core plugins and Obsidian is 1.10+. Reload after enabling.", body))
    story.append(Paragraph("The pivot is empty", h2))
    story.append(Paragraph("You need a Rows and a Columns property — both required.", body))
    story.append(Paragraph("Property dropdowns are empty", h2))
    story.append(Paragraph("The base has no properties yet. Add some frontmatter to a few notes.", body))
    story.append(Paragraph("Pro stays locked after pasting the key", h2))
    story.append(Paragraph("Make sure the key was copied without trailing whitespace. Status reads 'Pro: active' when accepted.", body))

    story.append(Paragraph("Support", h1))
    story.append(Paragraph(
        "Bug reports and feature requests: "
        "<a color='#6E4FE6' href='https://github.com/Cexyz01/obsidian-basecraft/issues'>"
        "github.com/Cexyz01/obsidian-basecraft/issues</a>.",
        body,
    ))
    story.append(Spacer(1, 16))
    rule2 = Table([[""]], colWidths=[width], rowHeights=[0.6])
    rule2.setStyle(TableStyle([("LINEBELOW", (0, 0), (-1, -1), 0.6, RULE)]))
    story.append(rule2)
    story.append(Spacer(1, 6))
    story.append(Paragraph("Hewnpath — focused utilities for the software you use every day.", muted_st))

    doc.build(story)
    print(f"Wrote {OUTDIR / 'basecraft-user-manual.pdf'}")


if __name__ == "__main__":
    manual()
    sales_sheet()
