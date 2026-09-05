import { useState } from 'react';
import { Copy, CheckCircle2 } from 'lucide-react';

export function RoomShare({ slug, participantCount, capacity }: { slug: string; participantCount: number; capacity: number }) {
  const [copied, setCopied] = useState(false);
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
  const shareUrl = `${window.location.origin}${basePath}/room/${slug}`;
  const spotsRemaining = Math.max(capacity - participantCount, 0);
  const isFull = spotsRemaining === 0;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  return (
    <div className="rounded-3xl border border-[#D9D7D0] bg-[#FFF7E8]/80 p-5">
      <h3 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[.14em] text-[#8A8D9B]">Invite Friends</h3>
      <p aria-live="polite" data-testid="room-capacity-message" className="mb-3 flex items-center gap-2 text-sm font-bold text-[#27304C]">
        <span>{participantCount}/{capacity} joined</span>
        <span aria-hidden="true" className="text-[#B0AFB5]">·</span>
        <span className={isFull ? 'text-[#A83F31]' : 'text-[#37A28C]'}>
          {isFull ? 'Room is full' : `${spotsRemaining} ${spotsRemaining === 1 ? 'spot' : 'spots'} left`}
        </span>
      </p>
      <div className="flex gap-2">
        <input 
          type="text" 
          readOnly 
          value={shareUrl}
          className="flex-1 min-w-0 rounded-xl border border-[#D9D7D0] bg-[#FFFDF5] px-3 py-2 text-xs text-[#6A6E80] outline-none"
        />
        <button 
          onClick={handleCopy}
          className="flex shrink-0 items-center justify-center rounded-xl bg-[#27304C] px-3 text-[#FFF7E8] transition-colors hover:bg-[#3B4668]"
          title="Copy link"
          data-testid="button-copy-link"
        >
          {copied ? <CheckCircle2 size={16} className="text-[#37A28C]" /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  );
}
