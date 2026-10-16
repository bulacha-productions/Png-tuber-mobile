/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { CharacterConfig } from '../types.ts';

export interface AvatarViewRef {
  getCurrentState: () => {
    imgSrc: string;
    isBlinking: boolean;
    bounceOffset: number;
  };
}

interface AvatarViewProps {
  character: CharacterConfig;
  isSpeaking: boolean;
  isInteractiveDragging?: boolean;
  onPositionChange?: (x: number, y: number) => void;
  scaleMultiplier?: number;
  className?: string;
}

export const AvatarView = forwardRef<AvatarViewRef, AvatarViewProps>(({
  character,
  isSpeaking,
  isInteractiveDragging = false,
  onPositionChange,
  scaleMultiplier = 1,
  className = '',
}, ref) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [bounceOffset, setBounceOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0, initialX: 0, initialY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Natural eye-blinking loop
  useEffect(() => {
    let blinkTimeout: number;
    let durationTimeout: number;

    const scheduleNextBlink = () => {
      // Add slight randomness to blink interval (+/- 25%)
      const jitter = (Math.random() - 0.5) * 0.5;
      const interval = Math.max(1200, character.blinkInterval * (1 + jitter));

      blinkTimeout = window.setTimeout(() => {
        setIsBlinking(true);

        durationTimeout = window.setTimeout(() => {
          setIsBlinking(false);
          scheduleNextBlink();
        }, character.blinkDuration);
      }, interval);
    };

    scheduleNextBlink();

    return () => {
      clearTimeout(blinkTimeout);
      clearTimeout(durationTimeout);
    };
  }, [character.blinkInterval, character.blinkDuration]);

  // Bounce physics loop when speaking
  useEffect(() => {
    if (!isSpeaking || character.bounceStrength === 0) {
      setBounceOffset(0);
      return;
    }

    let frameId: number;
    const startTime = performance.now();

    const animateBounce = (now: number) => {
      const elapsed = now - startTime;
      const cycle = (elapsed % character.bounceSpeed) / character.bounceSpeed;
      // Sinusoidal bounce curve
      const bounce = Math.sin(cycle * Math.PI) * character.bounceStrength;
      setBounceOffset(bounce);
      frameId = requestAnimationFrame(animateBounce);
    };

    frameId = requestAnimationFrame(animateBounce);

    return () => {
      cancelAnimationFrame(frameId);
      setBounceOffset(0);
    };
  }, [isSpeaking, character.bounceStrength, character.bounceSpeed]);

  // Determine which of the 4 sprite slots to show
  let currentSprite = character.images.eyesOpenMouthClosed;
  if (!isBlinking && !isSpeaking) {
    currentSprite = character.images.eyesOpenMouthClosed; // Repouso
  } else if (!isBlinking && isSpeaking) {
    currentSprite = character.images.eyesOpenMouthOpen; // Falando com olhos abertos
  } else if (isBlinking && !isSpeaking) {
    currentSprite = character.images.eyesClosedMouthClosed; // Piscando em repouso
  } else if (isBlinking && isSpeaking) {
    currentSprite = character.images.eyesClosedMouthOpen; // Piscando enquanto fala
  }

  // Fallback to eyesOpenMouthClosed if other slots are unset
  if (!currentSprite) {
    currentSprite = character.images.eyesOpenMouthClosed;
  }

  // Expose current render state to parent (e.g. recording engine)
  useImperativeHandle(ref, () => ({
    getCurrentState: () => ({
      imgSrc: currentSprite,
      isBlinking,
      bounceOffset,
    }),
  }), [currentSprite, isBlinking, bounceOffset]);

  // Drag handles for positioning mode
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isInteractiveDragging || !onPositionChange) return;
    e.preventDefault();
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: character.positionX,
      initialY: character.positionY,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !onPositionChange) return;
    const parent = containerRef.current?.parentElement;
    if (!parent) return;

    const parentRect = parent.getBoundingClientRect();
    const deltaX = e.clientX - dragStartPos.current.x;
    const deltaY = e.clientY - dragStartPos.current.y;

    const deltaPercentX = (deltaX / parentRect.width) * 100;
    const deltaPercentY = (deltaY / parentRect.height) * 100;

    const newX = Math.max(5, Math.min(95, dragStartPos.current.initialX + deltaPercentX));
    const newY = Math.max(5, Math.min(95, dragStartPos.current.initialY + deltaPercentY));

    onPositionChange(newX, newY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // pointer capture release error safely ignored
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        transform: `translateY(-${bounceOffset}px) scaleX(${character.flipHorizontal ? -1 : 1}) rotate(${character.rotation}deg) scale(${character.scale})`,
        transformOrigin: 'bottom center',
        touchAction: isInteractiveDragging ? 'none' : 'auto',
      }}
      className={`relative select-none transition-transform duration-75 ${
        isInteractiveDragging ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'
      } ${className}`}
    >
      <img
        src={currentSprite}
        alt={character.name}
        referrerPolicy="no-referrer"
        draggable={false}
        className="max-w-none w-48 sm:w-56 md:w-64 drop-shadow-2xl pointer-events-none object-contain"
      />

      {/* Visual positioning outline when in drag mode */}
      {isInteractiveDragging && (
        <div className="absolute inset-0 -m-2 border-2 border-dashed border-indigo-400/80 rounded-2xl pointer-events-none bg-indigo-500/10 flex items-start justify-center pt-2">
          <span className="text-[10px] font-mono font-bold bg-indigo-900/90 text-indigo-200 px-2 py-0.5 rounded-full shadow">
            Arraste para posicionar
          </span>
        </div>
      )}
    </div>
  );
});

AvatarView.displayName = 'AvatarView';
