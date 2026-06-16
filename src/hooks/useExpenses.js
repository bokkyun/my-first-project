import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

function toYmd(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function exclusiveEndToInclusiveLastYmd(exclusiveEnd) {
  if (!(exclusiveEnd instanceof Date) || Number.isNaN(exclusiveEnd.getTime())) return null;
  const last = new Date(exclusiveEnd.getTime() - 1);
  return toYmd(last);
}

function addDaysToYmd(ymd, deltaDays) {
  if (!ymd || typeof ymd !== 'string') return ymd;
  const parts = ymd.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return ymd;
  const [y, m, d] = parts;
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + deltaDays);
  return toYmd(dt);
}

function spanDaysInclusive(startYmd, endYmd) {
  if (!startYmd || !endYmd) return 0;
  const partsS = startYmd.split('-').map(Number);
  const partsE = endYmd.split('-').map(Number);
  if (partsS.length !== 3 || partsE.length !== 3) return 0;
  const t1 = new Date(partsS[0], partsS[1] - 1, partsS[2]).getTime();
  const t2 = new Date(partsE[0], partsE[1] - 1, partsE[2]).getTime();
  if (Number.isNaN(t1) || Number.isNaN(t2)) return 0;
  return Math.round((t2 - t1) / 86400000) + 1;
}

function widenQueryYmdRange(startYmd, endYmd, minSpanDays = 42) {
  if (!startYmd || !endYmd) return { start: startYmd, end: endYmd };
  const span = spanDaysInclusive(startYmd, endYmd);
  if (span >= minSpanDays) return { start: startYmd, end: endYmd };
  const pad = Math.ceil((minSpanDays - span) / 2);
  return {
    start: addDaysToYmd(startYmd, -pad),
    end: addDaysToYmd(endYmd, pad),
  };
}

const EXPENSE_COLOR = '#c62828';

export function expenseToCalendarEvent(row) {
  const date = String(row.date).slice(0, 10);
  const amount = Number(row.amount) || 0;
  const merchant = String(row.merchant || '지출').trim();
  return {
    id: `expense-${row.id}`,
    title: `${merchant} ${amount.toLocaleString()}원`,
    starts_at: `${date}T00:00:00`,
    ends_at: `${date}T23:59:59`,
    is_all_day: true,
    color: EXPENSE_COLOR,
    _external: 'expense',
    _expenseRow: row,
    creator_id: row.user_id,
  };
}

/**
 * 로그인 사용자 지출(expenses) — 캘린더 표시용
 * @param {string|null} userId
 * @param {{ start: Date, end: Date }} viewRange FullCalendar datesSet (end 배타)
 * @param {boolean} [enabled]
 */
export function useExpenses(userId, viewRange, enabled = true) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchExpenses = useCallback(async () => {
    if (!userId || !enabled) {
      setExpenses([]);
      setError(null);
      return;
    }

    const startYmd = toYmd(viewRange?.start);
    const endYmd = exclusiveEndToInclusiveLastYmd(viewRange?.end);
    if (!startYmd || !endYmd) return;

    const { start, end } = widenQueryYmdRange(startYmd, endYmd);

    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: true });

    setLoading(false);
    if (err) {
      setError(err.message);
      setExpenses([]);
      return;
    }
    setExpenses(data || []);
  }, [userId, enabled, viewRange?.start?.getTime(), viewRange?.end?.getTime()]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const calendarEvents = useMemo(
    () => (expenses || []).map(expenseToCalendarEvent),
    [expenses],
  );

  return {
    expenses,
    calendarEvents,
    loading,
    error,
    refreshExpenses: fetchExpenses,
  };
}
