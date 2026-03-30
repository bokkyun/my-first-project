import { useEffect, useRef } from 'react';

const ICON_URL = `${window.location.origin}${import.meta.env.BASE_URL}favicon.svg`;

/**
 * 오늘 일정 브라우저 알림 훅
 *
 * @param {Array} events - 전체 이벤트 목록 [Required]
 *
 * Example usage:
 * useNotifications(events);
 */
export function useNotifications(events) {
  const timersRef = useRef([]);

  useEffect(() => {
    if (!('Notification' in window)) return;

    const schedule = async () => {
      /** 권한 요청 */
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      if (Notification.permission !== 'granted') return;

      /** 기존 예약된 타이머 모두 취소 */
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];

      const now = new Date();
      const todayStr = now.toDateString();

      events.forEach((event) => {
        const start = new Date(event.starts_at);
        const eventDayStr = start.toDateString();

        /** 오늘 일정만 처리 */
        if (eventDayStr !== todayStr) return;

        let notifyAt;
        let body;

        if (event.is_all_day) {
          /** 하루 종일 일정 → 오전 8시 알림 */
          notifyAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0);
          body = '오늘 하루 종일 일정이 있습니다.';
        } else {
          /** 시간 지정 일정 → 시작 시간에 알림 */
          notifyAt = new Date(event.starts_at);
          body = `${notifyAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 일정이 시작됩니다.`;
        }

        const delay = notifyAt.getTime() - now.getTime();

        /** 이미 지난 시간은 건너뜀 */
        if (delay < 0) return;

        const timer = setTimeout(() => {
          new Notification(event.title, {
            body,
            icon: ICON_URL,
          });
        }, delay);

        timersRef.current.push(timer);
      });
    };

    schedule();

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [events]);
}
