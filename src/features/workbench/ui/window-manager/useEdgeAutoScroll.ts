import { useEffect, type RefObject } from 'react';
import { edgePanSpeed } from './scroll-container';

/** Pan speed in pixels per second at the very screen edge. */
const EDGE_PAN_MAX_SPEED = 1400;

/**
 * Pans the column strip while the pointer hovers the left or right edge of the
 * stage. The active zone is at most `viewport width / 24` wide, and the speed
 * ramps from zero at its inner border to the maximum at the screen edge.
 */
export function useEdgeAutoScroll(
  stageRef: RefObject<HTMLElement | null>,
  stripRef: RefObject<HTMLElement | null>,
  enabled = true,
): void {
  useEffect(() => {
    if (!enabled) return;
    const stage = stageRef.current;
    const strip = stripRef.current;
    if (!stage || !strip) return;

    let pointerX: number | null = null;
    let frameId: number | null = null;
    let lastTime: number | null = null;

    const pan = (now: number) => {
      frameId = null;
      if (pointerX === null) return;

      const maxScroll = strip.scrollWidth - strip.clientWidth;
      if (maxScroll <= 0) return;

      const rect = stage.getBoundingClientRect();
      const zoneWidth = Math.min(window.innerWidth / 24, (rect.right - rect.left) / 2);
      const speed = edgePanSpeed(pointerX, rect.left, rect.right, zoneWidth);
      if (speed === 0) return;

      const dt = lastTime === null ? 0 : Math.min(now - lastTime, 64) / 1000;
      lastTime = now;
      if (dt > 0) {
        const before = strip.scrollLeft;
        strip.scrollLeft = Math.max(0, Math.min(maxScroll, before + speed * EDGE_PAN_MAX_SPEED * dt));
      }

      const stuck =
        (speed < 0 && strip.scrollLeft <= 0) || (speed > 0 && strip.scrollLeft >= maxScroll);
      if (!stuck) frameId = requestAnimationFrame(pan);
    };

    const schedule = () => {
      if (frameId === null) {
        lastTime = null;
        frameId = requestAnimationFrame(pan);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      schedule();
    };

    const onPointerLeave = () => {
      pointerX = null;
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
    };

    stage.addEventListener('pointermove', onPointerMove);
    stage.addEventListener('pointerleave', onPointerLeave);
    return () => {
      stage.removeEventListener('pointermove', onPointerMove);
      stage.removeEventListener('pointerleave', onPointerLeave);
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }, [stageRef, stripRef, enabled]);
}
