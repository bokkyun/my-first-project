import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * @param {string|null} eventId
 * @param {string|null} currentUserId
 */
export function useCoffeeOrders(eventId, currentUserId) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const fetchOrders = useCallback(async () => {
    if (!eventId) {
      setOrders([]);
      setFetchError(null);
      return;
    }
    setLoading(true);
    setFetchError(null);
    const { data: rows, error } = await supabase
      .from('coffee_orders')
      .select('id, user_id, menu_type, temperature, custom_text, updated_at')
      .eq('event_id', eventId)
      .order('updated_at', { ascending: true });

    if (error) {
      setOrders([]);
      setFetchError(error.message || '주문 목록을 불러오지 못했습니다.');
      setLoading(false);
      return;
    }
    if (!rows?.length) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(rows.map((r) => r.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, nickname')
      .in('id', userIds);

    const pmap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
    setOrders(
      rows.map((r) => ({
        ...r,
        nickname: pmap[r.user_id]?.nickname || null,
        email: null,
      })),
    );
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    if (!eventId) {
      setOrders([]);
      setFetchError(null);
      return undefined;
    }
    fetchOrders();

    const channel = supabase
      .channel(`coffee_orders:event:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coffee_orders',
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          fetchOrders();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, fetchOrders]);

  /**
   * @param {{ menu_type: string, temperature: string|null, custom_text: string|null }} payload
   */
  const saveMyOrder = async (payload) => {
    if (!eventId || !currentUserId) return { error: { message: '로그인이 필요합니다.' } };
    setSaving(true);
    const row = {
      event_id: eventId,
      user_id: currentUserId,
      menu_type: payload.menu_type,
      temperature: payload.menu_type === 'custom'
        ? (payload.temperature || null)
        : payload.temperature,
      custom_text: payload.menu_type === 'custom' ? (payload.custom_text || '').trim() : null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from('coffee_orders')
      .upsert(row, { onConflict: 'event_id,user_id' });
    setSaving(false);
    if (error) return { error };
    await fetchOrders();
    return { data: true };
  };

  return {
    orders, loading, saving, fetchError, refetch: fetchOrders, saveMyOrder,
  };
}
