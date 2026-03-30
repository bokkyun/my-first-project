import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * 이벤트(일정) 데이터를 관리하는 커스텀 훅
 * @param {string|null} userId - 현재 로그인 유저 ID [Required]
 * @param {string[]} visibleGroupIds - 화면에 표시할 그룹 ID 목록 [Optional]
 */
export function useEvents(userId, visibleGroupIds = []) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    /** 내 일정 */
    const { data: myEvents, error: myErr } = await supabase
      .from('events')
      .select('*, event_visibility(group_id)')
      .eq('creator_id', userId);

    if (myErr) { setLoading(false); return; }

    /** 공개된 그룹 일정 (내가 속한 그룹 중 체크된 것) */
    let sharedEvents = [];
    if (visibleGroupIds.length > 0) {
      const { data, error } = await supabase
        .from('event_visibility')
        .select('event_id, group_id, events(*)')
        .in('group_id', visibleGroupIds);
      if (!error && data) {
        sharedEvents = data
          .filter((ev) => ev.events && ev.events.creator_id !== userId)
          .map((ev) => ({ ...ev.events, sharedGroupId: ev.group_id }));
      }
    }

    const all = [...(myEvents || []), ...sharedEvents];
    /** 중복 제거 */
    const unique = Array.from(new Map(all.map((e) => [e.id, e])).values());

    /** 등록자 닉네임 fetch */
    const creatorIds = [...new Set(unique.map((e) => e.creator_id).filter(Boolean))];
    if (creatorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nickname')
        .in('id', creatorIds);
      if (profiles) {
        const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]));
        setEvents(unique.map((e) => ({
          ...e,
          creatorNickname: profileMap[e.creator_id]?.nickname || null,
        })));
        setLoading(false);
        return;
      }
    }

    setEvents(unique);
    setLoading(false);
  }, [userId, visibleGroupIds.join(',')]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  /**
   * @param {object} eventData - 일정 데이터
   * @param {string[]} groupIds - 공개할 그룹 ID 배열
   * @param {string|null} targetUserId - 등록 대상 유저 ID (관리자가 그룹원 대신 등록 시) [Optional]
   */
  const createEvent = async (eventData, groupIds = [], targetUserId = null) => {
    const creatorId = targetUserId || userId;
    const { data: ev, error } = await supabase
      .from('events')
      .insert({ ...eventData, creator_id: creatorId })
      .select()
      .single();
    if (error) return { error };

    if (groupIds.length > 0) {
      const visibility = groupIds.map((gid) => ({ event_id: ev.id, group_id: gid }));
      await supabase.from('event_visibility').insert(visibility);
    }
    await fetchEvents();
    return { data: ev };
  };

  /**
   * @param {string} eventId
   * @param {object} eventData
   * @param {string[]} groupIds
   * @param {boolean} isAdminAction - 그룹 관리자 권한으로 수정 여부 [Optional, 기본값: false]
   */
  const updateEvent = async (eventId, eventData, groupIds = [], isAdminAction = false) => {
    const query = supabase.from('events').update(eventData).eq('id', eventId);
    const { error } = isAdminAction
      ? await query
      : await query.eq('creator_id', userId);
    if (error) return { error };

    await supabase.from('event_visibility').delete().eq('event_id', eventId);
    if (groupIds.length > 0) {
      const visibility = groupIds.map((gid) => ({ event_id: eventId, group_id: gid }));
      await supabase.from('event_visibility').insert(visibility);
    }
    await fetchEvents();
    return { data: true };
  };

  /**
   * @param {string} eventId
   * @param {boolean} isAdminAction - 그룹 관리자 권한으로 삭제 여부 [Optional, 기본값: false]
   */
  const deleteEvent = async (eventId, isAdminAction = false) => {
    const query = supabase.from('events').delete().eq('id', eventId);
    const { error } = isAdminAction
      ? await query
      : await query.eq('creator_id', userId);
    if (error) return { error };
    await fetchEvents();
    return { data: true };
  };

  return { events, loading, fetchEvents, createEvent, updateEvent, deleteEvent };
}
