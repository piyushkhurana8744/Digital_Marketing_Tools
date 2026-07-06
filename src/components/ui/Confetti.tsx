"use client";

import React, { useEffect, useRef } from "react";

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  size: number;
  speedX: number;
  speedY: number;
  gravity: number;
  opacity: number;
}

export function Confetti({ active, onComplete }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Color choices: Strikers Crimson red, rose, white, and a touch of gold
    const colors = ["#BE1E2E", "#E11D48", "#FB7185", "#FFFFFF", "#FBBF24"];
    const particles: Particle[] = [];

    // Create particles from center/bottom area or spread
    const particleCount = 130;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 50,
        y: canvas.height * 0.7,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 6,
        speedX: (Math.random() - 0.5) * 16,
        speedY: -Math.random() * 15 - 10,
        gravity: 0.4,
        opacity: 1,
      });
    }

    let animationFrameId: number;
    let frameCount = 0;

    const update = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.speedY += p.gravity;
        p.rotation += p.rotationSpeed;
        
        // Slow down opacity when falling down
        if (p.speedY > 0) {
          p.opacity -= 0.012;
        }

        if (p.opacity > 0 && p.y < canvas.height && p.x > 0 && p.x < canvas.width) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = p.color;
          
          // Draw rect
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
      });

      frameCount++;

      if (alive && frameCount < 180) {
        animationFrameId = requestAnimationFrame(update);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (onComplete) onComplete();
      }
    };

    update();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[10000] w-screen h-screen"
    />
  );
}
