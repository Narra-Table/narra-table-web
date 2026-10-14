export const STICK_THRESHOLD_PX = 32;

export function distanceToBottom(
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number,
): number {
  return scrollHeight - scrollTop - clientHeight;
}

export function isStuckToBottom(
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number,
): boolean {
  return distanceToBottom(scrollTop, scrollHeight, clientHeight) < STICK_THRESHOLD_PX;
}

export function compensatePrepend(
  previousScrollHeight: number,
  nextScrollHeight: number,
  scrollTop: number,
): number {
  return scrollTop + (nextScrollHeight - previousScrollHeight);
}

export function shouldStickToBottom(input: {
  stuck: boolean;
  jumping: boolean;
  ownSend: boolean;
}): boolean {
  if (input.jumping) return false;
  if (input.ownSend) return true;
  return input.stuck;
}
