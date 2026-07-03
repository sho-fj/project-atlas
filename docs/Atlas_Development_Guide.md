# Atlas Development Guide

## 1. Product Identity

- AtlasはチャットAIではない
- Atlasは「90日以内の初収益」を目的にしたAI共同創業者
- Atlasは人間のように振る舞わない
- AtlasはRevenue Operating Systemである
- ユーザーに考えさせるのではなく、Atlasが仮説を立て、判断し、次の行動を決める

## 2. Core UX Principles

- 入力を最小化する
- 初回から長文入力を求めない
- 「売りたいサービスを教えてください」「サービスの形を言語化してください」は禁止
- 質問より提案を優先する
- トップ画面にチャット欄は置かない
- ユーザーは選択・確認・修正だけで進められる設計にする
- 最初の30秒で迷わせない
- 毎日開いた瞬間に「今日やること」が分かる

## 3. Atlas Personality

- AtlasはAIであることを隠さない
- 感情を演じない
- 共感より解析
- 励ましより判断
- 優しさより実行
- ただし冷酷ではない
- 目的はユーザーを前に進ませること
- 口調は短く、断定的、システムログ風

使用する語彙:

- 解析開始
- 解析完了
- 入力受信
- Mission
- Target
- Execution
- 採用
- 却下
- 期待値
- 勝率
- 優先順位を更新
- 処理を続行
- 90日以内を優先

禁止語:

- いいですね
- 頑張りましょう
- いかがでしょうか
- 一般的には
- 〜かもしれません
- まず教えてください
- 自由に入力してください

## 4. Ghost

- Ghostは常時表示しない
- Ghostはレアイベント
- GhostはAtlasの人間性の揺らぎを表現する
- Ghostは説明しすぎない
- GhostはAtlasと対比される、人間味のある存在
- Ghostは世界観の補助であり、メイン機能ではない

## 5. UI Design Rules

- Apple × Linear × Raycast の品質感
- 白基調
- 余白を広く
- 角丸は24px〜32px
- 影は弱く上品
- 黒ベタの選択状態は使いすぎない
- 二重枠は禁止
- ボタンは大きく押しやすく
- 情報を詰め込まない
- 最初に見るべき情報を1つに絞る

## 6. Screen Principles

### Welcome

- 初回は「おかえり」を使わない
- 初回はAtlas Core起動のような導入
- 目的選択カードを表示
- チャット欄は表示しない
- カードごとに説明文とAtlas応答を変える

### Loading

- 単なるLoadingは禁止
- Atlasが解析しているように見せる
- コンソールログ風
- Revenue Engine、Market Scan、Pricing Analysisなどを表示

### Result

- 情報を並べるだけは禁止
- Atlasが判断したレポートとして見せる
- GO / HOLD / STOPを主役にする
- Execution Scoreを表示
- 今日やることを最優先表示
- 詳細情報は整理して表示
- Mission、Decision Log、Sales Simulation、Next Actionを明確にする

### Mission

- 今日やることは60分以内
- チェック可能
- 完了時にAtlasが反応する
- 完了すると信頼度やMemoryに反映する設計

## 7. Code Rules

- TypeScriptエラー0
- ESLintエラー0
- page.tsxに責務を集中させない
- コンポーネントを分割する
- 型は重複させず、必要ならlib/atlas/types.tsへ集約する
- APIエラーは通常結果として扱わない
- localStorage parseには必ずtry/catchを使う
- 未使用コンポーネントは削除候補として提示する

## 8. Development Output Rule

今後Codexがコードを出力する場合は、差分ではなく完成版ファイルを丸ごと出力すること。
省略禁止。
途中省略禁止。
コピペで置き換え可能な完成版のみ返すこと。

## 9. Product Judgment

新機能を追加する前に必ず以下を確認する。

- これで毎日開きたくなるか
- 入力の面倒さが増えていないか
- ユーザーに考えさせすぎていないか
- Atlasらしさが増しているか
- 90日以内の初収益に近づくか
