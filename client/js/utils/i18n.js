// === Simple i18n engine: English <-> Japanese, English default ===
let LANG = (typeof localStorage !== 'undefined' && localStorage.getItem('lang')) || 'en';

const I18N = {
  // --- static (index.html) ---
  title_game:      {en:"MLB STEM League — Online", ja:"MLB STEMリーグ — オンライン"},
  brand:           {en:"MLB STEM League", ja:"MLB STEMリーグ"},
  subtitle_online: {en:"Online Multiplayer", ja:"オンライン対戦"},
  ph_teamname:     {en:"Your team name", ja:"チーム名を入力"},
  connecting:      {en:"Connecting to server...", ja:"サーバーに接続中..."},
  btn_full_game:   {en:"⚾ Full Game", ja:"⚾ フルゲーム"},
  btn_derby:       {en:"💣 Home Run Derby", ja:"💣 ホームランダービー"},
  or_join:         {en:"— or join a room —", ja:"— または部屋に参加 —"},
  ph_code:         {en:"CODE", ja:"コード"},
  btn_join:        {en:"Join", ja:"参加"},
  room_created:    {en:"Room Created", ja:"部屋を作成しました"},
  share_code:      {en:"Share this code with your opponent:", ja:"このコードを対戦相手に共有してください："},
  waiting_join:    {en:"Waiting for opponent to join...", ja:"対戦相手の参加を待っています..."},
  player_draft:    {en:"Player Draft", ja:"選手ドラフト"},
  tab_batters:     {en:"Batters", ja:"打者"},
  tab_pitchers:    {en:"Pitchers", ja:"投手"},
  set_lineups:     {en:"Set Lineups →", ja:"打順を設定 →"},
  set_orders:      {en:"Set Batting Orders", ja:"打順を設定"},
  ready:           {en:"Ready! ⚾", ja:"準備完了！ ⚾"},
  hr_derby:        {en:"Home Run Derby", ja:"ホームランダービー"},
  how_many:        {en:"How many batters per team?", ja:"1チームあたりの打者は何人？"},
  batters_each:    {en:"batters each", ja:"人ずつ"},
  derby_note:      {en:"Each batter gets 20 swings. Homer on your last swing? Keep going until you miss!", ja:"打者1人につき20スイング。最後のスイングでホームランを打ったら、失敗するまで続行！"},
  start_draft:     {en:"Start Draft →", ja:"ドラフト開始 →"},
  derby_draft:     {en:"💣 Derby Draft", ja:"💣 ダービードラフト"},

  // --- dynamic ---
  alert_connecting:{en:"Still connecting to server... Please wait a moment and try again.", ja:"サーバーに接続中です... 少し待ってからもう一度お試しください。"},
  alert_code4:     {en:"Enter a 4-character room code", ja:"4文字の部屋コードを入力してください"},
  team1:           {en:"Team 1", ja:"チーム1"},
  team2:           {en:"Team 2", ja:"チーム2"},
  you_caps:        {en:" (YOU)", ja:"（あなた）"},
  you:             {en:" (You)", ja:"（あなた）"},
  poss_pick:       {en:"'s pick", ja:"の選択"},
  position_filled: {en:"Position Filled", ja:"ポジション充足"},
  pitcher:         {en:"Pitcher", ja:"投手"},
  multiply:        {en:"Multiply", ja:"掛ける"},
  add_plus:        {en:"Add (+)", ja:"足す (+)"},
  multiply_x:      {en:"Multiply (×)", ja:"掛ける (×)"},
  all:             {en:"ALL", ja:"全て"},
  ba:              {en:"BA", ja:"打率"},
  obp:             {en:"OBP", ja:"出塁率"},
  slg:             {en:"SLG", ja:"長打率"},
  batting_suffix:  {en:" batting", ja:"の攻撃"},
  order_suffix:    {en:" — Batting Order", ja:" — 打順"},
  starting_pitcher:{en:"Starting Pitcher:", ja:"先発投手："},
  waiting_opp:     {en:"Waiting for opponent...", ja:"対戦相手を待っています..."},
  top:             {en:"Top", ja:"表"},
  bottom:          {en:"Bottom", ja:"裏"},
  offense:         {en:"Offense", ja:"攻撃"},
  defense:         {en:"Defense", ja:"守備"},
  spin_btn:        {en:"🎰 Spin!", ja:"🎰 スピン！"},
  waiting_spin:    {en:"Waiting for opponent to spin...", ja:"対戦相手のスピンを待っています..."},
  spin_result:     {en:"Spin result:", ja:"スピン結果:"},
  roll_mul:        {en:"Roll × Multiply", ja:"掛けてロール ×"},
  roll_add:        {en:"Roll + Add", ja:"足してロール +"},
  waiting_roll:    {en:"Waiting for opponent to roll...", ja:"対戦相手のロールを待っています..."},
  game_over:       {en:"Game Over!", ja:"ゲーム終了！"},
  wins_suffix:     {en:" wins!", ja:"の勝ち！"},
  new_game:        {en:"New Game", ja:"新しいゲーム"},
  defense_turn:    {en:"Defense Turn →", ja:"守備のターン →"},
  match_choose:    {en:"Match! Choose shift direction:", ja:"マッチ！シフト方向を選択："},
  keep:            {en:"Keep ", ja:""},
  keep_suffix:     {en:"", ja:"をキープ"},
  match_opp:       {en:"Match! Opponent is choosing shift...", ja:"マッチ！対戦相手がシフトを選択中..."},
  no_match:        {en:"No match — no shift available", ja:"マッチなし — シフトは使えません"},
  result_label:    {en:"Result: ", ja:"結果: "},
  apply_result:    {en:"Apply Result", ja:"結果を反映"},
  waiting_apply:   {en:"Waiting for opponent to apply...", ja:"対戦相手の反映を待っています..."},
  reconnecting:    {en:"Reconnecting to server...", ja:"サーバーに再接続中..."},
  connecting_free: {en:"Connecting to server... (free tier may take up to 60s)", ja:"サーバーに接続中...（無料プランでは最大60秒かかる場合があります）"},
  could_not_join:  {en:"Could not join: ", ja:"参加できませんでした: "},
  you_win:         {en:"You win!", ja:"あなたの勝ち！"},
  you_lose:        {en:"You lose.", ja:"あなたの負け。"},
  forfeit_prefix:  {en:"Opponent forfeited. ", ja:"対戦相手が棄権しました。"},
  outs:            {en:"Outs", ja:"アウト"},
  runs_col:        {en:"R", ja:"得点"},
  wildcards_suffix:{en:"'s Wild Cards", ja:"のワイルドカード"},
  tag_bat:         {en:"BAT", ja:"攻撃"},
  tag_pitch:       {en:"PITCH", ja:"守備"},
  tap_to_play:     {en:"TAP TO PLAY", ja:"タップして使用"},
  waiting_host:    {en:"Waiting for host to configure...", ja:"ホストの設定を待っています..."},
  derby_hr:        {en:"Derby HR: ~", ja:"ダービーHR: 約"},
  bonus_swings:    {en:"BONUS SWINGS", ja:"ボーナススイング"},
  swings_left:     {en:"Swings Remaining", ja:"残りスイング"},
  bonus:           {en:"♾️ BONUS", ja:"♾️ ボーナス"},
  bonus_note:      {en:"Homer on last swing! Keep going until you miss!", ja:"最後のスイングでホームラン！失敗するまで続行！"},
  swing_btn:       {en:"⚾ Swing!", ja:"⚾ スイング！"},
  waiting_swing:   {en:"Waiting for opponent to swing...", ja:"対戦相手のスイングを待っています..."},
  results_suffix:  {en:" Results", ja:"の結果"},
  turn_complete:   {en:"Turn complete!", ja:"ターン終了！"},
  derby_over:      {en:"🏆 Derby Over!", ja:"🏆 ダービー終了！"},
  tie:             {en:"It's a tie!", ja:"引き分け！"},
  tie_note:        {en:"Tied on HRs — won by total distance!", ja:"本塁打数が同じ — 合計飛距離で勝敗決定！"},
  th_batter:       {en:"Batter", ja:"打者"},
  th_hrs:          {en:"HRs", ja:"本塁打"},
  th_maxdist:      {en:"Max Dist", ja:"最長飛距離"},
  th_totaldist:    {en:"Total Dist", ja:"合計飛距離"},
  home_run_excl:   {en:"HOME RUN!", ja:"ホームラン！"},
  no_homer:        {en:"No Homer", ja:"ノーホーマー"},
  wheel_hr:        {en:"HOME RUN", ja:"ホームラン"},
  wheel_nohomer:   {en:"NO HOMER", ja:"ノーホーマー"}
};

function t(key){ const e = I18N[key]; return e ? (e[LANG] != null ? e[LANG] : e.en) : key; }

// player / pitcher name (objects carry English `n` and Japanese `ja`)
function nm(o){ return (LANG === 'ja' && o && o.ja) ? o.ja : o.n; }
// wild cards
function wcName(wc){ return (LANG === 'ja' && wc.nameJa) ? wc.nameJa : wc.name; }
function wcDesc(wc){ return (LANG === 'ja' && wc.descJa) ? wc.descJa : wc.desc; }
// spin outcome labels (arrays live in constants.js)
function outcomeLabel(i){ return LANG === 'ja' ? OUTCOME_LABELS_JA[i] : OUTCOME_LABELS_EN[i]; }

// formatted phrases where word order differs between languages
function fmtGameStatus(inning, half, name){
  const tb = t(half === 0 ? 'top' : 'bottom');
  return LANG === 'ja'
    ? `<b>${inning}回${tb}</b> — ${name}${t('batting_suffix')}`
    : `<b>${tb} of ${inning}</b> — ${name}${t('batting_suffix')}`;
}
function fmtPick(name){ return `${name}${t('poss_pick')}`; }
function fmtPicksLeft(n){ return LANG === 'ja' ? `このブロック残り${n}人` : `${n} picks left in block`; }
function fmtRuns(n){ return LANG === 'ja' ? `+${n}点！` : `+${n} RUN${n > 1 ? 'S' : ''}!`; }
function fmtKeep(key){ return LANG === 'ja' ? `${key}${t('keep_suffix')}` : `${t('keep')}${key}`; }
function fmtForfeit(win){ return `${t('forfeit_prefix')}${win ? t('you_win') : t('you_lose')}`; }
function fmtWins(name){ return `${name}${t('wins_suffix')}`; }
function fmtWildCardsTitle(name){ return `${name}${t('wildcards_suffix')}`; }
function fmtResultsTitle(name){ return `${name}${t('results_suffix')}`; }
function fmtProgress(a, b){ return LANG === 'ja' ? `${a} / ${b} 人選択済み` : `${a} / ${b} batters picked`; }
function fmtBatterOf(b, tot){ return LANG === 'ja' ? `${b}人目 / ${tot}人` : `Batter ${b} of ${tot}`; }
function fmtDerbyHR(p){ return `${t('derby_hr')}${p}%`; }
function fmtHR(n){ return LANG === 'ja' ? `${n} 本` : `${n} HR${n !== 1 ? 's' : ''}`; }
function fmtFtTotal(d){ return LANG === 'ja' ? `合計 ${d} フィート` : `${d} ft total`; }
function fmtFt(d){ return LANG === 'ja' ? `${d} フィート` : `${d} ft`; }
function fmtMaxDist(d){ return LANG === 'ja' ? `（最長 ${d}）` : ` (max ${d})`; }
function fmtDistLine(total, max){ return `${fmtFt(total)}${max ? fmtMaxDist(max) : ''}`; }

function applyStaticI18n(){
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.getAttribute('data-i18n')); });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph'))); });
  if (document.title !== undefined) document.title = t('title_game');
  const lb = document.getElementById('langBtnLabel');
  if (lb) lb.textContent = LANG === 'en' ? '日本語' : 'English';
}

function rerenderActive(){
  try {
    const active = document.querySelector('.screen.active');
    const id = active ? active.id : null;
    const cs = (typeof clientState !== 'undefined') ? clientState : {};
    if (id === 'draft' && typeof updateDraftUI === 'function' && cs.draftState) updateDraftUI(cs.draftState);
    else if (id === 'lineup' && typeof renderLineups === 'function') renderLineups();
    else if (id === 'game' && typeof renderGamePhase === 'function' && cs.gameState) renderGamePhase();
    else if (id === 'derby' && typeof renderDerby === 'function' && cs.derbyState) renderDerby();
    else if (id === 'derbyDraft' && typeof renderDerbyDraft === 'function') renderDerbyDraft();
    else if (id === 'derbyConfig' && typeof renderDerbyConfig === 'function') renderDerbyConfig();
  } catch (e) { console.warn('rerender skipped', e); }
}

function setLang(l){
  LANG = l;
  try { localStorage.setItem('lang', l); } catch (e) {}
  applyStaticI18n();
  rerenderActive();
}
function toggleLang(){ setLang(LANG === 'en' ? 'ja' : 'en'); }

document.addEventListener('DOMContentLoaded', applyStaticI18n);
