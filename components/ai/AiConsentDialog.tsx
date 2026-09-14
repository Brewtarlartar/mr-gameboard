'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Dialog from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import {
  AI_CONSENT_EVENT,
  grantAiConsent,
  type AiConsentRequestDetail,
} from '@/lib/ai/consent';

/**
 * Mounted once per app. Apple 5.1.2(i) requires explicit consent before user
 * content reaches a third-party AI service, so this asks the first time
 * someone sends a question and records the answer in their preferences.
 *
 * The wording tracks the Anthropic paragraph in /about/privacy — keep the two
 * in step if either changes.
 */
export default function AiConsentDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const resolveRef = useRef<((agreed: boolean) => void) | null>(null);

  useEffect(() => {
    const onRequest = (event: Event) => {
      const detail = (event as CustomEvent<AiConsentRequestDetail>).detail;
      if (!detail?.resolve) return;
      event.preventDefault(); // claims the request — see requestAiConsent()
      resolveRef.current = detail.resolve;
      setIsOpen(true);
    };
    window.addEventListener(AI_CONSENT_EVENT, onRequest);
    return () => window.removeEventListener(AI_CONSENT_EVENT, onRequest);
  }, []);

  const settle = useCallback((agreed: boolean) => {
    if (agreed) grantAiConsent();
    setIsOpen(false);
    resolveRef.current?.(agreed);
    resolveRef.current = null;
  }, []);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => settle(false)}
      labelledBy="ai-consent-title"
      className="max-w-lg"
    >
      <div className="p-6 flex flex-col gap-4">
        <h2 id="ai-consent-title" className="text-xl font-semibold text-ink">
          Before you ask
        </h2>

        <div className="flex flex-col gap-3 text-sm text-ink-muted/90 leading-relaxed">
          <p>
            Your questions are answered by Claude, an AI service from{' '}
            <span className="text-ink">Anthropic (PBC)</span>.
          </p>
          <p>
            When you ask, we send Anthropic your question and the relevant game
            details, including the rulebook when one is attached.
          </p>
          <p>
            We do not send your name, email, or account details. Anthropic
            processes this as our service provider and does not train its models
            on it by default.
          </p>
          <p>
            <Link
              href="/about/privacy"
              className="text-gold-strong underline underline-offset-4 hover:text-gold"
            >
              Read the full Privacy Policy
            </Link>
          </p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={() => settle(false)}>
            Not now
          </Button>
          <Button variant="primary" onClick={() => settle(true)}>
            Agree and continue
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
