import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Button, Box, Chip, Divider, IconButton, useMediaQuery, useTheme,
} from '@mui/material';
import {
  Close, Edit, Delete, LocationOn, Notes, Link, Repeat,
  AccessTime, Circle, LocalCafe,
} from '@mui/icons-material';
import CoffeeEventSection from './CoffeeEventSection';
import { isCoffeeEvent, memoTextForForm } from '../../utils/eventCoffee';

const RECURRENCE_LABELS = {
  none: '',
  daily: '매일 반복',
  weekly: '매주 반복',
  monthly: '매월 반복',
  yearly: '매년 반복',
  custom: '사용자 정의 반복',
};

/**
 * 일정 상세 보기 다이얼로그
 *
 * Props:
 * @param {boolean} open - 열림 여부 [Required]
 * @param {function} onClose - 닫기 핸들러 [Required]
 * @param {function} onEdit - 수정 핸들러 (event) => void [Required]
 * @param {function} onDelete - 삭제 핸들러 (eventId) => void [Required]
 * @param {object|null} event - 표시할 이벤트 데이터 [Optional]
 * @param {Array} groups - 내 그룹 목록 (색상 참조용, myRole 포함) [Required]
 * @param {string} currentUserId - 현재 유저 ID [Required]
 * @param {string[]} adminGroupIds - 현재 유저가 관리자인 그룹 ID 목록 [Optional, 기본값: []]
 * @param {function} onShowMessage - (message, severity?) => void 스낵바 등 [Optional]
 *
 * Example usage:
 * <EventDetailDialog open={open} onClose={fn} onEdit={fn} onDelete={fn} event={event} groups={groups} currentUserId={uid} adminGroupIds={ids} onShowMessage={fn} />
 */
function EventDetailDialog({ open, onClose, onEdit, onDelete, event, groups, currentUserId, adminGroupIds = [], onShowMessage }) {
  const theme = useTheme();
  const isNarrow = useMediaQuery(theme.breakpoints.down('sm'));
  if (!event) return null;
  const isCoffee = isCoffeeEvent(event);

  const isOwner = event.creator_id === currentUserId;
  const isGroupAdmin = (event.event_visibility || []).some((v) => adminGroupIds.includes(v.group_id));
  const canEdit = isOwner || isGroupAdmin;
  const eventColor = event.color || '#1976d2';

  const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const formatDateOnly = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const sharedGroups = (event.event_visibility || [])
    .map((v) => groups.find((g) => g.id === v.group_id))
    .filter(Boolean);

  const memoDisplay = memoTextForForm(event.memo);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={isCoffee ? 'sm' : 'xs'}
      fullWidth
      fullScreen={isCoffee && isNarrow}
      scroll="paper"
      PaperProps={{ sx: { borderRadius: isCoffee && isNarrow ? 0 : 3 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flexWrap: 'wrap' }}>
          {isCoffee ? (
            <LocalCafe sx={{ color: eventColor, mt: 0.5, fontSize: 20, flexShrink: 0 }} />
          ) : (
            <Circle sx={{ color: eventColor, mt: 0.5, fontSize: 16, flexShrink: 0 }} />
          )}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography fontWeight={700} sx={{ lineHeight: 1.4 }}>{event.title}</Typography>
            {isCoffee && (
              <Chip
                size="small"
                label="커피 주문 이벤트"
                sx={{ mt: 0.5, bgcolor: 'primary.50', color: 'primary.main', fontWeight: 600 }}
              />
            )}
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ flexShrink: 0 }}>
            <Close fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          maxHeight: isCoffee ? { xs: 'calc(100vh - 180px)', sm: 'min(70vh, 640px)' } : 'none',
          overflowY: isCoffee ? 'auto' : 'visible',
          '& > *': { mb: 1.5 },
        }}
      >
        {/* 시간 */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <AccessTime fontSize="small" color="action" sx={{ mt: 0.2 }} />
          <Box>
            {event.is_all_day ? (
              <Typography variant="body2">
                {formatDateOnly(event.starts_at)}
                {event.ends_at && event.ends_at !== event.starts_at && ` ~ ${formatDateOnly(event.ends_at)}`}
              </Typography>
            ) : (
              <>
                <Typography variant="body2">{formatDate(event.starts_at)}</Typography>
                {event.ends_at && (
                  <Typography variant="body2" color="text.secondary">~ {formatDate(event.ends_at)}</Typography>
                )}
              </>
            )}
          </Box>
        </Box>

        {/* 반복 */}
        {event.recurrence_type && event.recurrence_type !== 'none' && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Repeat fontSize="small" color="action" />
            <Typography variant="body2">{RECURRENCE_LABELS[event.recurrence_type]}</Typography>
          </Box>
        )}

        {/* 장소 */}
        {event.location && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <LocationOn fontSize="small" color="action" />
            <Typography variant="body2">{event.location}</Typography>
          </Box>
        )}

        {/* 메모(커피 태그는 표시용에서 제거) */}
        {memoDisplay && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <Notes fontSize="small" color="action" sx={{ mt: 0.2 }} />
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{memoDisplay}</Typography>
          </Box>
        )}

        {/* URL */}
        {event.url && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Link fontSize="small" color="action" />
            <Typography
              variant="body2"
              component="a"
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: 'primary.main', wordBreak: 'break-all' }}
            >
              {event.url}
            </Typography>
          </Box>
        )}

        {/* 공개 그룹 */}
        {sharedGroups.length > 0 && (
          <>
            <Divider />
            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>공개 그룹</Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                {sharedGroups.map((g) => (
                  <Chip
                    key={g.id}
                    label={g.name}
                    size="small"
                    sx={{ bgcolor: g.color, color: 'white', fontWeight: 500 }}
                  />
                ))}
              </Box>
            </Box>
          </>
        )}

        {isCoffee && (
          <>
            <Divider />
            <CoffeeEventSection
              event={event}
              currentUserId={currentUserId}
              onMessage={onShowMessage}
            />
          </>
        )}
      </DialogContent>

      {canEdit && (
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            startIcon={<Delete />}
            color="error"
            variant="outlined"
            onClick={() => { onDelete(event.id); onClose(); }}
            sx={{ borderRadius: 2 }}
          >
            삭제
          </Button>
          <Button
            startIcon={<Edit />}
            variant="contained"
            onClick={() => { onEdit(event); onClose(); }}
            sx={{ borderRadius: 2 }}
          >
            수정
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}

export default EventDetailDialog;
