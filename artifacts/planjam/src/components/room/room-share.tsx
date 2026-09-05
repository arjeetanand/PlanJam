import { useRef, useState } from 'react';
import { Copy, CheckCircle2 } from 'lucide-react';

export function RoomShare({ slug, participantCount, capacity }: { slug: string; participantCount: number; capacity: number }) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'selected' | 'error'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
  const shareUrl = `${window.location.origin}${basePath}/room/${slug}`;
  const spotsRemaining = Math.max(capacity - participantCount, 0);
  const isFull = spotsRemaining === 0;

  const selectShareUrl = () => {
    const input = inputRef.current;
    if (!input) return false;
    input.focus();
    input.select();
    input.setSelectionRange(0, input.value.length);
    return true;
  };

  const handleCopy = async () => {
    setCopyState('idle');
    try {
      if (typeof navigator.clipboard?.writeText === 'function') {
        await navigator.clipboard.writeText(shareUrl);
        setCopyState('copied');
        setTimeout(() => setCopyState('idle'), 2000);
        return;
      }
    } catch {
      // Continue to the legacy copy and manual selection fallbacks.
    }

    const selected = selectShareUrl();
    try {
      if (selected && typeof document.execCommand === 'function' && document.execCommand('copy')) {
        setCopyState('copied');
        setTimeout(() => setCopyState('idle'), 2000);
        return;
      }
    } catch {
      // The link is still selected, so the user can use the keyboard copy shortcut.
    }

    setCopyState(selected ? 'selected' : 'error');
  };

  const statusMessage = {
    idle: '',
    copied: 'Link copied — send it to the crew.',
    selected: 'Link selected — press Ctrl/Cmd+C to copy.',
    error: 'Copy failed. Select the link and copy it manually.',
  }[copyState];

  const statusClass = copyState === 'error' ? 'text-[#A83F31]' : 'text-[#277865]';

  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: 'PlanJam Hangout Invite',
        url: shareUrl,
      });
    } catch {
      // Fall back to copying if dismissed or aborted
      handleCopy();
    }
  };

  return (
    <div className="rounded-3xl border-2 border-[#27304C] bg-[#FFFDF5] p-5 shadow-[4px_4px_0_#27304C] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-[#F26F52]">Invite Crew</h3>
          <h4 className="font-display text-lg font-bold text-[#27304C]">Bring friends into the room</h4>
        </div>
        <span
          aria-live="polite"
          data-testid="room-capacity-message"
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] font-bold ${
            isFull
              ? 'bg-[#FFD9D3] text-[#A83F31]'
              : 'bg-[#DBF1E6] text-[#1F655B]'
          }`}
        >
          <span>{participantCount}/{capacity}</span>
          <span>·</span>
          <span>{isFull ? 'Room full' : `${spotsRemaining} left`}</span>
        </span>
      </div>

      {canNativeShare && (
        <button
          type="button"
          onClick={handleNativeShare}
          className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#F26F52] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#FFFDF5] shadow-[0_3px_0_#A83F31] transition-all hover:bg-[#E55B3D] active:translate-y-0.5"
        >
          <span>Share Room Invite</span>
        </button>
      )}

      <div className="mt-3 flex flex-col gap-2 min-[420px]:flex-row">
        <input
          ref={inputRef}
          type="text"
          readOnly
          value={shareUrl}
          aria-label="Room invite link"
          data-testid="input-room-link"
          className="min-w-0 flex-1 rounded-xl border border-[#D9D7D0] bg-[#FFF7E8]/60 px-3.5 py-2.5 font-mono text-xs text-[#27304C] outline-none transition-colors focus:border-[#F26F52] focus:ring-2 focus:ring-[#F26F52]/20"
        />
        <button
          onClick={handleCopy}
          type="button"
          aria-label={copyState === 'copied' ? 'Room link copied' : 'Copy room link'}
          className={`flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border-2 px-4 text-xs font-bold transition-all active:translate-y-0.5 min-[420px]:w-auto ${
            copyState === 'copied'
              ? 'border-[#37A28C] bg-[#DBF1E6] text-[#1F655B] shadow-[0_3px_0_#2B7F6D]'
              : 'border-[#27304C] bg-[#27304C] text-[#FFF7E8] shadow-[0_3px_0_#171D2F] hover:bg-[#3B4668]'
          }`}
          title="Copy link"
          data-testid="button-copy-link"
        >
          {copyState === 'copied' ? (
            <>
              <CheckCircle2 size={16} className="text-[#37A28C]" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={16} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <p className={`mt-2 min-h-4 text-xs font-bold ${statusClass}`} aria-live="polite" data-testid="status-copy-link">{statusMessage}</p>
    </div>
  );
}
