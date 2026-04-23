/**
 * auth.users / user_metadata 기준 표시용 닉네임 (profiles 행이 없을 때 폴백)
 */
export function getAuthDisplayName(user) {
  if (!user) return '';
  const m = user.user_metadata || {};
  return (
    m.nickname
    || m.full_name
    || m.name
    || (user.email ? user.email.split('@')[0] : '')
    || ''
  );
}

/** 프로필 카드·네비에 쓸 이메일 */
export function getDisplayEmail(profile, user) {
  return profile?.email || user?.email || '';
}

/** 아바타 첫 글자 */
export function getAvatarLetter(profile, user) {
  const name = profile?.nickname || getAuthDisplayName(user);
  return name?.[0]?.toUpperCase() || '?';
}
