import { useEffect } from 'react';

// Smart TV remotes' dedicated Back/Return button doesn't produce a
// consistent signal across platforms — each vendor's browser reports it
// differently, and there's no standard `e.key` for it:
//  - LG webOS:            keyCode 461
//  - Samsung Tizen:       keyCode 10009, key 'XF86Back'
//  - Generic Android TV / remote "back":  key 'GoBack' or 'BrowserBack'
// Escape/Backspace are deliberately NOT included here — Escape already
// opens the pause menu (useGlobalShortcuts) and Backspace is a normal text
// edit key, so treating either as "exit" would misfire on a real keyboard.
const BACK_KEY_NAMES = new Set(['GoBack', 'XF86Back', 'BrowserBack']);
const BACK_KEY_CODES = new Set([461, 10009]);

function isFramed(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    // A cross-origin parent throws on access — that itself only happens
    // when framed.
    return true;
  }
}

/** Posted to the parent frame when the player asks to exit — see README for the host-side contract. */
export const CLOSE_MESSAGE_TYPE = 'egg-catcher:close';

function requestClose() {
  window.parent.postMessage({ type: CLOSE_MESSAGE_TYPE }, '*');
}

/**
 * The game runs inside an iframe on the host TV app, so it has no page of
 * its own to navigate away from or tab to close — closing it is necessarily
 * the host's job. This just turns the remote's Back button into a
 * postMessage the host page listens for and acts on (e.g. removing/hiding
 * the iframe).
 *
 * Many of these TV browsers map Back to an actual `history.back()` rather
 * than (or in addition to) a keydown, which would otherwise navigate the
 * iframe away from the game entirely. Pushing a throwaway history entry up
 * front means that navigation lands on a `popstate` we can intercept instead
 * — the iframe's own history never actually unwinds.
 *
 * No-ops entirely outside an iframe: there's no parent to notify, and
 * capturing browser history on a normal page would be an unwelcome surprise.
 */
export function useExitOnRemoteBack() {
  useEffect(() => {
    if (!isFramed()) return;

    history.pushState(null, '', location.href);

    const onPopState = () => {
      requestClose();
      history.pushState(null, '', location.href);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!BACK_KEY_NAMES.has(e.key) && !BACK_KEY_CODES.has(e.keyCode)) return;
      e.preventDefault();
      requestClose();
    };

    window.addEventListener('popstate', onPopState);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);
}
