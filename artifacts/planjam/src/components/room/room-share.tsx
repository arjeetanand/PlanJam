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

  return (
    <div className="rounded-3xl border border-[#D9D7D0] bg-[#FFF7E8]/80 p-4 sm:p-5">
      <h3 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[.14em] text-[#8A8D9B]">Invite Friends</h3>
      <p aria-live="polite" data-testid="room-capacity-message" className="mb-3 flex items-center gap-2 text-sm font-bold text-[#27304C]">
        <span>{participantCount}/{capacity} joined</span>
        <span aria-hidden="true" className="text-[#B0AFB5]">·</span>
        <span className={isFull ? 'text-[#A83F31]' : 'text-[#37A28C]'}>
          {isFull ? 'Room is full' : `${spotsRemaining} ${spotsRemaining === 1 ? 'spot' : 'spots'} left`}
        </span>
      </p>
      <div className="flex flex-col gap-2 min-[420px]:flex-row">
        <input
          ref={inputRef}
          type="text"
          readOnly
          value={shareUrl}
          aria-label="Room invite link"
          data-testid="input-room-link"
          className="flex-1 min-w-0 rounded-xl border border-[#D9D7D0] bg-[#FFFDF5] px-3 py-2 text-xs text-[#6A6E80] outline-none focus:border-[#F26F52] focus:ring-2 focus:ring-[#F26F52]/20"
        />
        <button
          onClick={handleCopy}
          type="button"
          aria-label={copyState === 'copied' ? 'Room link copied' : 'Copy room link'}
          className="flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-[#27304C] px-3 text-[#FFF7E8] transition-colors hover:bg-[#3B4668] min-[420px]:w-12"
          title="Copy link"
          data-testid="button-copy-link"
        >
          {copyState === 'copied' ? <CheckCircle2 size={16} className="text-[#37A28C]" /> : <Copy size={16} />}
        </button>
      </div>
      <p className={`mt-2 min-h-4 text-xs font-bold ${statusClass}`} aria-live="polite" data-testid="status-copy-link">{statusMessage}</p>
    </div>
  );
}
