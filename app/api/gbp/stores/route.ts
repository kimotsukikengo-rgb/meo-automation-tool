import { NextRequest, NextResponse } from "next/server";
import { getTokenStore } from "@/lib/gbp/token-store";

/** 連携店舗の一覧（リフレッシュトークンは含めない） */
export async function GET() {
  try {
    const stores = await getTokenStore().listStores();
    return NextResponse.json({ stores });
  } catch (err) {
    console.error("[gbp/stores] 一覧取得に失敗:", err);
    return NextResponse.json(
      { error: "連携店舗の取得に失敗しました" },
      { status: 500 },
    );
  }
}

/** 連携解除（?id=...） */
export async function DELETE(request: NextRequest) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id が必要です" }, { status: 400 });
  }
  try {
    await getTokenStore().delete(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[gbp/stores] 削除に失敗:", err);
    return NextResponse.json(
      { error: "連携解除に失敗しました" },
      { status: 500 },
    );
  }
}
