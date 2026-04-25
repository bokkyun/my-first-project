/**
 * DB에 events.event_kind 컬럼이 없을 때 커피 모임을 memo 접두로 표시(폴백)
 */
export const COFFEE_MEMO_PREFIX = '__TEAMSYNC_EVENT_KIND_COFFEE__';

export function isCoffeeEvent(event) {
  if (!event) return false;
  if (event.event_kind === 'coffee') return true;
  return typeof event.memo === 'string' && event.memo.startsWith(COFFEE_MEMO_PREFIX);
}

/** 폼/표시용: 접두 제거 */
export function memoTextForForm(memo) {
  if (typeof memo !== 'string' || !memo.startsWith(COFFEE_MEMO_PREFIX)) {
    return typeof memo === 'string' ? memo : '';
  }
  const rest = memo.slice(COFFEE_MEMO_PREFIX.length);
  return rest.replace(/^\r?\n/, '') || '';
}

/** event_kind 없이 저장할 때 메모에 태그 부착 */
export function withCoffeeMemoTag(userMemo) {
  const body = (userMemo || '').trim();
  return body ? `${COFFEE_MEMO_PREFIX}\n${body}` : COFFEE_MEMO_PREFIX;
}

/**
 * @param {import('@supabase/supabase-js').PostgrestError|{ message?: string, code?: string, details?: string, hint?: string }|null} err
 */
export function isMissingEventKindColumnError(err) {
  if (!err) return false;
  const m = `${err.message || ''} ${err.details || ''} ${err.hint || ''}`.toLowerCase();
  if (err.code === '42703') return true;
  if (m.includes('event_kind') && (m.includes('column') || m.includes('schema') || m.includes('does not exist'))) {
    return true;
  }
  if (m.includes("could not find the 'event_kind'") || m.includes('event_kind of')) return true;
  if (m.includes('schema cache') && m.includes('event_kind')) return true;
  return false;
}

/**
 * @param {object} eventData
 * @param {string} creatorId
 * @returns {object} event_kind 제외, 커피면 memo에 태그
 */
export function buildEventPayloadWithoutEventKindColumn(eventData, creatorId) {
  const { event_kind, memo, ...rest } = eventData;
  const row = { ...rest, creator_id: creatorId };
  if (event_kind === 'coffee') {
    row.memo = withCoffeeMemoTag(memo);
  }
  return row;
}

/**
 * @param {object} eventData - update( )에 넣을 필드
 */
export function buildEventUpdateWithoutEventKindColumn(eventData) {
  const { event_kind, memo, ...rest } = eventData;
  const row = { ...rest };
  if (event_kind === 'coffee') {
    row.memo = withCoffeeMemoTag(memo);
  }
  return row;
}
