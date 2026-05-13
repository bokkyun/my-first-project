/**
 * CalendarView 그리드와 동일한 규칙으로 일정 표시 여부 판별.
 * (내 일정만, 체크된 그룹 공유 일정, 외부 청약·공모주 등)
 *
 * @param {object} ev — 일정 객체
 * @param {{ visibleGroupIds: string[], onlyMySchedules: boolean, currentUserId: string|null }} opts
 * @returns {boolean}
 */
export function eventPassesSidebarCalendarFilters(ev, {
  visibleGroupIds,
  onlyMySchedules,
  currentUserId,
}) {
  const isExternal = ev._external === 'reb-apt'
    || ev._external === 'reb-odcloud'
    || ev._external === 'ipo'
    || ev._external === 'dart-report'
    || ev._external === 'fred'
    || ev._external === 'bok'
    || ev._external === 'signal';
  const isSummary = String(ev._external || '').startsWith('summary-');

  if (isExternal || isSummary) {
    if (onlyMySchedules) return false;
    return true;
  }
  const sharedGroupIds = (ev.event_visibility || []).map((v) => v.group_id);
  let visible = true;
  if (sharedGroupIds.length === 0) {
    visible = true;
  } else {
    visible = sharedGroupIds.some((gid) => visibleGroupIds.includes(gid));
  }
  if (!visible) return false;
  if (onlyMySchedules && currentUserId && ev.creator_id !== currentUserId) return false;
  return true;
}
