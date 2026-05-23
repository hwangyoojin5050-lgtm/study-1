/**
 * 저장소 키·표시 이름·스키마 버전·레코드 정규화.
 */
export const STORAGE_KEY = "studyRomanceAppData_v1";
export const APP_DISPLAY_NAME = "너의 옆자리";
/** localStorage / gatherPersistedState 페이로드 버전 */
export const PERSIST_SCHEMA_VERSION = 3;

export function sanitizeRecordRow(r) {
  if (!r || typeof r !== "object") return null;
  const date = String(r.date || "").trim();
  const seconds = Math.max(0, Math.round(Number(r.seconds || 0)));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || seconds <= 0) return null;
  const out = {
    date: date,
    seconds: seconds,
    quest: String(r.quest != null ? r.quest : "").trim(),
    source: String(r.source != null ? r.source : "manual").trim() || "manual"
  };
  const tag = String(r.tag != null ? r.tag : "").trim().slice(0, 24);
  if (tag) out.tag = tag;
  const note = String(r.note != null ? r.note : "").trim().slice(0, 200);
  if (note) out.note = note;
  const intent = String(r.intent != null ? r.intent : "").trim().slice(0, 120);
  if (intent) out.intent = intent;
  const shRaw = r.startHour;
  if (shRaw !== undefined && shRaw !== null && shRaw !== "") {
    const sh = Math.round(Number(shRaw));
    if (Number.isFinite(sh) && sh >= 0 && sh <= 23) out.startHour = sh;
  }
  return out;
}

/**
 * 예전 저장본(스키마 필드 없음)을 현재 키 집합에 맞게 보강합니다.
 * @param {Record<string, unknown>} data
 * @returns {Record<string, unknown>}
 */
export function migratePersistedPayload(data) {
  if (!data || typeof data !== "object") return data;
  const out = { ...data };
  let v = Number(out.schemaVersion);
  if (!Number.isFinite(v) || v < 1) v = 0;
  if (v < PERSIST_SCHEMA_VERSION) {
    if (out.onboardingCompleted == null) {
      const hasUse = (Array.isArray(out.records) && out.records.length > 0)
        || (Array.isArray(out.storyLog) && out.storyLog.length > 0)
        || Number(out.totalSeconds || 0) > 120
        || Number(out.affection || 0) > 0;
      out.onboardingCompleted = hasUse;
    }
    if (out.togetherLinesMaxPerDay == null) out.togetherLinesMaxPerDay = 8;
    if (typeof out.togetherStudyLineDay !== "string") out.togetherStudyLineDay = "";
    const c = Number(out.togetherStudyLineCount);
    out.togetherStudyLineCount = Number.isFinite(c) && c >= 0 ? Math.round(c) : 0;
  }
  if (v < 3) {
    out.todayJournalDate = "";
    out.todayJournalLine = "";
    const aff = Math.max(0, Number(out.affection || 0));
    const maxAff = Math.max(0, Number(out.maxAffectionEver || 0));
    if (maxAff > aff) out.maxAffectionEver = aff;
    out.schemaVersion = PERSIST_SCHEMA_VERSION;
  }
  if (Number(out.schemaVersion) !== PERSIST_SCHEMA_VERSION) {
    out.schemaVersion = PERSIST_SCHEMA_VERSION;
  }
  return out;
}
