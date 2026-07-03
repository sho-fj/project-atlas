import { ArrowRight, Compass, Rocket, Sparkles, TrendingUp } from "lucide-react";

type IntentCard = {
  id: string;
  title: string;
  description: string;
  icon: typeof Sparkles;
};

type WelcomeScreenProps = {
  onStart: (choice: string) => void;
};

const intents: IntentCard[] = [
  {
    id: "revenue",
    title: "収益を作りたい",
    description: "小さく始めて、まずは売れる形にしたい",
    icon: TrendingUp,
  },
  {
    id: "shape",
    title: "価値を形にしたい",
    description: "自分の経験やスキルをサービスに落とし込みたい",
    icon: Rocket,
  },
  {
    id: "direction",
    title: "方向性を固めたい",
    description: "何から始めればよいか、相談しながら進めたい",
    icon: Compass,
  },
  {
    id: "momentum",
    title: "今日から動きたい",
    description: "今すぐ一歩踏み出せる計画が欲しい",
    icon: Sparkles,
  },
];

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <section className="mx-auto flex max-w-5xl flex-col items-center text-center">
      <div className="atlas-badge mb-8 gap-2 px-4 py-2">
        <Sparkles className="h-4 w-4" />
        <span>毎日相談したくなる共同創業者</span>
      </div>

      <div className="atlas-card max-w-3xl p-8 sm:p-10">
        <p className="atlas-caption">
          Atlasへようこそ
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-normal text-atlas-primary sm:text-5xl">
          今日は何を前に進めたいですか？
        </h1>
        <p className="mt-4 text-lg font-semibold leading-8 text-atlas-text-muted">
          あなたの状況に合わせて、Atlasが一緒に方向性を整えます。
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {intents.map((intent) => {
            const Icon = intent.icon;

            return (
              <button
                key={intent.id}
                type="button"
                onClick={() => onStart(intent.title)}
                className="group atlas-surface p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-atlas-accent/40 hover:bg-white"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-atlas-border bg-white">
                    <Icon className="h-5 w-5 text-atlas-primary" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-atlas-accent transition group-hover:translate-x-0.5" />
                </div>
                <h2 className="mt-5 text-lg font-black text-atlas-primary">{intent.title}</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-atlas-text-muted">{intent.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="atlas-card mt-6 w-full max-w-3xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="atlas-caption">Progress</p>
            <h3 className="mt-2 text-xl font-black text-atlas-primary">今週</h3>
          </div>
          <div className="atlas-badge">
            60%
          </div>
        </div>

        <div className="atlas-progress-track mt-4">
          <div className="atlas-progress-fill w-[60%]" />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="atlas-surface p-4">
            <p className="text-sm text-atlas-text-muted">連続ログイン</p>
            <p className="mt-2 text-2xl font-black text-atlas-primary">3日</p>
          </div>
          <div className="atlas-surface p-4">
            <p className="text-sm text-atlas-text-muted">累計ミッション</p>
            <p className="mt-2 text-2xl font-black text-atlas-primary">8件</p>
          </div>
          <div className="atlas-surface p-4">
            <p className="text-sm text-atlas-text-muted">次の一歩</p>
            <p className="mt-2 text-sm font-bold text-atlas-primary">Threadsを投稿</p>
          </div>
        </div>
      </div>
    </section>
  );
}
