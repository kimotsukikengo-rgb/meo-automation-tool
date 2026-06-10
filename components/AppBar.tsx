import Link from "next/link";
import "./ui.css";

export type ModuleKey = "post" | "review" | "report" | "rank";

interface ModuleDef {
  key: ModuleKey;
  label: string;
  href: string;
  soon?: boolean;
}

const MODULES: ModuleDef[] = [
  { key: "post", label: "投稿文生成", href: "/" },
  { key: "review", label: "口コミ返信", href: "/reviews" },
  { key: "report", label: "レポート", href: "/reports" },
  { key: "rank", label: "順位管理", href: "#", soon: true },
];

export default function AppBar({ active }: { active: ModuleKey }) {
  return (
    <header className="appbar">
      <Link className="brand" href="/">
        <span className="brand-mark" aria-hidden>
          M
        </span>
        <span>
          MEO Studio
          <br />
          <span className="brand-sub">運用自動化ツール（試作）</span>
        </span>
      </Link>
      <nav className="modnav" aria-label="モジュール">
        {MODULES.map((m) =>
          m.soon ? (
            <span
              key={m.key}
              className="modnav-item"
              data-active={false}
              data-soon={true}
            >
              {m.label}
            </span>
          ) : (
            <Link
              key={m.key}
              href={m.href}
              className="modnav-item"
              data-active={m.key === active}
              data-soon={false}
            >
              {m.label}
            </Link>
          ),
        )}
      </nav>
    </header>
  );
}
