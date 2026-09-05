export function getTokens(slug: string) {
  return {
    participantToken: localStorage.getItem(`planjam_participant_${slug}`),
    hostToken: localStorage.getItem(`planjam_host_${slug}`)
  };
}

export function saveTokens(slug: string, participantToken?: string, hostToken?: string) {
  if (participantToken) localStorage.setItem(`planjam_participant_${slug}`, participantToken);
  if (hostToken) localStorage.setItem(`planjam_host_${slug}`, hostToken);
}

export function getAuthHeaders(slug: string) {
  const { participantToken, hostToken } = getTokens(slug);
  const headers: Record<string, string> = {};
  if (participantToken) headers['X-Participant-Token'] = participantToken;
  if (hostToken) headers['X-Host-Token'] = hostToken;
  return headers;
}
