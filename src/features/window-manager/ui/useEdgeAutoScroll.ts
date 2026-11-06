import { useEffect, useState, type RefObject } from 'react';

const EDGE_PAN_MAX_SPEED = 1400;

export type EdgeAutoScrollDirection = 'left' | 'right' | null;

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

export function useEdgeAutoScroll(
  stripRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): EdgeAutoScrollDirection {
  const [direction, setDirection] = useState<EdgeAutoScrollDirection>(null);

  useEffect(() => {
    if (!enabled) {
      setDirection(null);
      return;
    }
    const strip = stripRef.current;
    if (!strip) return;

    let pointerX: number | null = null;
    let frameId: number | null = null;
    let lastTime: number | null = null;

    const pan = (now: number) => {
      frameId = null;
      if (pointerX === null) return;

      const maxScroll = strip.scrollWidth - strip.clientWidth;
      if (maxScroll <= 0) {
        setDirection(null);
        return;
      }

      const bounds = strip.getBoundingClientRect();
      const zoneWidth = Math.min(window.innerWidth / 24, bounds.width / 2);
      const speed = edgePanSpeed(pointerX, bounds.left, bounds.right, zoneWidth);
      if (speed === 0) {
        setDirection(null);
        return;
      }

      const elapsed = lastTime === null ? 0 : Math.min(now - lastTime, 64) / 1000;
      lastTime = now;
      if (elapsed > 0) {
        strip.scrollLeft = Math.max(
          0,
          Math.min(maxScroll, strip.scrollLeft + speed * EDGE_PAN_MAX_SPEED * elapsed),
        );
      }

      const stuck =
        (speed < 0 && strip.scrollLeft <= 0) || (speed > 0 && strip.scrollLeft >= maxScroll);
      if (stuck) {
        setDirection(null);
        return;
      }
      frameId = requestAnimationFrame(pan);
    };

    const schedule = () => {
      if (frameId !== null) return;
      lastTime = null;
      frameId = requestAnimationFrame(pan);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      const bounds = strip.getBoundingClientRect();
      const zoneWidth = Math.min(window.innerWidth / 24, bounds.width / 2);
      const speed = edgePanSpeed(pointerX, bounds.left, bounds.right, zoneWidth);
      const maxScroll = strip.scrollWidth - strip.clientWidth;
      const stuck =
        maxScroll <= 0 ||
        (speed < 0 && strip.scrollLeft <= 0) ||
        (speed > 0 && strip.scrollLeft >= maxScroll);
      setDirection(stuck || speed === 0 ? null : speed < 0 ? 'left' : 'right');

      const target = event.target;
      if (
        event.buttons !== 0 &&
        target instanceof Element &&
        target.closest('[role="separator"]')
      ) {
        if (frameId !== null) cancelAnimationFrame(frameId);
        frameId = null;
        return;
      }
      schedule();
    };

    const stop = () => {
      pointerX = null;
      setDirection(null);
      if (frameId === null) return;
      cancelAnimationFrame(frameId);
      frameId = null;
    };

    strip.addEventListener('pointermove', onPointerMove);
    strip.addEventListener('pointerleave', stop);
    return () => {
      strip.removeEventListener('pointermove', onPointerMove);
      strip.removeEventListener('pointerleave', stop);
      stop();
    };
  }, [enabled, stripRef]);

  return enabled ? direction : null;
}
