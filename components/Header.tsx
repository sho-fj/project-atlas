export default function Header() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            ATLAS
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            あなた専属のAI共同創業者
          </p>
        </div>

        <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm">
          Beta
        </span>
      </div>
    </header>
  );
}