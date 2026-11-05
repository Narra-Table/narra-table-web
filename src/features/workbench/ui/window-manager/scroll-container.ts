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

/**
 * Signed edge-hover pan intensity in [-1, 1]. Negative pans left, positive pans
 * right, and zero means the pointer is outside both zones. Speed ramps from
 * zero at the inner border of the zone to ±1 at the very edge.
 */
export function edgePanSpeed(
  pointerX: number,
  left: number,
  right: number,
  zoneWidth: number,
): number {
  if (zoneWidth <= 0) return 0;
  const fromLeft = pointerX - left;
  const fromRight = right - pointerX;
  if (fromLeft >= 0 && fromLeft < zoneWidth) return -(1 - fromLeft / zoneWidth);
  if (fromRight >= 0 && fromRight < zoneWidth) return 1 - fromRight / zoneWidth;
  return 0;
}
