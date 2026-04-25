import { useState, useMemo } from 'react';
import {
  Box, Typography, Button, TextField, ToggleButton, ToggleButtonGroup,
  Divider, List, ListItem, ListItemText, Chip, CircularProgress, Alert,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { LocalCafe } from '@mui/icons-material';
import { useCoffeeOrders } from '../../hooks/useCoffeeOrders';
import {
  COFFEE_MENU_TYPES,
  buildCoffeeSummary,
  formatCoffeeOrderLabel,
  orderToFormState,
} from '../../utils/coffeeMenu';

/**
 * 저장 폼(서버 주문이 바뀌면 key로 리마운트)
 */
function CoffeeOrderForm({ initialOrder, saving, onSave, onMessage }) {
  const init = orderToFormState(initialOrder);
  const [menuType, setMenuType] = useState(init.menuType);
  const [stdTemp, setStdTemp] = useState(init.stdTemp);
  const [customText, setCustomText] = useState(init.customText);
  const [customTemp, setCustomTemp] = useState(init.customTemp);

  const handleMenuChange = (e) => {
    const v = e.target.value;
    setMenuType(v);
    if (v === 'custom') {
      setStdTemp('ice');
    } else {
      setCustomText('');
      setCustomTemp(null);
    }
  };

  const handleSave = async () => {
    if (menuType === 'custom' && !customText.trim()) {
      onMessage?.('기타 메뉴 이름을 입력해 주세요.', 'error');
      return;
    }
    const payload = menuType === 'custom'
      ? { menu_type: 'custom', temperature: customTemp, custom_text: customText }
      : { menu_type: menuType, temperature: stdTemp, custom_text: null };
    const { error } = await onSave(payload);
    if (error) {
      onMessage?.(error.message || '주문 저장에 실패했습니다.', 'error');
    } else {
      onMessage?.('주문이 저장되었습니다.', 'success');
    }
  };

  return (
    <>
      <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
        <InputLabel id="coffee-menu-label">메뉴</InputLabel>
        <Select
          labelId="coffee-menu-label"
          label="메뉴"
          value={menuType}
          onChange={handleMenuChange}
        >
          {COFFEE_MENU_TYPES.map((m) => (
            <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {menuType !== 'custom' ? (
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
            온도
          </Typography>
          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            value={stdTemp}
            onChange={(_, v) => v && setStdTemp(v)}
          >
            <ToggleButton value="ice">아이스</ToggleButton>
            <ToggleButton value="hot">핫</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      ) : (
        <>
          <TextField
            fullWidth
            size="small"
            label="기타 (직접 입력)"
            placeholder="예: 아인슈페너, 아샷추, 바닐라라떼"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            inputProps={{ maxLength: 80 }}
            sx={{ mb: 1.5 }}
          />
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
              온도 (선택)
            </Typography>
            <ToggleButtonGroup
              exclusive
              fullWidth
              size="small"
              value={customTemp === null ? 'none' : customTemp}
              onChange={(_, v) => {
                if (v == null) return;
                if (v === 'none') setCustomTemp(null);
                else if (v === 'ice' || v === 'hot') setCustomTemp(v);
              }}
            >
              <ToggleButton value="ice">아이스</ToggleButton>
              <ToggleButton value="hot">핫</ToggleButton>
              <ToggleButton value="none">온도 없음</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </>
      )}

      <Button
        fullWidth
        variant="contained"
        onClick={handleSave}
        disabled={saving}
        sx={{ borderRadius: 2, mb: 2 }}
      >
        {saving ? <CircularProgress size={22} color="inherit" /> : '내 주문 저장'}
      </Button>
    </>
  );
}

/**
 * 그룹 공개 '커피' 일정: 메뉴 선택·집계·명단
 */
function CoffeeEventSection({ event, currentUserId, onMessage }) {
  const { orders, loading, saving, saveMyOrder } = useCoffeeOrders(
    event?.id ?? null,
    currentUserId ?? null,
  );

  const myOrder = useMemo(
    () => orders.find((o) => o.user_id === currentUserId),
    [orders, currentUserId],
  );

  const formKey = myOrder
    ? `${myOrder.id}-${myOrder.updated_at || ''}`
    : 'new';

  const { summaryLines, nameLines } = useMemo(() => buildCoffeeSummary(orders), [orders]);

  if (!currentUserId) {
    return (
      <Alert severity="info" sx={{ borderRadius: 2 }}>
        로그인 후 메뉴를 선택할 수 있습니다.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <LocalCafe color="primary" fontSize="small" />
        <Typography variant="subtitle2" fontWeight={700} color="primary">
          커피 주문
        </Typography>
      </Box>

      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
        메뉴를 고르고 저장하면 그룹 집계에 반영됩니다. 한 잔씩 선택해 주세요.
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <>
          <CoffeeOrderForm
            key={formKey}
            initialOrder={myOrder}
            saving={saving}
            onSave={saveMyOrder}
            onMessage={onMessage}
          />

          {myOrder && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              내 선택: <strong>{formatCoffeeOrderLabel(myOrder)}</strong>
            </Typography>
          )}

          <Divider sx={{ my: 1.5 }} />

          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
            집계
          </Typography>
          {summaryLines.length === 0 ? (
            <Typography variant="body2" color="text.secondary">아직 주문이 없습니다.</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
              {summaryLines.map(({ label, count }) => (
                <Chip key={label} label={`${label} ${count}개`} size="small" color="default" variant="outlined" />
              ))}
            </Box>
          )}

          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
            명단
          </Typography>
          <List dense disablePadding sx={{ bgcolor: 'action.hover', borderRadius: 2, px: 1, py: 0.5 }}>
            {nameLines.length === 0 ? (
              <ListItem>
                <ListItemText primary="—" />
              </ListItem>
            ) : (
              nameLines.map((row) => (
                <ListItem key={row.userId} disableGutters sx={{ py: 0.4 }}>
                  <ListItemText
                    primary={(
                      <Typography variant="body2" component="span">
                        {row.name}
                        <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                          — {row.label}
                        </Typography>
                      </Typography>
                    )}
                  />
                </ListItem>
              ))
            )}
          </List>
        </>
      )}
    </Box>
  );
}

export default CoffeeEventSection;
