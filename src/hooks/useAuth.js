import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/** 아이디 → 내부 이메일 변환 (Supabase Auth는 이메일을 식별자로 사용) */
const toEmail = (username) => `${username.trim().toLowerCase()}@teamsync.local`;

/**
 * 인증 상태를 관리하는 커스텀 훅
 * @returns {{ user, session, loading, signIn, signUp, signOut }}
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * @param {string} username - 사용자 아이디
   * @param {string} password
   */
  const signIn = async (username, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: toEmail(username),
      password,
    });
    return { data, error };
  };

  /**
   * @param {string} username - 사용자 아이디 (로그인 식별자)
   * @param {string} password
   * @param {string} nickname - 표시 이름
   */
  const signUp = async (username, password, nickname) => {
    const { data, error } = await supabase.auth.signUp({
      email: toEmail(username),
      password,
      options: { data: { nickname: nickname || username } },
    });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, session, loading, signIn, signUp, signOut };
}
