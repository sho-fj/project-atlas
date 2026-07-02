"use client";

import ReactMarkdown from "react-markdown";
import { useState } from "react";
import Header from "@/components/Header";

export default function Home() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  async function createPlan() {
    setLoading(true);
    setResult("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
        }),
      });

      const data = await res.json();
      setResult(data.result);
    } catch {
      setResult("エラーが発生しました。");
    }

    setLoading(false);
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-zinc-100">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="mb-10 text-center">
            <h1 className="text-5xl font-bold tracking-tight">
              ATLAS
            </h1>

            <p className="mt-4 text-xl text-zinc-600">
              あなた専属のAI共同創業者
            </p>

            <p className="mt-2 text-zinc-500">
              利益を最優先に、90日以内の初収益を設計します。
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl bg-white p-8 shadow-lg">
              <h2 className="mb-6 text-2xl font-bold">
                あなたについて教えてください
              </h2>

              <div className="space-y-5">
                <textarea
                  className="min-h-[220px] w-full rounded-xl border p-4"
                  placeholder={`例）

会社員です。
副業経験はありません。

毎日2時間使えます。

月5万円の副収入が欲しいです。

AIに興味があります。`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />

                <button
                  onClick={createPlan}
                  disabled={loading}
                  className="w-full rounded-xl bg-black p-4 text-lg font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
                >
                  {loading ? "ATLASが分析中..." : "ATLASに相談する"}
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-8 shadow-lg">
              <h2 className="mb-6 text-2xl font-bold">
                AI分析結果
              </h2>

              {result ? (
                <div className="rounded-xl bg-zinc-100 p-6">
  <article className="prose prose-zinc max-w-none">
    <ReactMarkdown>{result}</ReactMarkdown>
  </article>
</div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-zinc-300 p-10 text-center text-zinc-500">
                  <div className="mb-4 text-5xl">🚀</div>

                  <p>
                    入力するとATLASが
                    <br />
                    あなた専用の収益化プランを作成します。
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}