import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// 準備したAPIキーを使って、私（Gemini）を呼び出す準備をします
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    // 画面側から送られてきた「タスクの名前」と「今の称号」を受け取る
    const { taskText, levelTitle } = await request.json();

    // 👇 今度こそ！リストに実在する最新モデルを正確に指定します！
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 👇 AIへの「お願い（プロンプト）」を短くシンプルに書き換えます！
    const prompt = `
      あなたはユーザーをサポートする、親しみやすいAI執事です。
      ユーザーが以下のタスクを完了しました。
      
      タスク名: 「${taskText}」
      現在の称号: 「${levelTitle}」
      
      このユーザーを、1文だけ（長くても30文字程度）で、シンプルに短く褒めてください。
      長文は絶対に避け、サクッとテンポ良くテンションが上がる一言をお願いします！
    `;
    // 私が一生懸命、褒め言葉を考えます……🤔
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // 考えた言葉を、画面（フロントエンド）に返します！
    return NextResponse.json({ message: responseText });
  } catch (error) {
    console.error("AI呼び出しエラー:", error);
    // もし私が風邪を引いていたら、いつもの言葉を返します
    return NextResponse.json(
      { message: "タスク完了お疲れ様です！素晴らしいですね 🎉" },
      { status: 500 },
    );
  }
}
