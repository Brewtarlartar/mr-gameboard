import { getPreferences, savePreferences } from '@/lib/storage';

export const AI_CONSENT_EVENT = 'tome:ai-consent-request';

export interface AiConsentRequestDetail {
  resolve: (agreed: boolean) => void;
}

export function hasAiConsent(): boolean {
  return Boolean(getPreferences().aiConsentAt);
}

export function grantAiConsent(): void {
  savePreferences({ ...getPreferences(), aiConsentAt: new Date().toISOString() });
}

/**
 * Resolves true once the reader has agreed to their question being sent to
 * Anthropic, false if they decline. Apple 5.1.2(i) requires that consent
 * before any user content reaches a third-party AI service, so every call
 * site awaits this and sends nothing if it resolves false.
 *
 * Fails closed: if no <AiConsentDialog /> is mounted to answer the event,
 * this resolves false rather than letting the request through unasked.
 */
export function requestAiConsent(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (hasAiConsent()) return Promise.resolve(true);

  return new Promise((resolve) => {
    const event = new CustomEvent<AiConsentRequestDetail>(AI_CONSENT_EVENT, {
      detail: { resolve },
      cancelable: true,
    });
    // The dialog calls preventDefault() to claim the request; dispatchEvent
    // then returns false. A true return means nothing is listening.
    if (window.dispatchEvent(event)) resolve(false);
  });
}
