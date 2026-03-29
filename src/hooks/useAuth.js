import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * 인증 상태를 관리하는 커스텀 훅
 * @returns {{ user, session, loading, isRecoveryMode, setIsRecoveryMode, signIn, signUp, signOut, resetPassword, updatePassword }}
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * @param {string} email
   * @param {string} password
   */
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  /**
   * @param {string} email
   * @param {string} password
   * @param {string} nickname - 표시 이름
   */
  const signUp = async (email, password, nickname) => {
    const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nickname: nickname || email.split('@')[0] },
        emailRedirectTo: redirectTo,
      },
    });
    return { data, error };
  };

  /**
   * @param {string} email - 비밀번호 재설정 이메일 발송
   */
  const resetPassword = async (email) => {
    const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`;
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    return { data, error };
  };

  /**
   * @param {string} newPassword
   */
  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    return { data, error };
  };

  const signOut = async () => {
    setIsRecoveryMode(false);
    await supabase.auth.signOut();
  };

  return { user, session, loading, isRecoveryMode, setIsRecoveryMode, signIn, signUp, signOut, resetPassword, updatePassword };
}
