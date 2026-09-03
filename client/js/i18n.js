/* ============================================================
   MLB STEM League — Language toggle (English default ⇄ 日本語)
   Single-file add-on. No other files need to change.
   ============================================================ */
(function () {
  "use strict";

  const STORE_KEY = "mlbLang";
  let lang = localStorage.getItem(STORE_KEY) || "en"; // default English

  const originals = new WeakMap(); // node -> English source text
  const lastOut = new WeakMap();   // node -> Japanese text WE wrote (loop guard)

  /* ---------- Player names (official kanji for JP players) ---------- */
  const PLAYERS = {
    "William Contreras": "ウィリアム・コントレラス",
    "Seiya Suzuki": "鈴木誠也",
    "Jacob Wilson": "ジェイコブ・ウィルソン",
    "Isaac Collins": "アイザック・コリンズ",
    "Corbin Carroll": "コービン・キャロル",
    "Mike Trout": "マイク・トラウト",
    "Hunter Goodman": "ハンター・グッドマン",
    "Zach Neto": "ザック・ネト",
    "Jazz Chisholm Jr.": "ジャズ・チザム・ジュニア",
    "Mookie Betts": "ムーキー・ベッツ",
    "Julio Rodriguez": "フリオ・ロドリゲス",
    "Salvador Perez": "サルバドール・ペレス",
    "Ketel Marte": "ケテル・マーテ",
    "Curtis Mead": "カーティス・ミード",
    "Kyle Stowers": "カイル・ストーワーズ",
    "Adley Rutschman": "アドリー・ラッチマン",
    "CJ Abrams": "CJ・エイブラムス",
    "Matt Olson": "マット・オルソン",
    "Isaac Paredes": "アイザック・パレデス",
    "Ronald Acuna Jr.": "ロナルド・アクーニャ・ジュニア",
    "Alejandro Kirk": "アレハンドロ・カーク",
    "Marcus Semien": "マーカス・シミエン",
    "Elly De La Cruz": "エリー・デラクルーズ",
    "Isiah Kiner-Falefa": "アイザイア・カイナーファレファ",
    "Bryce Harper": "ブライス・ハーパー",
    "Willson Contreras": "ウィルソン・コントレラス",
    "Steven Kwan": "スティーブン・クワン",
    "James Wood": "ジェームズ・ウッド",
    "Logan O'Hoppe": "ローガン・オホッピー",
    "Josh Jung": "ジョシュ・ジョン",
    "Alex Call": "アレックス・コール",
    "Cal Raleigh": "カル・ローリー",
    "Vladimir Guerrero Jr.": "ブラディミール・ゲレーロ・ジュニア",
    "Junior Caminero": "ジュニア・カミネロ",
    "Pete Crow-Armstrong": "ピート・クロウ＝アームストロング",
    "Pete Alonso": "ピート・アロンソ",
    "Corey Seager": "コーリー・シーガー",
    "Edmundo Sosa": "エドムンド・ソーサ",
    "Roman Anthony": "ローマン・アンソニー",
    "Aaron Judge": "アーロン・ジャッジ",
    "Jackson Chourio": "ジャクソン・チョウリオ",
    "Willy Adames": "ウィリー・アダメス",
    "Rafael Devers": "ラファエル・デバース",
    "Freddie Freeman": "フレディ・フリーマン",
    "Michael Wacha": "マイケル・ワカ",
    "Yoshinobu Yamamoto": "山本由伸",
    "Ryan Walker": "ライアン・ウォーカー",
    "Michael King": "マイケル・キング",
    "Shota Imanaga": "今永昇太",
    "Bryan Woo": "ブライアン・ウー",
    "Pablo Lopez": "パブロ・ロペス",
    "Sean Manaea": "ショーン・マナイア",
    "Yusei Kikuchi": "菊池雄星",
    "Paul Skenes": "ポール・スキーンズ",
    "Jesus Luzardo": "ヘスス・ルザード",
    "Aaron Nola": "アーロン・ノラ",
    "Yu Darvish": "ダルビッシュ有",
    "Jonathan Loaisiga": "ジョナサン・ロアイシガ",
    "Yuki Matsui": "松井裕樹",
    "Jacob deGrom": "ジェイコブ・デグロム",
    "Jacob Misiorowski": "ジェイコブ・ミシオロウスキー",
    "Tarik Skubal": "タリク・スクーバル"
  };

  /* ---------- UI / gameplay phrases ---------- */
  const PHRASES = {
    "Online Multiplayer": "オンライン対戦",
    "Still connecting to server... Please wait a moment and try again.":
      "まだサーバーに接続中です…少し待ってからもう一度お試しください。",
    "Connecting to server... (free tier may take up to 60s)":
      "サーバーに接続中…（無料プランでは最大60秒かかることがあります）",
    "Reconnecting to server...": "サーバーに再接続中…",
    "Connecting to server...": "サーバーに接続中…",
    "⚾ Full Game": "⚾ フルゲーム",
    "💣 Home Run Derby": "💣 ホームランダービー",
    "Home Run Derby": "ホームランダービー",
    "— or join a room —": "— または部屋に参加 —",
    "Enter a 4-character room code": "4文字の部屋コードを入力してください",
    "Could not join: ": "参加できませんでした: ",
    "Join": "参加",
    "Room Created": "部屋を作成しました",
    "Share this code with your opponent:": "このコードを対戦相手に共有してください:",
    "Waiting for opponent to join...": "対戦相手の参加を待っています…",
    "Waiting for opponent to spin...": "対戦相手のスピンを待っています…",
    "Waiting for opponent to roll...": "対戦相手のロールを待っています…",
    "Waiting for opponent to apply...": "対戦相手が結果を適用するのを待っています…",
    "Waiting for opponent to swing...": "対戦相手のスイングを待っています…",
    "Waiting for host to configure...": "ホストの設定を待っています…",
    "Waiting for opponent...": "対戦相手を待っています…",
    "Player Draft": "選手ドラフト",
    "Batters": "バッター",
    "Pitchers": "ピッチャー",
    "Set Lineups →": "打順を設定 →",
    "Position Filled": "ポジション充足",
    "Multiply (×)": "掛ける（×）",
    "Multiply": "掛ける",
    "Add (+)": "足す（+）",
    "'s pick": "のピック",
    " (YOU)": "（あなた）",
    " (You)": "（あなた）",
    "Set Batting Orders": "打順を設定",
    " — Batting Order": " の打順",
    "Starting Pitcher:": "先発ピッチャー:",
    "Ready! ⚾": "準備完了！ ⚾",
    "How many batters per team?": "1チームのバッター数は？",
    "batters each": "人ずつ",
    "Each batter gets 20 swings. Homer on your last swing? Keep going until you miss!":
      "各バッターは20スイング。最後のスイングでホームランなら、ミスするまで続行！",
    "Start Draft →": "ドラフト開始 →",
    "💣 Derby Draft": "💣 ダービードラフト",
    "Offense": "オフェンス（攻撃）",
    "Defense": "ディフェンス（守備）",
    "🎰 Spin!": "🎰 スピン！",
    "Spin result: ": "スピン結果: ",
    "Roll × Multiply": "ロール ×（掛ける）",
    "Roll + Add": "ロール +（足す）",
    "Defense Turn →": "守備のターン →",
    "Apply Result": "結果を適用",
    "Match! Choose shift direction:": "一致！ シフト方向を選択:",
    "Match! Opponent is choosing shift...": "一致！ 対戦相手がシフトを選択中…",
    "No match — no shift available": "一致なし — シフトは使えません",
    "Keep ": "維持 ",
    "Result: ": "結果: ",
    "Game Over!": "ゲーム終了！",
    "New Game": "新しいゲーム",
    "Home Run": "ホームラン",
    "Single": "シングル（単打）",
    "Double": "ツーベース（二塁打）",
    "Triple": "スリーベース（三塁打）",
    "Walk": "フォアボール（四球）",
    "Hit By Pitch": "デッドボール（死球）",
    "Strikeout": "三振",
    "Fly Out": "フライアウト",
    "Ground Out": "ゴロアウト",
    "Outs": "アウト",
    "TAP TO PLAY": "タップして使用",
    "BAT": "打撃",
    "PITCH": "投球",
    "Stolen Base": "盗塁",
    "Double Steal": "ダブルスチール",
    "Stealing Home": "ホームスチール",
    "Safe on Error": "エラーで出塁",
    "Sacrifice Bunt": "送りバント",
    "Suicide Squeeze": "スクイズ",
    "Catcher's Interference": "キャッチャー妨害",
    "Passed Ball": "パスボール",
    "Wild Pitch": "ワイルドピッチ（暴投）",
    "Pitcher Balk": "ボーク",
    "Intentional Walk": "敬遠",
    "Double Play": "ダブルプレー（併殺）",
    "Force Out": "フォースアウト",
    "Triple Play": "トリプルプレー（三重殺）",
    "Caught Stealing": "盗塁死",
    "Outfield Assist": "外野からの補殺",
    "Pitcher Pick-Off": "ピックオフ（牽制アウト）",
    "Runners on 1st AND 2nd both advance": "1塁と2塁のランナーが両方進塁",
    "Runner on 1st/2nd advances one base": "1塁/2塁のランナーが1つ進塁",
    "Runner on 3rd scores": "3塁のランナーが生還",
    "On GO/FO: batter to 1st, runners advance 1":
      "ゴロ/フライアウト時: バッターが1塁へ、ランナーは1つ進塁",
    "<2 outs, runner on 1st: batter out, runners advance":
      "2アウト未満・1塁にランナー: バッターアウト、ランナー進塁",
    "<2 outs, runner on 3rd: batter out, runner scores":
      "2アウト未満・3塁にランナー: バッターアウト、ランナー生還",
    "Batter to 1st, forced runners advance": "バッターが1塁へ、押し出しでランナー進塁",
    "On SO with 1st open: batter to 1st": "三振時に1塁が空いていれば: バッターが1塁へ",
    "Runner on 1st, <2 outs, GO: both out": "1塁にランナー・2アウト未満・ゴロ: 両者アウト",
    "Runner on 1st + GO: lead runner out": "1塁にランナー＋ゴロ: 先頭ランナーアウト",
    "1st+2nd occupied, 0 outs, GO: all three out":
      "1塁2塁が埋まる・0アウト・ゴロ: 3人ともアウト",
    "After stolen base: stealing runner is out": "盗塁後: 盗塁したランナーがアウト",
    "Runner on 3rd, <2 outs, FO: runner out": "3塁にランナー・2アウト未満・フライ: ランナーアウト",
    "Runner on 1st/2nd: lead runner out": "1塁/2塁のランナー: 先頭ランナーアウト",
    "BONUS SWINGS": "ボーナススイング",
    "Swings Remaining": "残りスイング",
    "♾️ BONUS": "♾️ ボーナス",
    "Homer on last swing! Keep going until you miss!":
      "最後のスイングでホームラン！ ミスするまで続行！",
    "⚾ Swing!": "⚾ スイング！",
    " Results": " の結果",
    "Derby HR": "ダービー本塁打",
    "Turn complete!": "ターン完了！",
    "💣 HOME RUN!": "💣 ホームラン！",
    "HOME RUN!": "ホームラン！",
    "HOME RUN": "ホームラン",
    "NO HOMER": "ノーホーマー",
    "No Homer": "ノーホーマー",
    "🏆 Derby Over!": "🏆 ダービー終了！",
    "Tied on HRs — won by total distance!": "本塁打数が同点 — 合計飛距離で勝利！",
    "It's a tie!": "引き分け！",
    "You win!": "あなたの勝ち！",
    "You lose.": "あなたの負け。",
    " wins!": "の勝ち！",
    "Opponent forfeited. ": "対戦相手が棄権しました。 ",
    "Max Dist": "最長距離",
    "Total Dist": "合計距離",
    "Batter": "バッター",
    "HRs": "本塁打",
    "Pitcher": "ピッチャー"
  };

  const LITERALS = Object.entries(Object.assign({}, PLAYERS, PHRASES))
    .sort((a, b) => b[0].length - a[0].length);

  const REGEX_RULES = [
    { re: /\b(Top|Bottom) of (\d+)\b/g, rep: (m, h, n) => n + "回" + (h === "Top" ? "表" : "裏") },
    { re: /—\s*([^—]+?)\s+batting\b/g, rep: (m, t) => "— " + t + " の攻撃" },
    { re: /Batter (\d+) of (\d+)/g, rep: (m, a, b) => "バッター " + a + " / " + b },
    { re: /(\d+) picks left in block/g, rep: (m, n) => "ブロック残り" + n + "ピック" },
    { re: /(\d+)\s*\/\s*(\d+) batters picked/g, rep: (m, a, b) => a + " / " + b + " バッター選択済み" },
    { re: /\+(\d+) RUNS?!/g, rep: (m, n) => "+" + n + " 得点！" },
    { re: /(\d+)\s+HRs?\b/g, rep: (m, n) => n + " 本塁打" },
    { re: /(\d+) ft total/g, rep: (m, n) => "合計 " + n + " フィート" },
    { re: /\(max (\d+)\)/g, rep: (m, n) => "(最長 " + n + ")" },
    { re: /(\d+) ft\b/g, rep: (m, n) => n + " フィート" },
    { re: /\bALL\b/g, rep: () => "すべて" },
    { re: /\bBA\b/g, rep: () => "打率" },
    { re: /\bOBP\b/g, rep: () => "出塁率" },
    { re: /\bSLG\b/g, rep: () => "長打率" }
  ];

  function toJa(str) {
    let s = str;
    for (const r of REGEX_RULES) s = s.replace(r.re, r.rep);
    for (const [en, ja] of LITERALS) {
      if (s.indexOf(en) !== -1) s = s.split(en).join(ja);
    }
    return s;
  }

  const SKIP_TAGS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, CANVAS: 1 };

  function skip(node) {
    const p = node.parentNode;
    if (!p || p.nodeType !== 1) return true;
    if (SKIP_TAGS[p.tagName]) return true;
    if (p.closest && p.closest("#mlb-lang-btn")) return true;
    return false;
  }

  function processTextNode(node) {
    const cur = node.nodeValue;
    if (!cur || !cur.trim() || skip(node)) return;
    if (lang === "ja") {
      if (lastOut.get(node) === cur) return;
      originals.set(node, cur);
      const t = toJa(cur);
      if (t !== cur) { node.nodeValue = t; lastOut.set(node, t); }
      else { lastOut.set(node, cur); }
    } else {
      const orig = originals.get(node);
      if (orig !== undefined && node.nodeValue !== orig) node.nodeValue = orig;
      lastOut.delete(node);
    }
  }

  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { processTextNode(root); return; }
    if (root.nodeType !== 1 || SKIP_TAGS[root.tagName]) return;
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const batch = [];
    let n;
    while ((n = tw.nextNode())) batch.push(n);
    batch.forEach(processTextNode);
  }

  function applyAttrs() {
    const ja = lang === "ja";
    document.title = ja ? "MLB STEM リーグ — オンライン" : "MLB STEM League — Online";
    const ph = [
      ["t1name", "Your team name", "あなたのチーム名"],
      ["t2name", "Your team name", "あなたのチーム名"],
      ["roomCodeInput", "CODE", "コード"]
    ];
    ph.forEach(([id, en, jp]) => {
      const el = document.getElementById(id);
      if (el) el.setAttribute("placeholder", ja ? jp : en);
    });
  }

  const origFillText = CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText = function (text) {
    if (lang === "ja" && typeof text === "string") arguments[0] = toJa(text);
    return origFillText.apply(this, arguments);
  };

  const origAlert = window.alert;
  window.alert = function (msg) {
    return origAlert.call(window, lang === "ja" && typeof msg === "string" ? toJa(msg) : msg);
  };

  function rerender() {
    try {
      if (typeof clientState !== "undefined") {
        if (typeof renderGamePhase === "function" && clientState.gameState) renderGamePhase();
        if (typeof renderDerby === "function" && clientState.derbyState) renderDerby();
        if (typeof renderDerbyDraft === "function" && clientState.derbyDraftData) renderDerbyDraft();
        if (typeof updateDraftPool === "function" && clientState.draftState) updateDraftPool();
        if (typeof renderLineups === "function") renderLineups();
      }
    } catch (e) { /* non-fatal */ }
  }

  function apply() {
    walk(document.body);
    applyAttrs();
    rerender();
    walk(document.body);
    const btn = document.getElementById("mlb-lang-btn");
    if (btn) btn.textContent = lang === "ja" ? "🌐 English" : "🌐 日本語";
  }

  function toggle() {
    lang = lang === "ja" ? "en" : "ja";
    localStorage.setItem(STORE_KEY, lang);
    apply();
  }

  function boot() {
    const btn = document.createElement("button");
    btn.id = "mlb-lang-btn";
    btn.type = "button";
    btn.textContent = lang === "ja" ? "🌐 English" : "🌐 日本語";
    btn.setAttribute("data-no-i18n", "1");
    btn.style.cssText =
      "position:fixed;top:10px;right:10px;z-index:99999;padding:7px 12px;" +
      "font-size:13px;font-weight:700;border-radius:20px;border:1px solid #2a3a55;" +
      "background:#e8b93c;color:#111;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.4);";
    btn.addEventListener("click", toggle);
    document.body.appendChild(btn);

    const obs = new MutationObserver((muts) => {
      if (lang !== "ja") return;
      for (const m of muts) {
        if (m.type === "characterData") processTextNode(m.target);
        else if (m.type === "childList") m.addedNodes.forEach((nd) => walk(nd));
      }
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });

    if (lang === "ja") apply();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
