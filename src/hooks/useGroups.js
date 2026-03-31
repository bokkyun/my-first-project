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
   * @param {{ name, description, color, isSearchable, password }} groupData
   */
  const createGroup = async (groupData) => {
    const { name, description, color, isSearchable, password } = groupData;
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({ name, description, color, is_searchable: isSearchable, created_by: userId, password })
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
   * @param {string} password - 그룹 비밀번호 [Required]
   */
  const joinGroup = async (groupId, password) => {
    const { data: verified } = await supabase
      .from('groups')
      .select('id')
      .eq('id', groupId)
      .eq('password', password)
      .maybeSingle();
    if (!verified) return { error: { message: '비밀번호가 틀렸습니다.' } };

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
  const deleteGroup = async (groupId) => {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId)
      .eq('created_by', userId);
    if (error) return { error };
    await fetchGroups();
    return { data: true };
  };

  /**
   * @param {string} groupId
   * @param {string} newPassword - 변경할 새 비밀번호 [Required]
   */
  const changeGroupPassword = async (groupId, newPassword) => {
    const { error } = await supabase
      .from('groups')
      .update({ password: newPassword })
      .eq('id', groupId)
      .eq('created_by', userId);
    if (error) return { error };
    return { data: true };
  };

  /**
   * @param {string} groupId
   * @param {string} newAdminUserId - 새로운 관리자로 지정할 유저 ID
   */
  const changeGroupAdmin = async (groupId, newAdminUserId) => {
    const { error: e1 } = await supabase
      .from('group_members')
      .update({ role: 'admin' })
      .eq('group_id', groupId)
      .eq('user_id', newAdminUserId);
    if (e1) return { error: e1 };

    const { error: e2 } = await supabase
      .from('group_members')
      .update({ role: 'member' })
      .eq('group_id', groupId)
      .eq('user_id', userId);
    if (e2) return { error: e2 };

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

  return { groups, loading, fetchGroups, createGroup, joinGroup, leaveGroup, deleteGroup, fetchGroupMembers, changeGroupAdmin, changeGroupPassword };
}
