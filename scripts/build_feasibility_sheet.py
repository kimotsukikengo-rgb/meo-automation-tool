# -*- coding: utf-8 -*-
"""MEO自動化 可否整理スプレッドシート(社内共有用)を生成する。

出力: docs/MEO自動化_可否一覧.xlsx
- シート1「可否一覧」: 項目ごとの自動化可否を色分けで整理
- シート2「凡例・前提条件」: 評価記号の定義と全体に共通する前提・制約
"""
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# ---- 色定義 -------------------------------------------------------------
NAVY = "1F3864"        # ヘッダ背景
NAVY_FONT = "FFFFFF"
GREEN = "C6EFCE"       # ◎ 完全に自動化可能
LIGHTGREEN = "E2EFDA"  # ○ 条件付きで可能
ORANGE = "FFE699"      # △ 限定的/間接的にのみ可能
RED = "FFC7CE"         # × 自動化不可
GREY = "F2F2F2"        # 区切り行

thin = Side(style="thin", color="BFBFBF")
BORDER = Border(left=thin, right=thin, top=thin, bottom=thin)

def fill(hex_):
    return PatternFill("solid", fgColor=hex_)

VERDICT_FILL = {"◎": GREEN, "○": LIGHTGREEN, "△": ORANGE, "×": RED}

# ---- データ -------------------------------------------------------------
# (カテゴリ, 項目, 可否, 自動化できる範囲, 実現方式・技術的根拠, 前提条件・制約)
ROWS = [
    ("生成系\n(LLMで作る)", "投稿文生成", "◎",
     "店舗情報・キャンペーン・キーワードから投稿文を全自動生成。複数案・トーン違いの一括生成も可。",
     "LLM(Opus 4.8)で生成。本ツールに実装済み(投稿文生成画面)。",
     "誤情報・薬機法/景表法に触れる表現の最終チェックは人の確認を推奨。"),

    ("生成系\n(LLMで作る)", "口コミ返信文生成", "◎",
     "口コミ本文・評価点から返信文を全自動生成。評価別のトーン調整も可。",
     "LLM(Opus 4.8)で生成。本ツールに実装済み(口コミ返信生成画面)。",
     "低評価・クレーム・トラブル系は人のレビュー後に投稿を推奨。"),

    ("生成系\n(LLMで作る)", "画像生成", "○",
     "投稿用の装飾バナー・テキスト合成画像・イラスト系ビジュアルは自動生成可能。",
     "画像生成API(例: 生成AIモデル)で作成。テキスト合成は別途自動化可。",
     "実店舗・実商品・実スタッフの「実写」はAIでは代替不可。"
     "GBPは実態と異なる/過度な加工画像を推奨しないため、用途を装飾系に限定する必要あり。"),

    ("取得・集計系", "データ集計", "◎",
     "表示回数・検索数・通話・ルート検索・口コミ件数/平均点などの指標を自動取得・集計。",
     "ビジネスプロフィール Performance API + スプレッドシート連携で自動化。",
     "後述のAPIアクセス承認が前提。"),

    ("取得・集計系", "順位取得\n(ローカル/マップ順位)", "△",
     "「指定キーワードでの地図上の表示順位」の自動取得は限定的。"
     "第三者ツール経由なら定点観測は可能。",
     "Googleはローカルパック/マップ順位の【公式APIを提供していない】。"
     "実現手段は(a)グリッドスクレイピング自前実装(不安定・規約グレー)、"
     "(b)第三者有料API/ツール(BrightLocal等)に限られる。",
     "★最大の制約。順位は検索者の現在地・個人化で変動するため『正確な単一順位』は原理的に存在しない。"
     "公式・安定的な自動取得は不可。"),

    ("通知系", "アラート通知", "◎",
     "新着口コミ・未返信の検知、指標の急落、評価点低下などをSlack/メールへ自動通知。",
     "新着口コミはPub/Sub通知、指標はAPI定期取得+しきい値判定→通知連携。",
     "APIアクセス承認と通知先(Slack/メール)連携が前提。"),

    ("資料作成系", "レポート自動生成", "◎",
     "取得した指標+LLMの所見コメントを組み合わせ、レポートを自動生成。",
     "Performance API取得値 → LLMで考察文生成 → テンプレートへ流し込み。",
     "データソース(API)連携が前提。"),

    ("資料作成系", "定例資料作成", "○",
     "月次/週次の定例フォーマットへのデータ流し込み・コメント生成までは自動化可能。",
     "レポート生成 + テンプレート(スプレッドシート/スライド)へ自動反映。",
     "体裁の最終調整やクライアント個別の見せ方は人の手が入る場合あり。"
     "完全自動化はテンプレート整備とデータ連携の整備度合いに依存。"),

    ("投稿・反映系\n(GBPへ書き込む)", "投稿の自動投稿\n(GBPへ反映)", "○",
     "生成した投稿文・画像をGoogleビジネスプロフィールへ自動投稿。予約投稿も実装可。",
     "ビジネスプロフィール API(localPosts/メディアアップロード)で実現。",
     "★APIアクセス承認(Googleへの申請・審査通過)・OAuth設定・クォータ制限が前提。"
     "承認前は手動投稿、またはブラウザ自動操作(不安定・規約リスク)に留まる。"),

    ("投稿・反映系\n(GBPへ書き込む)", "口コミ返信の自動投稿\n(GBPへ反映)", "○",
     "生成した返信文をGoogleビジネスプロフィールの該当口コミへ自動で返信投稿。",
     "ビジネスプロフィール API(reviews 返信更新)で実現。",
     "★APIアクセス承認・OAuth設定・クォータ制限が前提。低評価対応は人の承認フローを挟む運用を推奨。"),
]

# ---- ワークブック構築 ---------------------------------------------------
wb = Workbook()
ws = wb.active
ws.title = "可否一覧"

# タイトル
ws.merge_cells("A1:F1")
ws["A1"] = "MEO運用 自動化 可否一覧(社内共有用)"
ws["A1"].font = Font(bold=True, size=15, color=NAVY)
ws["A1"].alignment = Alignment(vertical="center")
ws.row_dimensions[1].height = 28

ws.merge_cells("A2:F2")
ws["A2"] = ("結論: 「生成系」はほぼ完全に自動化可能。ボトルネックは ①ビジネスプロフィールAPIのアクセス承認(投稿・口コミ・指標の読み書きが依存)"
            " と ②順位取得に公式APIが存在しないこと、の2点に集約される。  作成日: 2026-06-10 / 生成モデル: Opus 4.8")
ws["A2"].font = Font(size=9, color="555555")
ws["A2"].alignment = Alignment(vertical="center", wrap_text=True)
ws.row_dimensions[2].height = 30

# ヘッダ
headers = ["カテゴリ", "項目", "可否", "自動化できる範囲", "実現方式・技術的根拠", "前提条件・制約"]
header_row = 3
for col, h in enumerate(headers, start=1):
    c = ws.cell(row=header_row, column=col, value=h)
    c.fill = fill(NAVY)
    c.font = Font(bold=True, color=NAVY_FONT, size=11)
    c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    c.border = BORDER
ws.row_dimensions[header_row].height = 24

# データ行
r = header_row + 1
for cat, item, verdict, scope, how, pre in ROWS:
    values = [cat, item, verdict, scope, how, pre]
    for col, v in enumerate(values, start=1):
        c = ws.cell(row=r, column=col, value=v)
        c.border = BORDER
        c.alignment = Alignment(
            horizontal="center" if col in (1, 2, 3) else "left",
            vertical="center", wrap_text=True,
        )
        if col == 3:  # 可否セルを色分け
            c.fill = fill(VERDICT_FILL[verdict])
            c.font = Font(bold=True, size=14)
        if col == 1:
            c.font = Font(bold=True, size=10, color="333333")
    ws.row_dimensions[r].height = 70
    r += 1

# 列幅
widths = [14, 18, 6, 40, 38, 42]
for i, w in enumerate(widths, start=1):
    ws.column_dimensions[get_column_letter(i)].width = w

ws.freeze_panes = "A4"

# ---- シート2: 凡例・前提 ------------------------------------------------
ws2 = wb.create_sheet("凡例・前提条件")

ws2.merge_cells("A1:B1")
ws2["A1"] = "凡例(可否記号の定義)"
ws2["A1"].font = Font(bold=True, size=13, color=NAVY)
ws2.row_dimensions[1].height = 24

legend = [
    ("◎", "完全に自動化可能。人手はほぼ不要(最終確認のみ)。", GREEN),
    ("○", "条件付きで自動化可能。API承認や一部の人手確認が前提。", LIGHTGREEN),
    ("△", "限定的・間接的にのみ可能。公式手段がなく第三者ツールや不安定な手段に依存。", ORANGE),
    ("×", "現時点で自動化は不可。", RED),
]
lr = 2
for mark, desc, color in legend:
    cm = ws2.cell(row=lr, column=1, value=mark)
    cm.fill = fill(color); cm.font = Font(bold=True, size=14)
    cm.alignment = Alignment(horizontal="center", vertical="center")
    cm.border = BORDER
    cd = ws2.cell(row=lr, column=2, value=desc)
    cd.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
    cd.border = BORDER
    ws2.row_dimensions[lr].height = 30
    lr += 1

# 前提条件セクション
lr += 1
ws2.cell(row=lr, column=1, value="全体に共通する前提・制約(必読)").font = Font(bold=True, size=13, color=NAVY)
ws2.merge_cells(start_row=lr, start_column=1, end_row=lr, end_column=2)
ws2.row_dimensions[lr].height = 24
lr += 1

notes = [
    ("① ビジネスプロフィールAPIのアクセス承認",
     "投稿・口コミ・指標の『取得とGBPへの書き込み』は、すべてGoogleビジネスプロフィールAPIに依存する。"
     "利用にはGoogleへの申請と審査通過、OAuth認証設定、クォータ(回数)制限の管理が必要。"
     "承認前でも『生成』までは可能だが、GBPへの反映は手動またはブラウザ自動操作(不安定・規約リスク)に留まる。"),
    ("② 順位取得には公式APIが無い",
     "Googleはローカルパック/マップ順位の公式APIを提供していない。"
     "順位は検索者の現在地・検索履歴で個人化され『単一の正確な順位』は原理的に存在しない。"
     "定点観測する場合はグリッド計測の第三者ツール(有料)を使うのが現実的。"),
    ("③ 自社店舗か、代理店(クライアント店舗)か",
     "複数店舗(マルチロケーション)の管理は可能だが、各店舗オーナーのアカウント連携・権限付与が必要。"
     "代理店運用では、クライアントごとのアカウント連携の手間が初期コストになる。"),
    ("④ 生成物の品質・コンプライアンス確認",
     "投稿文・返信文・画像は自動生成できるが、薬機法/景表法/誤情報/炎上リスクの観点で、"
     "特に低評価対応・センシティブ業種は人の最終確認を運用に組み込むことを推奨。"),
    ("⑤ 段階的導入の推奨順",
     "ボトルネックの少ない順に: (1)生成系(投稿文・返信文) → (2)データ集計・レポート・通知 "
     "→ (3)GBPへの自動投稿/自動返信(API承認後) → (4)順位取得(第三者ツール検討)。"),
]
for title, body in notes:
    ct = ws2.cell(row=lr, column=1, value=title)
    ct.font = Font(bold=True, size=10, color="1F3864")
    ct.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)
    ct.fill = fill(GREY); ct.border = BORDER
    cb = ws2.cell(row=lr, column=2, value=body)
    cb.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
    cb.border = BORDER
    ws2.row_dimensions[lr].height = 60
    lr += 1

ws2.column_dimensions["A"].width = 30
ws2.column_dimensions["B"].width = 78

# ---- 保存 ---------------------------------------------------------------
out = "docs/MEO自動化_可否一覧.xlsx"
wb.save(out)
print("saved:", out)
