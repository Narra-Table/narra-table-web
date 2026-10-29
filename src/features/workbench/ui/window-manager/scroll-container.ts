export interface ScrollBox {
  left: number;
  right: number;
  width: number;
}

/**
 * How far the strip's scrollLeft must move so the column container sits inside
 * the strip. A container wider than the strip aligns to its leading edge.
 * Window boxes are not used: a portaled window is inset from the column.
 */
export function containerScrollLeft(
  strip: ScrollBox & { scrollLeft: number },
  container: ScrollBox,
): number {
  if (container.width >= strip.width) {
    return strip.scrollLeft + (container.left - strip.left);
  }
  if (container.left < strip.left) {
    return strip.scrollLeft - (strip.left - container.left);
  }
  if (container.right > strip.right) {
    return strip.scrollLeft + (container.right - strip.right);
  }
  return strip.scrollLeft;
}

export function alignContainerInStrip(
  strip: HTMLElement,
  container: HTMLElement,
  behavior: ScrollBehavior,
): void {
  const stripBox = strip.getBoundingClientRect();
  const box = container.getBoundingClientRect();
  const next = containerScrollLeft(
    {
      scrollLeft: strip.scrollLeft,
      left: stripBox.left,
      right: stripBox.right,
      width: stripBox.width,
    },
    { left: box.left, right: box.right, width: box.width },
  );
  if (Math.abs(next - strip.scrollLeft) < 1) return;
  if (typeof strip.scrollTo === 'function') {
    strip.scrollTo({ left: next, behavior });
    return;
  }
  strip.scrollLeft = next;
}
