import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zxxomssbzidyovtfvwdc.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const rawSupabase = SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

/**
 * Объект supabase с методом rpc() для атомарного инкремента и синхронизации баланса:
 * const { data, error } = await supabase.rpc('increment_balance', { user_id_param: tgId, delta_param: localDelta });
 */
export const supabase = {
    rpc: async (funcName, params) => {
        // 1. Пробуем прямой вызов в Supabase при наличии анон-ключа
        if (rawSupabase) {
            try {
                const res = await rawSupabase.rpc(funcName, params);
                if (!res.error && res.data) {
                    const balanceVal = res.data?.balance ?? (typeof res.data === 'number' ? res.data : null);
                    return { data: { balance: balanceVal }, error: null };
                }
            } catch (err) {
                console.debug('[Direct RPC fallback to API]:', err.message);
            }
        }

        // 2. Надежный вызов через защищенный API (/api/sync)
        try {
            const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
            const tg = window.Telegram?.WebApp;
            const initData = tg?.initData || 'dev_mode';

            const response = await fetch(`${API_URL}/api/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `tma ${initData}`,
                },
                body: JSON.stringify({
                    rpc: funcName,
                    user_id_param: params.user_id_param,
                    delta_param: params.delta_param,
                }),
            });

            if (response.ok) {
                const json = await response.json();
                const bal = json.data?.balance ?? json.user?.balance ?? json.balance;
                return {
                    data: { balance: Number(bal ?? 0) },
                    error: null,
                };
            }

            const errJson = await response.json().catch(() => ({}));
            return { data: null, error: new Error(errJson.error || `HTTP ${response.status}`) };
        } catch (err) {
            return { data: null, error: err };
        }
    },
};
