"use client";
import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

export default function Confetti({ loop = true }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const myConfetti = confetti.create(canvasRef.current, {
      resize: true,
      useWorker: true,
    });

    let animationFrameId;

    const frame = () => {
      // Main burst from the center
      myConfetti({
        particleCount: 20, // Increase particle count for a more festive effect
        angle: 270, // Shoot confetti upwards (270 degrees is straight up)
        spread: 70, // Wider spread
        startVelocity: 60, // Faster initial velocity
        gravity: 0.2, // Lower gravity to keep particles moving upwards longer
        origin: { x: 0.5, y: 0.6 }, // Start from the bottom center
        colors: ["#00FFFF", "#00FFCC", "#0088FF", "#FF00FF"], // Custom colors
        shapes: ["circle", "square"], // Mix of shapes
        scalar: 1.2, // Slightly larger particles
      });

      // Additional bursts for variation
      myConfetti({
        particleCount: 10,
        angle: 260, // Slightly angled to the left
        spread: 60,
        startVelocity: 50,
        gravity: 0.2,
        origin: { x: 0.4, y: 0.6 }, // Start from a little left
        colors: ["#00FFFF", "#00FFCC", "#0088FF", "#FF00FF"],
        shapes: ["circle", "square"],
        scalar: 1.2,
      });

      myConfetti({
        particleCount: 10,
        angle: 280, // Slightly angled to the right
        spread: 60,
        startVelocity: 50,
        gravity: 0.2,
        origin: { x: 0.6, y: 1 }, // Start from a little right
        colors: ["#00FFFF", "#00FFCC", "#0088FF", "#FF00FF"],
        shapes: ["circle", "square"],
        scalar: 1.2,
      });

      if (loop) {
        animationFrameId = requestAnimationFrame(frame);
      }
    };

    // Start the animation
    frame();

    // Cleanup function
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      myConfetti.reset();
    };
  }, [loop]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: -100,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 9999,
        border: "2px solid red", // Temporary border for debugging
      }}
    />
  );
}