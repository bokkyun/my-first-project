import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { stripSupabaseOAuthFromUrlWhenReady } from '../utils/stripSupabaseOAuthUrl';

/** 서브패스 배포(GitHub Pages 등) 시 OAuth·이메일 리다이렉트용 앱 절대 URL */
function getAppBaseUrl() {
  const path = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${window.location.origin}${path}`;
}

/**
 * 인증 상태를 관리하는 커스텀 훅
 * @returns {{ user, session, loading, signIn, signUp, signOut, resetPasswordForEmail, updatePassword }}
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
      queueMicrotask(() => stripSupabaseOAuthFromUrlWhenReady(session));
    }).catch(() => {
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      queueMicrotask(() => stripSupabaseOAuthFromUrlWhenReady(session));
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * @param {string} email - 이메일 주소
   * @param {string} password
   */
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    return { data, error };
  };

  /**
   * @param {string} email - 이메일 주소
   * @param {string} password
   * @param {string} nickname - 표시 이름
   */
  const signUp = async (email, password, nickname) => {
    const emailNormalized = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: emailNormalized,
      password,
      options: { data: { nickname: nickname || emailNormalized.split('@')[0] } },
    });
    return { data, error };
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${getAppBaseUrl()}/calendar` },
    });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  /**
   * 비밀번호 재설정 이메일 발송
   * @param {string} email
   */
  const resetPasswordForEmail = async (email) => {
    const redirectTo = `${getAppBaseUrl()}/update-password`;
    return supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo });
  };

  /**
   * 새 비밀번호로 변경 (재설정 링크로 세션이 잡힌 뒤 또는 로그인 상태)
   * @param {string} newPassword
   */
  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    return { data, error };
  };

  return {
    user,
    session,
    loading,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    resetPasswordForEmail,
    updatePassword,
  };
}
