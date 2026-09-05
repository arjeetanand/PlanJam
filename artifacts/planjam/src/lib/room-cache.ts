import type { RoomState } from '@workspace/api-client-react';

export function mergeRoomState(old: RoomState | undefined, data: RoomState): RoomState {
  if (!old) return data;
  const hasViewerIdentity = Boolean(data.viewerParticipantId);

  return {
    ...data,
    viewerParticipantId: data.viewerParticipantId || old.viewerParticipantId,
    viewerPreferences: data.viewerPreferences || old.viewerPreferences,
    viewerVotes: hasViewerIdentity ? data.viewerVotes : old.viewerVotes,
    isHost: data.isHost ?? old.isHost
  };
}
