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
      model: "claude-opus-4-6",
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

    // JSONを抽出
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "JANコードを抽出できませんでした" }, { status: 400 });
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "処理中にエラーが発生しました" }, { status: 500 });
  }
}
