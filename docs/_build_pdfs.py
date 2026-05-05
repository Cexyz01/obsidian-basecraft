from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    BaseDocTemplate,
    PageTemplate,
    NextPageTemplate,
    Frame,
    Paragraph,
    Spacer,
    PageBreak,
    Table,
    TableStyle,
    Flowable,
    KeepTogether,
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
MONO = "Courier"
MONO_BOLD = "Courier-Bold"

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

try:
    pdfmetrics.registerFont(TTFont("Consolas", str(WIN_FONTS / "consola.ttf")))
    pdfmetrics.registerFont(TTFont("Consolas-Bold", str(WIN_FONTS / "consolab.ttf")))
    MONO = "Consolas"
    MONO_BOLD = "Consolas-Bold"
except Exception:
    pass

ACCENT = HexColor("#6E4FE6")
ACCENT_DEEP = HexColor("#1F1745")
ACCENT_LIGHT = HexColor("#EDE7FB")
ACCENT_SOFT = HexColor("#F4F0FB")
INK = HexColor("#14111F")
MUTED = HexColor("#6E6A82")
SUBTLE = HexColor("#A8A4BB")
RULE = HexColor("#E5E2EE")
PAPER = HexColor("#FAFAFC")
WHITE = HexColor("#FFFFFF")
CODE_BG = HexColor("#F4F2F8")
TIP_BG = HexColor("#F4F0FB")
TIP_BORDER = HexColor("#D8CEF0")


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
            r1, g1, b1 = 0x6E / 255, 0x4F / 255, 0xE6 / 255
            cr = 1.0 + (r1 - 1.0) * t * 0.85
            cg = 1.0 + (g1 - 1.0) * t * 0.85
            cb = 1.0 + (b1 - 1.0) * t * 0.85
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


# Sales sheet stays as-is from previous good version
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
    chip_h = 3.0 * cm
    chip_x = page_w - margin_r - chip_w
    chip_y = page_h - 2.4 * cm - chip_h

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
        ("Drill-down", ["Click a cell to see and open", "the matching notes."]),
        ("Heatmap", ["Conditional formatting that", "makes outliers obvious."]),
        ("Percentages", ["Show values as % of total,", "% of row or % of column."]),
        ("Advanced aggregations", ["Average, min, max, median,", "distinct count."]),
        ("CSV + Excel export", ["Styled XLSX preserves header,", "heatmap and totals."]),
        ("Future Pro included", ["Multi-dim rows/cols and PNG", "export are next, free."]),
    ]

    for i, (title, lines) in enumerate(features):
        col = i % grid_cols
        row = i // grid_cols
        cx = margin_l + col * (card_w + gap)
        cy = grid_y - card_h - row * (card_h + gap)
        feature_pill(c, cx, cy, card_w, card_h, ACCENT, title, lines)

    cta_h = 4.2 * cm
    c.setFillColor(ACCENT_DEEP)
    c.rect(0, 0, page_w, cta_h, fill=1, stroke=0)

    c.setFillColor(SUBTLE)
    c.setFont(BOLD, 8.5)
    c.drawString(margin_l, cta_h - 1.0 * cm, "ONE-TIME  ·  THREE DEVICES  ·  LIFETIME UPDATES")

    c.setFillColor(WHITE)
    c.setFont(BOLD, 22)
    c.drawString(margin_l, cta_h - 2.45 * cm, "Buy at hewnpath.lemonsqueezy.com")

    c.setStrokeColor(HexColor("#3A2D6B"))
    c.setLineWidth(0.5)
    c.line(margin_l, 1.1 * cm, page_w - margin_r, 1.1 * cm)

    c.setFillColor(SUBTLE)
    c.setFont(ITALIC, 9)
    c.drawString(margin_l, 0.55 * cm, "Hewnpath — focused utilities for the software you use every day.")

    c.setFillColor(SUBTLE)
    c.setFont(REGULAR, 8)
    url = "github.com/Cexyz01/obsidian-basecraft"
    uw = stringWidth(url, REGULAR, 8)
    c.drawString(page_w - margin_r - uw, 0.55 * cm, url)

    c.showPage()
    c.save()
    print(f"Wrote {out}")


# === User manual: layout custom ===

class SectionDivider(Flowable):
    def __init__(self, label, width):
        super().__init__()
        self.label = label
        self.width = width
        self.height = 1.7 * cm

    def draw(self):
        c = self.canv
        c.setFillColor(ACCENT)
        c.rect(0, self.height - 0.08 * cm, 0.6 * cm, 0.08 * cm, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont(BOLD, 17)
        c.drawString(0, 0.5 * cm, self.label)


class NumberedStep(Flowable):
    def __init__(self, number, text, width, body_font_size=10.5):
        super().__init__()
        self.number = number
        self.text = text
        self.width = width
        self.body_font_size = body_font_size
        self.lines = wrap_text(text, REGULAR, body_font_size, width - 1.0 * cm)
        self.height = max(0.85 * cm, len(self.lines) * (body_font_size + 4) + 0.25 * cm)

    def draw(self):
        c = self.canv
        c.setFillColor(ACCENT)
        c.circle(0.32 * cm, self.height - 0.32 * cm, 0.32 * cm, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont(BOLD, 11)
        c.drawCentredString(0.32 * cm, self.height - 0.32 * cm - 4, str(self.number))

        c.setFillColor(INK)
        c.setFont(REGULAR, self.body_font_size)
        yt = self.height - 0.32 * cm + 4
        for line in self.lines:
            c.drawString(1.0 * cm, yt, line)
            yt -= self.body_font_size + 4


class TipCallout(Flowable):
    def __init__(self, kind, text, width):
        super().__init__()
        self.kind = kind
        self.text = text
        self.width = width
        self.lines = wrap_text(text, REGULAR, 9.5, width - 1.4 * cm)
        self.height = max(1.1 * cm, len(self.lines) * 13 + 0.6 * cm)

    def draw(self):
        c = self.canv
        c.setFillColor(TIP_BG)
        c.setStrokeColor(TIP_BORDER)
        c.setLineWidth(0.5)
        c.roundRect(0, 0, self.width, self.height, 6, fill=1, stroke=1)

        c.setFillColor(ACCENT)
        c.rect(0, 0, 0.12 * cm, self.height, fill=1, stroke=0)

        c.setFillColor(ACCENT_DEEP)
        c.setFont(BOLD, 8.5)
        c.drawString(0.5 * cm, self.height - 0.45 * cm, self.kind.upper())

        c.setFillColor(INK)
        c.setFont(REGULAR, 9.5)
        yt = self.height - 0.85 * cm
        for line in self.lines:
            c.drawString(0.5 * cm, yt, line)
            yt -= 13


class CodeLine(Flowable):
    def __init__(self, text, width):
        super().__init__()
        self.text = text
        self.width = width
        self.height = 0.8 * cm

    def draw(self):
        c = self.canv
        c.setFillColor(CODE_BG)
        c.roundRect(0, 0, self.width, self.height, 4, fill=1, stroke=0)
        c.setFillColor(ACCENT_DEEP)
        c.setFont(MONO, 9.5)
        c.drawString(0.4 * cm, 0.25 * cm, self.text)


def manual_cover(canv, doc):
    page_w, page_h = A4

    canv.setFillColor(PAPER)
    canv.rect(0, 0, page_w, page_h, fill=1, stroke=0)

    # Top brand bar
    canv.setFillColor(SUBTLE)
    canv.setFont(BOLD, 8.5)
    canv.drawString(2.4 * cm, page_h - 1.6 * cm, "HEWNPATH")
    label_w = stringWidth("HEWNPATH", BOLD, 8.5)
    canv.setFont(REGULAR, 8.5)
    canv.drawString(2.4 * cm + label_w + 0.25 * cm, page_h - 1.6 * cm, "·  USER MANUAL")

    # Title block
    canv.setFillColor(INK)
    canv.setFont(BOLD, 56)
    canv.drawString(2.4 * cm, page_h - 6.0 * cm, "Basecraft.")

    canv.setFillColor(MUTED)
    canv.setFont(LIGHT, 18)
    canv.drawString(2.4 * cm, page_h - 7.4 * cm, "User manual")

    canv.setFillColor(SUBTLE)
    canv.setFont(ITALIC, 10.5)
    canv.drawString(2.4 * cm, page_h - 8.1 * cm, "Pivot tables for Obsidian Bases — Pro features, install, troubleshooting.")

    # Divider
    canv.setStrokeColor(RULE)
    canv.setLineWidth(0.6)
    canv.line(2.4 * cm, page_h - 9.5 * cm, page_w - 2.4 * cm, page_h - 9.5 * cm)

    # Pivot mockup as visual centerpiece
    mock_w = (page_w - 4.8 * cm) * 0.85
    mock_h = 5.6 * cm
    mock_x = 2.4 * cm + ((page_w - 4.8 * cm) - mock_w) / 2
    mock_y = page_h - 9.5 * cm - 1.0 * cm - mock_h
    draw_pivot_mockup(canv, mock_x, mock_y, mock_w, mock_h)

    # Caption
    canv.setFillColor(SUBTLE)
    canv.setFont(ITALIC, 8.5)
    caption = "What a pivot view looks like — status × priority with heatmap."
    cw = stringWidth(caption, ITALIC, 8.5)
    canv.drawString(2.4 * cm + ((page_w - 4.8 * cm) - cw) / 2, mock_y - 0.55 * cm, caption)

    # Version & metadata block at bottom
    meta_y = 4.0 * cm
    canv.setFillColor(ACCENT)
    canv.rect(2.4 * cm, meta_y + 1.8 * cm, 0.6 * cm, 0.08 * cm, fill=1, stroke=0)

    canv.setFillColor(INK)
    canv.setFont(BOLD, 12)
    canv.drawString(2.4 * cm, meta_y + 1.2 * cm, "Version 0.3.2")

    canv.setFillColor(MUTED)
    canv.setFont(REGULAR, 10)
    canv.drawString(2.4 * cm, meta_y + 0.55 * cm, "By Hewnpath  ·  github.com/Cexyz01/obsidian-basecraft")

    # CTA-like band at very bottom
    band_h = 1.6 * cm
    canv.setFillColor(ACCENT_DEEP)
    canv.rect(0, 0, page_w, band_h, fill=1, stroke=0)

    canv.setFillColor(WHITE)
    canv.setFont(BOLD, 11)
    canv.drawString(2.4 * cm, band_h - 0.6 * cm, "Get Pro at hewnpath.lemonsqueezy.com")

    canv.setFillColor(SUBTLE)
    canv.setFont(REGULAR, 8.5)
    canv.drawString(2.4 * cm, 0.45 * cm, "$14 one-time  ·  3 devices  ·  lifetime updates")


def manual_page(canv, doc):
    page_w, page_h = A4

    canv.setFillColor(PAPER)
    canv.rect(0, 0, page_w, page_h, fill=1, stroke=0)

    # Top header
    canv.setFillColor(SUBTLE)
    canv.setFont(BOLD, 7.5)
    canv.drawString(2.4 * cm, page_h - 1.3 * cm, "BASECRAFT  ·  USER MANUAL")
    canv.setFillColor(SUBTLE)
    canv.setFont(REGULAR, 7.5)
    canv.drawRightString(page_w - 2.4 * cm, page_h - 1.3 * cm, "v0.3.2")

    canv.setStrokeColor(RULE)
    canv.setLineWidth(0.4)
    canv.line(2.4 * cm, page_h - 1.55 * cm, page_w - 2.4 * cm, page_h - 1.55 * cm)

    # Footer
    canv.setStrokeColor(RULE)
    canv.line(2.4 * cm, 1.55 * cm, page_w - 2.4 * cm, 1.55 * cm)

    canv.setFillColor(SUBTLE)
    canv.setFont(REGULAR, 8)
    canv.drawString(2.4 * cm, 1.05 * cm, "Hewnpath · focused utilities")
    canv.drawRightString(page_w - 2.4 * cm, 1.05 * cm, f"Page {doc.page}")


def manual():
    out = OUTDIR / "basecraft-user-manual.pdf"
    page_w, page_h = A4
    doc = BaseDocTemplate(
        str(out),
        pagesize=A4,
        title="Basecraft User Manual",
        author="Hewnpath",
        leftMargin=2.4 * cm, rightMargin=2.4 * cm,
        topMargin=2.0 * cm, bottomMargin=2.0 * cm,
    )

    cover_frame = Frame(0, 0, page_w, page_h, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0, id="cover")
    body_frame = Frame(2.4 * cm, 2.0 * cm, page_w - 4.8 * cm, page_h - 4.0 * cm, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0, id="body")

    doc.addPageTemplates([
        PageTemplate(id="Cover", frames=[cover_frame], onPage=manual_cover),
        PageTemplate(id="Content", frames=[body_frame], onPage=manual_page),
    ])

    width = page_w - 4.8 * cm
    body = ParagraphStyle("B", fontName=REGULAR, fontSize=10.5, leading=15.5, textColor=INK, spaceAfter=6, alignment=TA_LEFT)
    body_muted = ParagraphStyle("BM", parent=body, textColor=MUTED, fontSize=10, leading=14)
    h2 = ParagraphStyle("H2", fontName=SEMI, fontSize=12, leading=16, textColor=INK, spaceBefore=10, spaceAfter=4)
    intro = ParagraphStyle("INT", fontName=LIGHT, fontSize=12.5, leading=18, textColor=MUTED, spaceAfter=10)

    story = []

    # Page 1 = Cover (drawn entirely by onPage). A tiny Spacer holds the page open.
    story.append(Spacer(1, 1))
    story.append(NextPageTemplate("Content"))
    story.append(PageBreak())

    # Section: Welcome
    story.append(SectionDivider("Welcome", width))
    story.append(Paragraph(
        "Basecraft adds a Pivot view to <b>Obsidian Bases</b>. Pick one property "
        "as rows, another as columns, choose an aggregation, and your entries "
        "are grouped into a cross-table — like a spreadsheet pivot, but native "
        "to your vault.",
        intro,
    ))
    story.append(TipCallout(
        "Requires",
        "Obsidian 1.10 or newer with the Bases core plugin enabled. "
        "Bases is enabled by default in fresh installs.",
        width,
    ))
    story.append(Spacer(1, 0.4 * cm))

    # Section: Install
    story.append(SectionDivider("Install", width))
    story.append(Paragraph("From the community store", h2))
    story.append(Paragraph(
        "Coming soon. Once Basecraft is approved, install it from "
        "<b>Settings → Community plugins → Browse</b> and search for "
        "<i>Basecraft</i>.",
        body,
    ))

    story.append(Paragraph("Manual install", h2))
    story.append(NumberedStep(1, "Download main.js, manifest.json and styles.css from the latest GitHub release.", width))
    story.append(Spacer(1, 0.15 * cm))
    story.append(NumberedStep(2, "Place them inside <vault>/.obsidian/plugins/basecraft/", width))
    story.append(Spacer(1, 0.05 * cm))
    story.append(CodeLine("<your-vault>/.obsidian/plugins/basecraft/", width))
    story.append(Spacer(1, 0.2 * cm))
    story.append(NumberedStep(3, "Open Settings → Community plugins, enable community plugins, then toggle Basecraft on.", width))
    story.append(Spacer(1, 0.15 * cm))
    story.append(NumberedStep(4, "Confirm Bases is enabled in Core plugins. Reload Obsidian if you just enabled it.", width))
    story.append(Spacer(1, 0.4 * cm))

    # Section: Quick start
    story.append(SectionDivider("Quick start", width))
    story.append(NumberedStep(1, "Open the command palette (Ctrl+P) and run 'Bases: Create new base'.", width))
    story.append(Spacer(1, 0.15 * cm))
    story.append(NumberedStep(2, "Inside the new base, click + to add a view, choose Pivot.", width))
    story.append(Spacer(1, 0.15 * cm))
    story.append(NumberedStep(3, "In the Basecraft toolbar set Rows, Columns and an Aggregation. The pivot recomputes immediately.", width))
    story.append(Spacer(1, 0.4 * cm))

    story.append(PageBreak())

    # Section: Toolbar reference
    story.append(SectionDivider("Toolbar reference", width))

    rows = [
        ["Control", "What it does", "Tier"],
        ["Rows", "Property whose unique values become row headers.", "Free"],
        ["Columns", "Property whose unique values become column headers.", "Free"],
        ["Aggregation", "Count and Sum.", "Free"],
        ["", "Average, Min, Max, Median, Distinct count.", "Pro"],
        ["Value", "The numeric property used by Sum / Average / Min / Max / Median.", "Free"],
        ["Display", "Raw values.", "Free"],
        ["", "% of total / % of row / % of column.", "Pro"],
        ["Heatmap", "Tints each cell based on its value across the grid.", "Pro"],
        ["Export CSV", "Saves the pivot as Excel-friendly CSV.", "Pro"],
        ["Export Excel", "Styled .xlsx with header colors, heatmap and totals.", "Pro"],
    ]

    table = Table(rows, colWidths=[3.0 * cm, width - 5.5 * cm, 2.5 * cm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), ACCENT_LIGHT),
        ("TEXTCOLOR", (0, 0), (-1, 0), INK),
        ("FONTNAME", (0, 0), (-1, 0), BOLD),
        ("FONTNAME", (0, 1), (-1, -1), REGULAR),
        ("FONTSIZE", (0, 0), (-1, -1), 9.5),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (2, 0), (2, -1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, RULE),
    ]))
    story.append(table)
    story.append(Spacer(1, 0.4 * cm))

    # Section: Pro features
    story.append(SectionDivider("Pro features", width))
    pro_items = [
        ("Drill-down", "Click any cell to open a list of the notes that contributed to it. Click a name to open the note."),
        ("Heatmap", "Each cell is tinted between the smallest and largest value in the grid. Outliers become obvious."),
        ("Percentages", "Show values as % of total, % of row, or % of column. Useful for distribution analysis."),
        ("Advanced aggregations", "Average, Min, Max, Median and Distinct count, in addition to free Count and Sum."),
        ("CSV export", "Save the pivot as a CSV file. Excel-friendly: opens with proper columns in any locale."),
        ("Excel export", "Save a styled .xlsx — header in accent color, heatmap fills, totals preserved, frozen first row and column."),
        ("Future Pro additions", "Multi-dimensional rows / columns and PNG export are next, included in your purchase."),
    ]
    for name, desc in pro_items:
        story.append(Paragraph(f"<b>{name}</b><br/>{desc}", body))
        story.append(Spacer(1, 0.2 * cm))

    story.append(PageBreak())

    # Section: Activate Pro
    story.append(SectionDivider("Activate Pro", width))
    story.append(Paragraph(
        "After your purchase you receive a license key by email. Open Obsidian, "
        "go to <b>Settings → Basecraft</b>, and paste the key into the "
        "<b>Pro license key</b> field. The toolbar switches from gated to unlocked, "
        "and the status line under the field reads <b>Pro: active</b>.",
        body,
    ))
    story.append(TipCallout(
        "Note",
        "A single license activates on up to three devices. To free a slot, "
        "open Settings → Basecraft on the device you want to remove and "
        "clear the license key.",
        width,
    ))
    story.append(Spacer(1, 0.4 * cm))

    # Section: Troubleshooting
    story.append(SectionDivider("Troubleshooting", width))

    story.append(Paragraph("The Pivot view does not appear in the view selector", h2))
    story.append(Paragraph(
        "Bases must be enabled in Core plugins, and Obsidian must be 1.10 or newer. "
        "After enabling either, reload Obsidian (Ctrl+R or restart).",
        body_muted,
    ))

    story.append(Paragraph("The pivot is empty", h2))
    story.append(Paragraph(
        "Both Rows and Columns are required. Pick a property in each dropdown of the toolbar.",
        body_muted,
    ))

    story.append(Paragraph("Property dropdowns are empty", h2))
    story.append(Paragraph(
        "The base has no properties to pivot on. Open a few of the matching notes "
        "and add some frontmatter (status, priority, etc.).",
        body_muted,
    ))

    story.append(Paragraph("Pro features stay locked after pasting the key", h2))
    story.append(Paragraph(
        "Make sure the key was copied without trailing whitespace. The status line "
        "under the field reads 'Pro: active' once accepted.",
        body_muted,
    ))

    story.append(Spacer(1, 0.6 * cm))

    # Section: Support
    story.append(SectionDivider("Support", width))
    story.append(Paragraph(
        "Bug reports and feature requests are welcome at "
        "<a color='#6E4FE6' href='https://github.com/Cexyz01/obsidian-basecraft/issues'>"
        "github.com/Cexyz01/obsidian-basecraft/issues</a>. We read every one.",
        body,
    ))
    story.append(Spacer(1, 0.6 * cm))

    story.append(TipCallout(
        "Thank you",
        "Basecraft is built and supported by an indie developer at Hewnpath. "
        "If Pro is useful to you, every purchase directly funds future updates "
        "and new features.",
        width,
    ))

    doc.build(story)
    print(f"Wrote {out}")


if __name__ == "__main__":
    manual()
    sales_sheet()
