/**
 * Freemium gate backed by Play Billing.
 *
 * The free tier is the whole app: unlimited lookups, unlimited saves, the full
 * review deck. The paid unlock adds power tools. Nothing a first-time user
 * needs is behind the paywall — see docs/monetization.md for the split.
 *
 * Web (no Play) gets a no-op provider so the paywall never appears in a
 * browser or in the self-hosted app.
 */

const FREE_FEATURES = ['unlimited-lookups', 'unlimited-saves', 'review-deck'];
const PRO_FEATURES = ['review-history', 'smart-review', 'export-list'];

// Play product/subscription ids come from Play Console; overridable for testing.
const PRODUCT_ID = globalThis.VOCAB_PRO_PRODUCT_ID ?? 'vocab_pro_unlock';

const native = () => !!(globalThis.Capacitor?.isNativePlatform?.());

let billing = null;
let unlocked = false;
const listeners = new Set();

const loadBilling = async () => {
  if (billing) return billing;
  if (!native()) return null;
  const mod = await import('capacitor-billing');
  const client = mod.CapacitorBilling.createPlugin();
  await client.initialize({ productIds: [PRODUCT_ID] });
  billing = client;
  return billing;
};

const notify = () => { for (const fn of listeners) fn(unlocked); };

/** Re-read entitlement from Play. Safe to call repeatedly. */
export async function refreshEntitlement() {
  const client = await loadBilling();
  if (!client) return false;
  try {
    const { purchases } = await client.queryPurchases({ productIds: [PRODUCT_ID] });
    unlocked = Array.isArray(purchases) && purchases.some(p => p.productId === PRODUCT_ID);
  } catch (e) {
    // Treat an unreachable billing service as "not unlocked" rather than
    // throwing: a network blip must never lock out or corrupt a free session.
    console.warn('[billing] queryPurchases failed, treating as free:', e);
    unlocked = false;
  }
  notify();
  return unlocked;
}

/** Show the native purchase sheet. Resolves true when a purchase completes. */
export async function purchase() {
  const client = await loadBilling();
  if (!client) return false;
  try {
    const { purchase } = await client.purchase({
      productId: PRODUCT_ID,
      type: 'inapp',
    });
    if (purchase?.productId === PRODUCT_ID) {
      unlocked = true;
      notify();
      return true;
    }
    return false;
  } catch (e) {
    console.warn('[billing] purchase cancelled or failed:', e);
    return false;
  }
}

export const isPro = () => unlocked;
export const hasFeature = feature => (unlocked ? PRO_FEATURES.includes(feature) : FREE_FEATURES.includes(feature));
export const onEntitlementChange = fn => { listeners.add(fn); return () => listeners.delete(fn); };
export const PRO_FEATURE_LIST = PRO_FEATURES;
