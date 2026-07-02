"use client";

import { useState } from "react";

export default function Home() {
  const [goal, setGoal] = useState("");
  const [skill, setSkill] = useState("");
  const [time, setTime] = useState("");
  const [interest, setInterest] = useState("");

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
          goal,
          skill,
          time,
          interest,
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
    <main className="min-h-screen bg-zinc-100 p-8">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-xl">

        <h1 className="text-4xl font-bold">
          🚀 Project Atlas
        </h1>

        <p className="mt-2 text-zinc-600">
          AIが90日以内の収益化プランを作成します。
        </p>

        <div className="mt-8 space-y-4">

          <input
            className="w-full rounded-lg border p-3"
            placeholder="目標収益（例：月5万円）"
            value={goal}
            onChange={(e)=>setGoal(e.target.value)}
          />

          <input
            className="w-full rounded-lg border p-3"
            placeholder="得意なこと"
            value={skill}
            onChange={(e)=>setSkill(e.target.value)}
          />

          <input
            className="w-full rounded-lg border p-3"
            placeholder="使える時間"
            value={time}
            onChange={(e)=>setTime(e.target.value)}
          />

          <input
            className="w-full rounded-lg border p-3"
            placeholder="興味ジャンル"
            value={interest}
            onChange={(e)=>setInterest(e.target.value)}
          />

          <button
            onClick={createPlan}
            disabled={loading}
            className="w-full rounded-lg bg-black p-3 text-white"
          >
            {loading ? "AIが考えています..." : "収益プランを作成"}
          </button>

        </div>

        {result && (
          <div className="mt-8 whitespace-pre-wrap rounded-xl bg-zinc-100 p-6">
            {result}
          </div>
        )}

      </div>
    </main>
  );
}