"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
const GREEN = "#1C932D";
const PLUM = "#390042";
const MIN_VISIBLE_MS = 1000; // always show for at least 1 second

export default function LogoLoader({ visible = false, language = "en" }) {
  const isArabic = language === "ar";

  // Keep the loader shown for at least MIN_VISIBLE_MS so fast responses are still visible
  const [show, setShow] = useState(false);
  const showSince = useRef(null);
  const hideTimer = useRef(null);

  useEffect(() => {
    if (visible) {
      clearTimeout(hideTimer.current);
      showSince.current = Date.now();
      setShow(true);
    } else {
      const elapsed = showSince.current ? Date.now() - showSince.current : MIN_VISIBLE_MS;
      const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);
      hideTimer.current = setTimeout(() => setShow(false), remaining);
    }
    return () => clearTimeout(hideTimer.current);
  }, [visible]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="mtcit-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          {/* Glassmorphic backdrop */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: "rgba(8, 16, 12, 0.55)",
            backdropFilter: "blur(28px) saturate(180%)",
            WebkitBackdropFilter: "blur(28px) saturate(180%)",
          }} />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.3 }}
            style={{
              position: "relative",
              width: "min(92vw, 480px)",
              borderRadius: "20px",
              border: "1px solid rgba(255,255,255,0.18)",
              background: "linear-gradient(180deg, #ffffff 0%, #fafcf8 100%)",
              boxShadow: "0 28px 72px rgba(7,40,11,0.28), 0 6px 18px rgba(7,40,11,0.12)",
              padding: "28px 24px 22px",
              overflow: "hidden",
              textAlign: "center",
              fontFamily: '"Tajawal", sans-serif',
            }}
          >
            {/* Sweep line */}
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "3px",
              background: `linear-gradient(90deg, transparent 0%, ${GREEN} 52%, ${PLUM} 100%)`,
              animation: "mtcitSweep 1.8s linear infinite",
            }} />

            {/* Logo orbit container */}
            <div style={{ position: "relative", width: 170, height: 170, margin: "0 auto 12px", display: "grid", placeItems: "center" }}>
              {/* Glow pulse */}
              <div style={{
                position: "absolute",
                inset: 18,
                borderRadius: "999px",
                background: `radial-gradient(circle, rgba(28,147,45,0.22) 0%, rgba(57,0,66,0.07) 62%, transparent 100%)`,
                animation: "mtcitPulse 1.8s ease-in-out infinite",
              }} />

              {/* Outer orbit */}
              <div style={{
                position: "absolute",
                inset: 0,
                borderRadius: "999px",
                border: `3px solid rgba(28,147,45,0.2)`,
                borderTopColor: GREEN,
                borderRightColor: PLUM,
                animation: "mtcitSpin 1s linear infinite",
              }} />

              {/* Inner dashed reverse */}
              <div style={{
                position: "absolute",
                inset: 12,
                borderRadius: "999px",
                border: "2px dashed rgba(57,0,66,0.28)",
                animation: "mtcitSpinRev 1.65s linear infinite",
              }} />

              {/* Logo */}
              <img
                src="/mtcit-logo-full.png"
                alt="MTCIT"
                style={{
                  maxWidth: 110,
                  maxHeight: 110,
                  objectFit: "contain",
                  position: "relative",
                  zIndex: 2,
                  filter: "drop-shadow(0 6px 14px rgba(7,40,11,0.14))",
                }}
              />
            </div>

            {/* Title */}
            <p style={{ fontSize: 15, fontWeight: 600, color: "#07280B", lineHeight: 1.4, margin: "0 0 14px", direction: isArabic ? "rtl" : "ltr" }}>
              {isArabic ? "جارٍ تحميل المحتوى..." : "Loading content..."}
            </p>

            {/* Shimmer bar */}
            <div style={{
              height: 10,
              borderRadius: 999,
              border: "1px solid rgba(28,147,45,0.28)",
              background: "linear-gradient(90deg, #edf5e7 0%, #f8fcf5 48%, #edf5e7 100%)",
              backgroundSize: "220% 100%",
              animation: "mtcitShimmer 1.2s linear infinite",
              position: "relative",
              overflow: "hidden",
              marginBottom: 13,
            }}>
              <div style={{
                position: "absolute",
                top: 1,
                left: "-34%",
                width: "34%",
                height: "calc(100% - 2px)",
                borderRadius: 999,
                background: `linear-gradient(90deg, rgba(57,0,66,0.12) 0%, rgba(28,147,45,0.42) 100%)`,
                animation: "mtcitBarRun 1.12s ease-in-out infinite",
              }} />
            </div>

            {/* Skeleton lines */}
            <div style={{ display: "grid", gap: 8, justifyItems: "center" }}>
              {[["78%", 0], ["92%", 0.12], ["64%", 0.24]].map(([w, delay], i) => (
                <div key={i} style={{
                  width: w,
                  height: 8,
                  borderRadius: 999,
                  background: "linear-gradient(90deg, #edf4e7 0%, #f9fcf6 50%, #edf4e7 100%)",
                  backgroundSize: "220% 100%",
                  animation: `mtcitShimmer 1.35s linear ${delay}s infinite`,
                }} />
              ))}
            </div>
          </motion.div>

          {/* Keyframes injected via style tag */}
          <style>{`
            @keyframes mtcitSweep {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(350%); }
            }
            @keyframes mtcitPulse {
              0%, 100% { transform: scale(0.96); opacity: 0.7; }
              50% { transform: scale(1); opacity: 1; }
            }
            @keyframes mtcitSpin {
              to { transform: rotate(360deg); }
            }
            @keyframes mtcitSpinRev {
              to { transform: rotate(-360deg); }
            }
            @keyframes mtcitShimmer {
              0% { background-position: 220% 0; }
              100% { background-position: -35% 0; }
            }
            @keyframes mtcitBarRun {
              0% { left: -34%; }
              100% { left: 104%; }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
