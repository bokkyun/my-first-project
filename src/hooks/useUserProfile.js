import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getAuthDisplayName } from '../utils/profileDisplay';

/**
 * public.profiles 행 + 로그인 정보 병합.
 * DB에 행이 없으면(구글 최초 로그인 등) auth 기준 임시 객체로 채워 UI가 비지 않게 함.
 */
export function useUserProfile(user) {
  const [profile, setProfile] = useState(null);

  const load = useCallback(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          setProfile({
            id: user.id,
            nickname: getAuthDisplayName(user),
            email: user.email,
          });
          return;
        }
        if (data) {
          setProfile({ ...data, email: data.email || user.email });
        } else {
          setProfile({
            id: user.id,
            nickname: getAuthDisplayName(user),
            email: user.email,
          });
        }
      });
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  return { profile, setProfile, refreshProfile: load };
}
