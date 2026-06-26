import { spawn } from "node:child_process";
import { tmpdir } from "node:os";

/**
 * ローカルにインストール済みの Claude Code CLI を headless（-p）で呼び出し、
 * 既存のログイン認証（Opus 4.8）をそのまま使って生成する。
 * APIキー不要。ローカル運用専用。
 */

export const LOCAL_MODEL = process.env.MEO_LOCAL_MODEL || "claude-opus-4-8";
const CLAUDE_BIN = process.env.CLAUDE_CLI_PATH || "claude";
// Opus 4.8 で3パターンを headless 生成すると単一呼び出しで120秒を超えることがあり、
// 既定120秒だとタイムアウト→モックに落ちていた。実測（生成+採点で約141秒、
// 自動修正パスが走るとさらに延びる）に基づき、単一呼び出しが確実に収まる値にする。
const TIMEOUT_MS = Number(process.env.MEO_LOCAL_TIMEOUT_MS || 300000);

/** ローカルClaude生成を使うか（既定:ON。無効化は MEO_LOCAL_CLAUDE=off） */
export function isLocalClaudeEnabled(): boolean {
  return process.env.MEO_LOCAL_CLAUDE !== "off";
}

export interface GenerateOptions {
  /**
   * headless で許可するツール。既定では未指定（ツール無効）。
   * 添付画像を読み込ませる場合は ["Read"] を渡す。
   */
  allowedTools?: string[];
  /** モデルの上書き（未指定なら LOCAL_MODEL）。採点はHaiku等に切り替える用途。 */
  model?: string;
}

/**
 * system / user プロンプトを渡して、Claudeの応答テキストを返す。
 * 失敗時は例外を投げる（呼び出し側でモックにフォールバックする）。
 */
export function generateWithClaude(
  system: string,
  user: string,
  options: GenerateOptions = {},
): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = [
      "-p",
      "--model",
      options.model || LOCAL_MODEL,
      "--output-format",
      "json",
      // Claude Code 既定のコーディング用システムプロンプトを置き換え、
      // MEO用途に専念させる（ツール使用や余計な前置きを抑制）
      "--system-prompt",
      system,
    ];

    // 添付画像の読み込みなど、必要なときだけツールを許可する
    if (options.allowedTools && options.allowedTools.length > 0) {
      args.push("--allowedTools", options.allowedTools.join(","));
    }

    // cwd を tmp にして、プロジェクトの CLAUDE.md / settings を読み込ませない
    const child = spawn(CLAUDE_BIN, args, {
      cwd: tmpdir(),
      stdio: ["pipe", "pipe", "pipe"],
    });

    let out = "";
    let err = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("claude CLI timeout"));
    }, TIMEOUT_MS);

    child.stdout.on("data", (d) => (out += d.toString()));
    child.stderr.on("data", (d) => (err += d.toString()));
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(`claude CLI exited ${code}: ${err.slice(0, 300)}`));
        return;
      }
      try {
        const env = JSON.parse(out);
        if (env.is_error) {
          reject(new Error(env.result || "claude CLI returned error"));
          return;
        }
        resolve(typeof env.result === "string" ? env.result : "");
      } catch {
        reject(new Error("claude CLI 出力のパースに失敗しました"));
      }
    });

    child.stdin.write(user);
    child.stdin.end();
  });
}

/**
 * モデル出力からJSON部分を取り出してパースする。
 * コードフェンスや前後の文章が混ざっても拾えるようにする。
 */
export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("JSONが見つかりません");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}
