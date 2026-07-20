# ひらがな あそび 🌈

5歳児向けのひらがな学習アプリです。50音に加えて濁音・半濁音（が〜ぽ）にも対応しています。ブラウザだけで動く静的なWebアプリで、
サーバーもインストールも不要です。

**あそぶ → https://isayosh.github.io/hiragana-asobi/**
（GitHub Pages を有効にすると上のURLで公開されます）

## あそびかた

1. 50音表から すきな文字をタッチ
2. 文字の画面でできること
   - **かきじゅん** — 画ごとに色分けされた筆順アニメーション（番号つき）
   - **なぞりがき** — うすい文字の上を指やマウスでなぞって練習、🧽で消せる
   - **🔊 おと** — 文字の発音を読み上げ（ブラウザの音声合成を使用）
   - **ことばカード** — その文字を使ったことば（絵文字つき）。タッチすると読み上げ
3. 見た文字には50音表に ⭐ がつきます

## プライバシー

外部へのデータ送信は一切ありません。⭐の記録は端末内（localStorage）にのみ
保存され、発音もブラウザ内蔵の音声合成を使います。

## GitHub Pages での公開手順

リポジトリの **Settings → Pages** → Branch を `main`（フォルダは `/ (root)`）に
して Save。数分後に上記URLで公開されます。

## 技術メモ

- 依存ライブラリなし（HTML + CSS + JavaScript のみ、オフラインで動作）
- 発音は Web Speech API（`speechSynthesis`）を使用。日本語音声が
  入っていない環境では音が出ません（iOS/Android/主要PCブラウザは標準対応）
- 筆順データは `strokes.js` に埋め込み。[KanjiVG](http://kanjivg.tagaini.net)
  （Ulrich Apel 氏、[CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)）
  のSVGから抽出したものです

## ライセンス

- 筆順データ（`strokes.js`）: KanjiVG 由来のため CC BY-SA 3.0
- それ以外のコード: MIT License
