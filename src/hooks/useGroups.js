import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * 그룹 데이터를 관리하는 커스텀 훅
 * @param {string|null} userId - 현재 로그인 유저 ID [Required]
 */
export function useGroups(userId) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchGroups = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('group_members')
      .select('role, groups(*)')
      .eq('user_id', userId);
    if (!error && data) {
      setGroups(data.map((m) => ({ ...m.groups, myRole: m.role })));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  /**
   * @param {{ name, description, color, isSearchable }} groupData
   */
  const createGroup = async (groupData) => {
    const { name, description, color, isSearchable } = groupData;
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({ name, description, color, is_searchable: isSearchable, created_by: userId })
      .select()
      .single();
    if (groupError) return { error: groupError };

    const { error: memberError } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: userId, role: 'admin' });
    if (memberError) return { error: memberError };

    await fetchGroups();
    return { data: group };
  };

  /**
   * @param {string} groupId
   */
  const joinGroup = async (groupId) => {
    const { error } = await supabase
      .from('group_members')
      .insert({ group_id: groupId, user_id: userId, role: 'member' });
    if (error) return { error };
    await fetchGroups();
    return { data: true };
  };

  /**
   * @param {string} groupId
   */
  const leaveGroup = async (groupId) => {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);
    if (error) return { error };
    await fetchGroups();
    return { data: true };
  };

  /**
   * @param {string} groupId
   */
  const fetchGroupMembers = async (groupId) => {
    const { data, error } = await supabase
      .from('group_members')
      .select('role, profiles(id, nickname, email)')
      .eq('group_id', groupId);
    if (error) return { error };
    return { data: data.map((m) => ({ ...m.profiles, role: m.role })) };
  };

  return { groups, loading, fetchGroups, createGroup, joinGroup, leaveGroup, fetchGroupMembers };
}
