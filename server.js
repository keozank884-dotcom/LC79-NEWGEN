import fastify from "fastify";
import cors from "@fastify/cors";
import fetch from "node-fetch";

// ==================== CẤU HÌNH ====================
const PORT = 3000;
const VALID_KEY = "Hentaiz";
const ADMIN_ID = "@cskhgiabao";

// ==================== API URLs ====================
const API_URL_HU  = "https://wtx.tele68.com/v1/tx/lite-sessions?cp=R&cl=R&pf=web&at=83991213bfd4c554dc94bcd98979bdc5";
const API_URL_MD5 = "https://wtxmd52.tele68.com/v1/txmd5/sessions";

/* ================================================================
 *  THUẬT TOÁN — 60+ LOẠI CẦU + MẸO ĐIỂM SỐ
 * ================================================================ */

/* ---------- SINH TÊN CẦU ---------- */
function blocksOf(pat) {
  const b = []; let c = 1;
  for (let i = 1; i < pat.length; i++) {
    if (pat[i] === pat[i - 1]) c++;
    else { b.push(c); c = 1; }
  }
  b.push(c);
  return b;
}
const isPalindrome = s => s === s.split('').reverse().join('');
const eqArr = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

function namePattern(pat) {
  const b = blocksOf(pat);
  const L = pat.length;
  const tag = b.join('-');

  /* 1. BỆT */
  if (b.length === 1) return `BỆT-${L}`;

  /* 2. ĐỐI XỨNG / MIRROR */
  if (isPalindrome(pat) && L >= 4) return `ĐX-${L}`;
  if (L >= 4 && L % 2 === 0) {
    const h = L / 2;
    if (pat.slice(0, h) === pat.slice(h).split('').reverse().join('')) return `MIRROR-${L}`;
  }

  /* 3. CHU KỲ */
  for (const k of [2, 3, 4, 5]) {
    if (L >= k * 2 && L % k === 0) {
      const unit = pat.slice(0, k);
      if (pat === unit.repeat(L / k)) return `CHUKỲ-${L}(k=${k})`;
    }
  }

  /* 4. SO LE / GẤP */
  if (/^(BT)+B?$/.test(pat) || /^(TB)+T?$/.test(pat))            return `SOLE-${L}`;
  if (/^(BBTT)+B{0,2}$/.test(pat) || /^(TTBB)+T{0,2}$/.test(pat)) return `GẤPĐÔI-${L}`;
  if (/^(BBBTTT)+B{0,3}$/.test(pat) || /^(TTTBBB)+T{0,3}$/.test(pat)) return `GẤPBA-${L}`;

  /* 5. FIBONACCI */
  const fibo = [1, 1, 2, 3, 5, 8, 13];
  if (eqArr(b, fibo.slice(0, b.length)) && b.length >= 3) return `FIBO-${L}`;

  /* 6. BẬC THANG */
  if (b.length >= 3) {
    const tang = b.every((v, i) => i === 0 || v === b[i - 1] + 1);
    const giam = b.every((v, i) => i === 0 || v === b[i - 1] - 1);
    if (tang && b[b.length - 1] <= 5) return `THANG↑-${L}`;
    if (giam && b[0] <= 5)           return `THANG↓-${L}`;
  }
  if (b.length === 4 && b[0] + 1 === b[1] && b[1] === b[2] && b[2] + 1 === b[3]) return `THANGKÉP-${L}`;

  /* 7. NGHIÊNG / KẸP / TAM GIÁC */
  if (b.length === 3 && b[0] === b[2] && b[1] > b[0])   return `NGHIÊNG-${tag}`;
  if (b.length === 3 && b[0] === 1 && b[2] === 1)        return `KẸP-${tag}`;
  if (b.length === 3 && b[0] === 2 && b[2] === 2)        return `KẸPĐÔI-${tag}`;
  if (b.length === 3 && b[0] < b[1] && b[1] < b[2])      return `TAMGIÁC↑-${tag}`;
  if (b.length === 3 && b[0] > b[1] && b[1] > b[2])      return `TAMGIÁC↓-${tag}`;

  /* 8. XOAY VÒNG */
  if (L >= 6 && L % 2 === 0) {
    const head = pat.slice(0, 2);
    let xoay = true;
    for (let i = 2; i < L; i += 2) if (pat.slice(i, i + 2) !== head) { xoay = false; break; }
    if (xoay) return `XOAY-${L}`;
  }

  /* 9. GÃY */
  if (L >= 6 && /^(B{4,}|T{4,})(B|T)/.test(pat))      return `BỆT-GÃY-${L}`;
  if (/^(BT)+(B|T)(BT)+$/.test(pat))                  return `SOLE-GÃY-${L}`;
  if (L >= 6 && pat.slice(0, 3) === pat.slice(-3) && !isPalindrome(pat)) return `NGHIÊNG-GÃY-${L}`;

  /* 10. LAI GHÉP */
  if (/^(B{3,}|T{3,})(BT)+/.test(pat))      return `BỆT-SOLE-${L}`;
  if (/^(BT)+(B{3,}|T{3,})/.test(pat))      return `SOLE-BỆT-${L}`;
  if (/^(BTT|TBB)(B{3,}|T{3,})/.test(pat))  return `KẸP-BỆT-${L}`;
  if (/^(B{3,}|T{3,})(BTT|TBB)/.test(pat))  return `BỆT-KẸP-${L}`;
  if (/^((BB|TT)(B|T)){2,}/.test(pat))      return `ZICZACĐÔI-${L}`;

  /* 11. SỐ HỌC */
  if (b.length === 4 && b[0] === b[1] - 1 && b[2] === b[3] - 1 && b[1] === b[2]) return `TĂNGĐÔI-${L}`;
  if (b.length === 4 && b[0] === b[1] + 1 && b[2] === b[3] + 1 && b[1] === b[2]) return `GIẢMĐÔI-${L}`;

  /* FALLBACK */
  return `NHỊP-${tag}`;
}

/* ---------- MẸO ĐIỂM SỐ ---------- */
function buildScoreTips(sessions, minSamples = 4) {
  const stat = {};
  for (let i = 0; i < sessions.length - 1; i++) {
    const cur = sessions[i], nxt = sessions[i + 1];
    const key = `${cur.result}_${cur.score}`;
    (stat[key] ??= { TAI: 0, XIU: 0 })[nxt.result]++;
  }
  const tips = [];
  for (const key in stat) {
    const { TAI, XIU } = stat[key]; const total = TAI + XIU;
    if (total < minSamples) continue;
    const pT = TAI / total * 100, pX = XIU / total * 100;
    const [side, score] = key.split('_');
    const label = (side === 'TAI' ? 'T' : 'X') + score;
    if (pT >= 55)      tips.push({ label, condition: key, predict: 'TAI', rate: Math.round(pT), samples: total });
    else if (pX >= 55) tips.push({ label, condition: key, predict: 'XIU', rate: Math.round(pX), samples: total });
  }
  return tips.sort((a, b) => b.rate - a.rate);
}

/* ---------- MẸO CẦU (gom theo tên) ---------- */
function buildPatternTips(seq, opts = {}) {
  const { minSamples = 4, maxLen = 8 } = opts;
  const stat = {};
  for (let len = 2; len <= maxLen; len++) {
    for (let i = 0; i + len < seq.length; i++) {
      const pat = seq.slice(i, i + len).join('');
      const nxt = seq[i + len];
      (stat[pat] ??= { B: 0, T: 0 })[nxt]++;
    }
  }
  const byName = {};
  for (const pat of Object.keys(stat)) {
    const { B, T } = stat[pat]; const total = B + T;
    if (total < minSamples) continue;
    const name = namePattern(pat);
    (byName[name] ??= { B: 0, T: 0, patterns: [], samples: 0 });
    byName[name].B += B;
    byName[name].T += T;
    byName[name].patterns.push({ pat, B, T, total });
    byName[name].samples += total;
  }
  const tips = [];
  for (const name in byName) {
    const { B, T, patterns, samples } = byName[name];
    const total = B + T;
    if (total < minSamples) continue;
    const pB = B / total * 100, pT = T / total * 100;
    const best = patterns.sort((a, b) => b.total - a.total)[0];
    if (pB >= 55)      tips.push({ name, predict: 'TAI', rate: Math.round(pB), samples: total, sample: best.pat, len: best.pat.length });
    else if (pT >= 55) tips.push({ name, predict: 'XIU', rate: Math.round(pT), samples: total, sample: best.pat, len: best.pat.length });
  }
  return tips.sort((a, b) => b.rate - a.rate);
}

/* ---------- KHỚP ĐUÔI ---------- */
function matchStreakTip(seq, patternTips, maxLen = 8) {
  for (let len = Math.min(maxLen, seq.length); len >= 2; len--) {
    const tail = seq.slice(-len).join('');
    const direct = patternTips.find(t => t.sample === tail);
    if (direct) return { ...direct, matchedBy: 'pattern', tail };
    const tailName = namePattern(tail);
    const byName = patternTips.find(t => t.name === tailName);
    if (byName) return { ...byName, matchedBy: 'name', tail, tailName };
  }
  return null;
}

/* ---------- DỰ ĐOÁN KẾT HỢP ---------- */
function predict(sessions, opts = {}) {
  const W_SCORE  = opts.wScore  ?? 0.4;
  const W_STREAK = opts.wStreak ?? 0.6;

  if (sessions.length < 5) {
    return { predict: 'TAI', confidence: 55, reason: 'Không đủ mẫu, ưu tiên TÀI' };
  }

  const seq = sessions.map(x => x.result === 'TAI' ? 'B' : 'T');
  const last = sessions[sessions.length - 1];
  const scoreKey = `${last.result}_${last.score}`;

  const scoreTip    = buildScoreTips(sessions).find(t => t.condition === scoreKey);
  const patternTips = buildPatternTips(seq);
  const streakTip   = matchStreakTip(seq, patternTips);

  let vB = 0, vT = 0, wSum = 0;
  if (scoreTip) {
    (scoreTip.predict === 'TAI' ? vB += scoreTip.rate * W_SCORE : vT += scoreTip.rate * W_SCORE);
    wSum += W_SCORE;
  }
  if (streakTip) {
    (streakTip.predict === 'TAI' ? vB += streakTip.rate * W_STREAK : vT += streakTip.rate * W_STREAK);
    wSum += W_STREAK;
  }
  if (wSum === 0) return { predict: 'TAI', confidence: 55, reason: 'Cầu loạn, ưu tiên TÀI' };

  const tail = seq.slice(-8).join('');
  const confidence = Math.min(98, Math.max(55, Math.round(Math.max(vB, vT) / wSum)));

  const reasons = [];
  if (scoreTip)  reasons.push(`Điểm ${scoreTip.label} → ${scoreTip.predict === 'TAI' ? 'TÀI' : 'XỈU'} ${scoreTip.rate}%`);
  if (streakTip) reasons.push(`Cầu ${streakTip.name} [${streakTip.sample}] → ${streakTip.predict === 'TAI' ? 'TÀI' : 'XỈU'} ${streakTip.rate}%`);

  return {
    predict: vB >= vT ? 'TAI' : 'XIU',
    confidence,
    reason: reasons.length ? reasons.join(' | ') : 'Cầu loạn, ưu tiên TÀI',
    scoreTip,
    streakTip,
    context: { lastResult: last.result, lastScore: last.score, tail, tailName: namePattern(tail) }
  };
}

/* ================================================================
 *  PARSE DỮ LIỆU TỪ API
 * ================================================================ */
function parseLinesHu(data) {
  if (!data || !Array.isArray(data.list)) return [];
  return data.list.map(item => ({
    session: item.id,
    dice: item.dices,
    score: item.point,
    result: item.point >= 11 ? 'TAI' : 'XIU'
  })).sort((a, b) => a.session - b.session);
}

function parseLinesMd5(data) {
  if (!data || !Array.isArray(data.list)) return [];
  return data.list.map(item => ({
    session: item.id,
    dice: item.dices,
    score: item.point,
    result: item.resultTruyenThong === 'Tài' ? 'TAI' : 'XIU'
  })).sort((a, b) => a.session - b.session);
}

/* ================================================================
 *  GLOBAL STATE
 * ================================================================ */
let huHistory  = [];   // newest first
let md5History = [];   // newest first
let currentSessionIdHu  = null;
let currentSessionIdMd5 = null;

// ⭐ LOG DỰ ĐOÁN — lưu dự đoán cũ để đối chiếu đúng/sai
let huPredictionLog  = [];
let md5PredictionLog = [];

/* ================================================================
 *  FETCH DATA
 * ================================================================ */
async function fetchHuData() {
  try {
    const res = await fetch(API_URL_HU);
    const data = await res.json();
    const newHistory = parseLinesHu(data);
    if (newHistory.length === 0) return;

    const lastSession = newHistory.at(-1);

    if (!currentSessionIdHu) {
      huHistory = newHistory.slice().reverse();
      currentSessionIdHu = lastSession.session;
      console.log(`✅ [HŨ] Đã tải ${newHistory.length} phiên`);
    } else if (lastSession.session > currentSessionIdHu) {
      const newRecords = newHistory.filter(r => r.session > currentSessionIdHu);
      for (const r of newRecords) huHistory.unshift(r);
      if (huHistory.length > 1000) huHistory = huHistory.slice(0, 800);
      currentSessionIdHu = lastSession.session;
      if (newRecords.length > 0) console.log(`🆕 [HŨ] +${newRecords.length} phiên mới`);
    }

    // ⭐ Đối chiếu log dự đoán với dữ liệu mới
    verifyPredictions(huPredictionLog, huHistory);
  } catch (e) {
    console.error(`❌ [HŨ] Lỗi:`, e.message);
  }
}

async function fetchMd5Data() {
  try {
    const res = await fetch(API_URL_MD5);
    const data = await res.json();
    const newHistory = parseLinesMd5(data);
    if (newHistory.length === 0) return;

    const lastSession = newHistory.at(-1);

    if (!currentSessionIdMd5) {
      md5History = newHistory.slice().reverse();
      currentSessionIdMd5 = lastSession.session;
      console.log(`✅ [MD5] Đã tải ${newHistory.length} phiên`);
    } else if (lastSession.session > currentSessionIdMd5) {
      const newRecords = newHistory.filter(r => r.session > currentSessionIdMd5);
      for (const r of newRecords) md5History.unshift(r);
      if (md5History.length > 1000) md5History = md5History.slice(0, 800);
      currentSessionIdMd5 = lastSession.session;
      if (newRecords.length > 0) console.log(`🆕 [MD5] +${newRecords.length} phiên mới`);
    }

    // ⭐ Đối chiếu log dự đoán
    verifyPredictions(md5PredictionLog, md5History);
  } catch (e) {
    console.error(`❌ [MD5] Lỗi:`, e.message);
  }
}

/* ================================================================
 *  PREDICTION LOG — Quản lý dự đoán cũ (đúng / sai)
 * ================================================================ */
function recordPrediction(log, session, prediction) {
  // Không ghi trùng
  if (log.find(p => p.session === session)) return;
  log.push({
    session,
    predict: prediction.predict,          // 'TAI' | 'XIU'
    confidence: prediction.confidence,
    reason: prediction.reason,
    actual: null,
    correct: null
  });
  // Giữ tối đa 200 phiên
  if (log.length > 200) log.splice(0, log.length - 200);
}

function verifyPredictions(log, history) {
  const map = new Map(history.map(h => [h.session, h]));
  for (const p of log) {
    if (p.actual === null && map.has(p.session)) {
      const h = map.get(p.session);
      p.actual  = h.result;               // 'TAI' | 'XIU'
      p.correct = p.predict === p.actual;
    }
  }
}

function buildHistoryReport(log, limit = 30) {
  const finished = log
    .filter(p => p.actual !== null)
    .sort((a, b) => b.session - a.session)
    .slice(0, limit);

  const total = finished.length;
  const dung  = finished.filter(p => p.correct).length;
  const sai   = total - dung;

  const history = finished.map(p => ({
    phien:       p.session,
    du_doan_cu:  p.predict === 'TAI' ? 'tài' : 'xỉu',
    do_tin_cay:  `${p.confidence}%`,
    ly_do:       p.reason,
    ket_qua:     p.actual === 'TAI' ? 'tài' : 'xỉu',
    check:       p.correct ? 'đúng✅' : 'sai❌'
  }));

  return {
    history,
    thong_ke: {
      tong:  total,
      dung,
      sai,
      ti_le: total > 0 ? `${(dung / total * 100).toFixed(1)}%` : '0%'
    }
  };
}

/* ================================================================
 *  MIDDLEWARE CHECK KEY
 * ================================================================ */
function checkKey(query) {
  const userKey = query.key;
  if (!userKey || userKey !== VALID_KEY) {
    return { valid: false, error: "sai key rồi mua key đi adSika88" };
  }
  return { valid: true };
}

/* ================================================================
 *  BUILD RESPONSE CHUẨN
 * ================================================================ */
function buildResponse(history, gameName, log) {
  const chronological = [...history].reverse();
  const last = history[0];

  const result = predict(chronological);

  // ⭐ Ghi log dự đoán cho phiên kế tiếp
  recordPrediction(log, last.session + 1, result);

  return {
    "id": ADMIN_ID,
    "game": gameName,
    "phien_truoc": last.session,
    "xuc_xac": `${last.dice[0]} - ${last.dice[1]} - ${last.dice[2]}`,
    "ket_qua": last.result === 'TAI' ? 'tài' : 'xỉu',
    "tong": last.score,
    "phien_nay": last.session + 1,
    "du_doan": result.predict === 'TAI' ? 'tài' : 'xỉu',
    "do_tin_cay": `${result.confidence}%`,
    "ly_do": result.reason
  };
}

/* ================================================================
 *  FASTIFY SERVER
 * ================================================================ */
const app = fastify({ logger: false });
await app.register(cors, { origin: "*" });

/* ---------- ROUTE GỐC ---------- */
app.get("/", async () => ({
  status: "active",
  message: "api hỗ trợ 2 bàn hũ + md5, mua key ib adSika88",
  algorithm: "🎲 TÀI XỈU VIP - 60+ CẦU CHUYÊN SÂU + HISTORY ĐÚNG/SAI 🎲",
  key: VALID_KEY,
  endpoints: {
    hu:                `/api/taixiu/lc789?key=${VALID_KEY}`,
    md5:               `/api/md5/lc789?key=${VALID_KEY}`,
    hu_history:        `/api/taixiu/lc789/prediction-history?key=${VALID_KEY}`,
    md5_history:       `/api/md5/lc789/prediction-history?key=${VALID_KEY}`,
    hu_raw:            `/api/taixiu/lc789/raw-history?key=${VALID_KEY}`,
    md5_raw:           `/api/md5/lc789/raw-history?key=${VALID_KEY}`,
    tips:              `/api/tips/lc789?key=${VALID_KEY}`
  }
}));

/* ================================================================
 *  HŨ
 * ================================================================ */
app.get("/api/taixiu/lc789", async (request, reply) => {
  const k = checkKey(request.query);
  if (!k.valid) return reply.status(401).send({ error: k.error });

  if (huHistory.length < 5) {
    return reply.status(503).send({
      error: "Đang phân tích dữ liệu HŨ, vui lòng chờ...",
      need: "Cần ít nhất 5 phiên",
      current: huHistory.length
    });
  }

  const res  = buildResponse(huHistory, "HŨ", huPredictionLog);
  const hist = buildHistoryReport(huPredictionLog, 30);

  return {
    ...res,
    "history":  hist.history,
    "thong_ke": hist.thong_ke
  };
});

/* ================================================================
 *  MD5
 * ================================================================ */
app.get("/api/md5/lc789", async (request, reply) => {
  const k = checkKey(request.query);
  if (!k.valid) return reply.status(401).send({ error: k.error });

  if (md5History.length < 5) {
    return reply.status(503).send({
      error: "Đang phân tích dữ liệu MD5, vui lòng chờ...",
      need: "Cần ít nhất 5 phiên",
      current: md5History.length
    });
  }

  const res  = buildResponse(md5History, "MD5", md5PredictionLog);
  const hist = buildHistoryReport(md5PredictionLog, 30);

  return {
    ...res,
    "history":  hist.history,
    "thong_ke": hist.thong_ke
  };
});

/* ================================================================
 *  HISTORY DỰ ĐOÁN (chỉ log đúng/sai)
 * ================================================================ */
app.get("/api/taixiu/lc789/prediction-history", async (request, reply) => {
  const k = checkKey(request.query);
  if (!k.valid) return reply.status(401).send({ error: k.error });

  const limit = Math.min(parseInt(request.query.limit) || 30, 200);
  return buildHistoryReport(huPredictionLog, limit);
});

app.get("/api/md5/lc789/prediction-history", async (request, reply) => {
  const k = checkKey(request.query);
  if (!k.valid) return reply.status(401).send({ error: k.error });

  const limit = Math.min(parseInt(request.query.limit) || 30, 200);
  return buildHistoryReport(md5PredictionLog, limit);
});

/* ================================================================
 *  RAW HISTORY (30 phiên gần nhất từ API)
 * ================================================================ */
app.get("/api/taixiu/lc789/raw-history", async (request, reply) => {
  const k = checkKey(request.query);
  if (!k.valid) return reply.status(401).send({ error: k.error });

  return huHistory.slice(0, 30).map(i => ({
    session: i.session,
    dice:    i.dice,
    total:   i.score,
    result:  i.result === 'TAI' ? 'tài' : 'xỉu'
  }));
});

app.get("/api/md5/lc789/raw-history", async (request, reply) => {
  const k = checkKey(request.query);
  if (!k.valid) return reply.status(401).send({ error: k.error });

  return md5History.slice(0, 30).map(i => ({
    session: i.session,
    dice:    i.dice,
    total:   i.score,
    result:  i.result === 'TAI' ? 'tài' : 'xỉu'
  }));
});

/* ================================================================
 *  DEBUG TIPS — XEM TOÀN BỘ MẸO ĐANG CÓ
 * ================================================================ */
app.get("/api/tips/lc789", async (request, reply) => {
  const k = checkKey(request.query);
  if (!k.valid) return reply.status(401).send({ error: k.error });

  const type   = request.query.type === 'md5' ? md5History : huHistory;
  const chrono = [...type].reverse();
  const seq    = chrono.map(x => x.result === 'TAI' ? 'B' : 'T');

  return {
    score_tips:   buildScoreTips(chrono).slice(0, 30),
    pattern_tips: buildPatternTips(seq).slice(0, 60),
    current_tail: seq.slice(-8).join(''),
    tail_name:    namePattern(seq.slice(-8).join(''))
  };
});

/* ================================================================
 *  CHECK KEY
 * ================================================================ */
app.get("/check-key", async (request) => {
  const userKey = request.query.key;
  if (!userKey || userKey !== VALID_KEY) {
    return { status: "error", message: "sai key rồi mua key đi adSika88" };
  }
  return { status: "success", message: "KEY HỢP LỆ", key: VALID_KEY };
});

/* ================================================================
 *  START SERVER
 * ================================================================ */
const start = async () => {
  await Promise.all([fetchHuData(), fetchMd5Data()]);

  setInterval(fetchHuData, 5000);
  setInterval(fetchMd5Data, 5000);

  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
  } catch (err) {
    console.error("❌ Lỗi khởi động server:", err.message);
    process.exit(1);
  }

  console.log("\n╔══════════════════════════════════════════════════════════════════╗");
  console.log("║  TÀI XỈU HŨ & MD5 — 60+ CẦU + MẸO ĐIỂM + HISTORY ĐÚNG/SAI      ║");
  console.log("╠══════════════════════════════════════════════════════════════════╣");
  console.log(`║  🚀 Server running on port ${PORT}`);
  console.log(`║  🔑 KEY: ${VALID_KEY}`);
  console.log(`║  👤 ADMIN: ${ADMIN_ID}`);
  console.log("║                                                                  ║");
  console.log("║  🎯 ENDPOINTS:                                                  ║");
  console.log(`║     HŨ:               /api/taixiu/lc789?key=${VALID_KEY}`);
  console.log(`║     MD5:              /api/md5/lc789?key=${VALID_KEY}`);
  console.log(`║     HŨ History:       /api/taixiu/lc789/prediction-history?key=${VALID_KEY}`);
  console.log(`║     MD5 History:      /api/md5/lc789/prediction-history?key=${VALID_KEY}`);
  console.log(`║     HŨ Raw:           /api/taixiu/lc789/raw-history?key=${VALID_KEY}`);
  console.log(`║     MD5 Raw:          /api/md5/lc789/raw-history?key=${VALID_KEY}`);
  console.log(`║     Tips Debug:       /api/tips/lc789?key=${VALID_KEY}`);
  console.log("║                                                                  ║");
  console.log("║  🧠 THUẬT TOÁN: 60+ cầu (Bệt, ĐX, Sole, Gấp, Fibo, Thang,      ║");
  console.log("║     Xoay, Kẹp, Nghiêng, TamGiác, Gãy, Lai, ChuKỳ...) +         ║");
  console.log("║     mẹo điểm số (Score + Pattern kết hợp 40/60)                 ║");
  console.log("║                                                                  ║");
  console.log("║  📈 HISTORY: Tự động log dự đoán → đối chiếu khi có kết quả    ║");
  console.log("╚══════════════════════════════════════════════════════════════════╝\n");
};

start();