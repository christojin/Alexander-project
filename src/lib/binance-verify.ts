import crypto from "crypto";

const BINANCE_API_BASE = "https://api.binance.com";

// ── Types ──────────────────────────────────────────────────

interface BinanceDeposit {
  id: string;
  amount: string;
  coin: string;
  network: string;
  status: number; // 0=pending, 6=credited, 1=success
  address: string;
  addressTag: string; // memo/tag
  txId: string;
  insertTime: number;
  confirmTimes: string;
}

export interface VerifyResult {
  verified: boolean;
  txId?: string;
  actualAmount?: number;
  depositTime?: number;
}

export interface DepositInfo {
  address: string;
  coin: string;
  network: string;
}

// ── Configuration ──────────────────────────────────────────

export function isBinanceVerifyConfigured(): boolean {
  return !!(
    process.env.BINANCE_SPOT_API_KEY &&
    process.env.BINANCE_SPOT_SECRET_KEY
  );
}

export function getBinanceDepositInfo(): DepositInfo {
  return {
    address: process.env.BINANCE_DEPOSIT_ADDRESS ?? "",
    coin: process.env.BINANCE_DEPOSIT_COIN ?? "USDT",
    network: process.env.BINANCE_DEPOSIT_NETWORK ?? "TRC20",
  };
}

// ── Memo Code Generation ───────────────────────────────────

/**
 * Generate a unique memo code for deposit identification.
 * Format: VM-XXXXXXXX (8 alphanumeric uppercase chars)
 */
export function generateMemoCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid confusion
  const bytes = crypto.randomBytes(8);
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `VM-${code}`;
}

// ── Binance Spot API Signing ───────────────────────────────

function signBinanceRequest(
  params: Record<string, string | number>
): string {
  const secretKey = process.env.BINANCE_SPOT_SECRET_KEY;
  if (!secretKey) throw new Error("BINANCE_SPOT_SECRET_KEY not set");

  const queryString = Object.entries(params)
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  return crypto
    .createHmac("sha256", secretKey)
    .update(queryString)
    .digest("hex");
}

// ── Query Binance Deposit History ──────────────────────────

/**
 * Query deposit history from Binance Spot API.
 * Endpoint: GET /sapi/v1/capital/deposit/hisrec
 * Requires read-only API key permissions.
 */
export async function queryBinanceDeposits(params?: {
  coin?: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
}): Promise<BinanceDeposit[]> {
  const apiKey = process.env.BINANCE_SPOT_API_KEY;
  if (!apiKey) return [];

  const queryParams: Record<string, string | number> = {
    timestamp: Date.now(),
    recvWindow: 10000,
  };

  if (params?.coin) queryParams.coin = params.coin;
  if (params?.startTime) queryParams.startTime = params.startTime;
  if (params?.endTime) queryParams.endTime = params.endTime;
  if (params?.limit) queryParams.limit = params.limit;

  const signature = signBinanceRequest(queryParams);
  const queryString = Object.entries(queryParams)
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  try {
    const response = await fetch(
      `${BINANCE_API_BASE}/sapi/v1/capital/deposit/hisrec?${queryString}&signature=${signature}`,
      {
        method: "GET",
        headers: { "X-MBX-APIKEY": apiKey },
      }
    );

    if (!response.ok) {
      console.error(
        "[Binance Verify] API error:",
        response.status,
        await response.text()
      );
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("[Binance Verify] Query deposits error:", error);
    return [];
  }
}

// ── Verify a Specific Deposit ──────────────────────────────

/**
 * Check if a deposit matching the memo code and expected amount has been received.
 * Queries the last 60 minutes of deposits.
 *
 * Matching criteria:
 * - addressTag (memo) === memoCode (case-insensitive)
 * - |amount - expectedAmount| < 0.01 (tolerance for rounding)
 * - status === 1 (success) or status === 6 (credited)
 */
export async function verifyBinanceDeposit(
  memoCode: string,
  expectedAmount: number,
  coin?: string
): Promise<VerifyResult> {
  if (!isBinanceVerifyConfigured()) {
    return { verified: false };
  }

  const depositCoin = coin ?? process.env.BINANCE_DEPOSIT_COIN ?? "USDT";
  const startTime = Date.now() - 60 * 60 * 1000; // last 60 minutes

  const deposits = await queryBinanceDeposits({
    coin: depositCoin,
    startTime,
    limit: 100,
  });

  for (const deposit of deposits) {
    // Match memo code (case-insensitive)
    if (deposit.addressTag?.toUpperCase() !== memoCode.toUpperCase()) {
      continue;
    }

    // Match amount with tolerance
    const depositAmount = parseFloat(deposit.amount);
    if (Math.abs(depositAmount - expectedAmount) > 0.01) {
      continue;
    }

    // Check status: 1 = success, 6 = credited to account
    if (deposit.status !== 1 && deposit.status !== 6) {
      continue;
    }

    return {
      verified: true,
      txId: deposit.txId,
      actualAmount: depositAmount,
      depositTime: deposit.insertTime,
    };
  }

  return { verified: false };
}

/**
 * Batch verify multiple pending deposits at once.
 * Makes a single Binance API call and matches against all pending memos.
 * Used by the Inngest cron to avoid excessive API calls.
 */
export async function batchVerifyDeposits(
  pendingItems: Array<{
    memoCode: string;
    expectedAmount: number;
    coin: string;
  }>
): Promise<Map<string, VerifyResult>> {
  const results = new Map<string, VerifyResult>();

  if (!isBinanceVerifyConfigured() || pendingItems.length === 0) {
    for (const item of pendingItems) {
      results.set(item.memoCode, { verified: false });
    }
    return results;
  }

  // Get all coins we need to check
  const coins = [...new Set(pendingItems.map((i) => i.coin))];
  const allDeposits: BinanceDeposit[] = [];
  const startTime = Date.now() - 60 * 60 * 1000;

  for (const coin of coins) {
    const deposits = await queryBinanceDeposits({
      coin,
      startTime,
      limit: 100,
    });
    allDeposits.push(...deposits);
  }

  // Match each pending item against deposits
  for (const item of pendingItems) {
    let found = false;

    for (const deposit of allDeposits) {
      if (deposit.addressTag?.toUpperCase() !== item.memoCode.toUpperCase()) {
        continue;
      }

      const depositAmount = parseFloat(deposit.amount);
      if (Math.abs(depositAmount - item.expectedAmount) > 0.01) {
        continue;
      }

      if (deposit.status !== 1 && deposit.status !== 6) {
        continue;
      }

      results.set(item.memoCode, {
        verified: true,
        txId: deposit.txId,
        actualAmount: depositAmount,
        depositTime: deposit.insertTime,
      });
      found = true;
      break;
    }

    if (!found) {
      results.set(item.memoCode, { verified: false });
    }
  }

  return results;
}
