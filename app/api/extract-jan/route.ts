import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({ error: "画像が見つかりません" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mediaType = file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: "text",
              text: `この画像に含まれているJANコード（バーコード番号）をすべて抽出してください。
JANコードは通常8桁または13桁の数字です。
商品名と対応するJANコードがある場合は、セットで返してください。

以下のJSON形式のみで返答してください（説明文は不要）：
{
  "items": [
    { "name": "商品名（あれば）", "jan": "JANコード" },
    ...
  ]
}

商品名が不明な場合は空文字列にしてください。`,
            },
          ],
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    // コードブロックやマークダウンを除去してJSONを抽出
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "JANコードを抽出できませんでした" }, { status: 400 });
    }

    let result;
    try {
      result = JSON.parse(jsonMatch[0]);
    } catch {
      // JSONが壊れている場合、itemsの中身だけ正規表現で取り出す
      const items: { name: string; jan: string }[] = [];
      const itemMatches = jsonMatch[0].matchAll(/"jan"\s*:\s*"(\d+)"[^}]*"name"\s*:\s*"([^"]*)"|"name"\s*:\s*"([^"]*)"[^}]*"jan"\s*:\s*"(\d+)"/g);
      for (const m of itemMatches) {
        const jan = m[1] || m[4];
        const name = m[2] || m[3] || "";
        if (jan) items.push({ name, jan });
      }
      if (items.length === 0) {
        return NextResponse.json({ error: "JANコードを抽出できませんでした" }, { status: 400 });
      }
      result = { items };
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "処理中にエラーが発生しました" }, { status: 500 });
  }
}
