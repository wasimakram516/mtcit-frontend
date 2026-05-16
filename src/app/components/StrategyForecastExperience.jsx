"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Chip, Slider, Stack, Typography } from "@mui/material";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

const airQualityLabels = {
  en: { poor: "Poor", moderate: "Moderate", improving: "Improving", good: "Good", excellent: "Excellent" },
  ar: { poor: "سيئة", moderate: "متوسطة", improving: "تتحسن", good: "جيدة", excellent: "ممتازة" },
};

function getAirQualityLabel(score, language = "en") {
  const l = airQualityLabels[language] || airQualityLabels.en;
  if (score >= 90) return l.excellent;
  if (score >= 72) return l.good;
  if (score >= 52) return l.improving;
  if (score >= 34) return l.moderate;
  return l.poor;
}

function getForecastMetrics(progress, language = "en") {
  const safeProgress = clamp(Number(progress) || 0, 0, 100);
  const t = safeProgress / 100;
  const year = Math.round(lerp(2030, 2050, t));
  const evAdoption = Math.round(lerp(25, 100, t));
  const co2Reduced = Math.round(lerp(3, 100, t));
  const airQualityScore = Math.round(lerp(20, 98, t));

  return {
    t,
    year,
    evAdoption,
    co2Reduced,
    airQualityScore,
    airQualityLabel: getAirQualityLabel(airQualityScore, language),
    evVehicles: Math.round(lerp(2.5, 10, t)),
  };
}

const copy = {
  en: {
    title: "Net Zero Strategy - Transport Forecast",
    subtitle: "Explore how transport shifts from fuel to electric mobility by 2050.",
    year: "Year",
    evAdoption: "EV adoption",
    co2Reduced: "CO2 reduced",
    airQuality: "Air quality",
    from: "2030",
    to: "2050",
    electric: "Electric vehicles",
    conventional: "Conventional vehicles",
    achieved: "2050 - Transport sector achieved net zero",
  },
  ar: {
    title: "استراتيجية الحياد الصفري - توقعات النقل",
    subtitle: "استكشف كيف ينتقل النقل من الوقود إلى التنقل الكهربائي بحلول عام 2050.",
    year: "السنة",
    evAdoption: "تبني المركبات الكهربائية",
    co2Reduced: "خفض ثاني أكسيد الكربون",
    airQuality: "جودة الهواء",
    from: "2030",
    to: "2050",
    electric: "مركبات كهربائية",
    conventional: "مركبات تقليدية",
    achieved: "2050 - قطاع النقل يحقق الحياد الصفري",
  },
};

// Gas car SVG — matches drawGasCar() from the HTML reference
// viewBox 0 0 52 22: w=52, h=22 (h≈w*0.42=21.84)
// Exhaust at (46.8, 13.6) in viewBox "0 0 52 22"
const SMOKE_PARTICLES = [
  { delay: "0s",    dur: "1.4s", r: 4,   tx: "0;2;-4;-10",  ty: "0;-8;-18;-28"  },
  { delay: "0.2s",  dur: "1.6s", r: 5,   tx: "0;-3;-8;-14", ty: "0;-9;-20;-30"  },
  { delay: "0.4s",  dur: "1.3s", r: 3.5, tx: "0;3;-2;-9",   ty: "0;-7;-16;-26"  },
  { delay: "0.65s", dur: "1.7s", r: 6,   tx: "0;-4;-10;-16",ty: "0;-10;-22;-32" },
  { delay: "0.9s",  dur: "1.5s", r: 4.5, tx: "0;2;-5;-12",  ty: "0;-8;-19;-29"  },
  { delay: "1.1s",  dur: "1.4s", r: 3.8, tx: "0;-2;-7;-13", ty: "0;-8;-17;-27"  },
  { delay: "1.35s", dur: "1.8s", r: 5.5, tx: "0;3;-3;-11",  ty: "0;-11;-23;-34" },
];

function SmokeParticle({ delay, dur, r, tx, ty }) {
  const txArr = tx.split(";");
  const tyArr = ty.split(";");
  const translateValues = txArr.map((x, i) => `${x},${tyArr[i]}`).join("; ");
  return (
    // filter="url(#smokeBlur)" makes circles look like real billowing smoke clouds
    <circle cx="46.8" cy="13.6" r={r} fill="rgb(80,80,80)" opacity="0" filter="url(#smokeBlur)">
      <animateTransform
        attributeName="transform"
        type="translate"
        values={translateValues}
        keyTimes="0;0.25;0.6;1"
        dur={dur}
        begin={delay}
        repeatCount="indefinite"
        calcMode="spline"
        keySplines="0.25 0.1 0.25 1;0.25 0.1 0.25 1;0.25 0.1 0.25 1"
      />
      <animate attributeName="r"       values={`${r};${r * 2.2};${r * 4};${r * 5.5}`}           keyTimes="0;0.18;0.55;1" dur={dur} begin={delay} repeatCount="indefinite" />
      <animate attributeName="opacity" values="0;0.9;0.7;0"                                       keyTimes="0;0.08;0.4;1"  dur={dur} begin={delay} repeatCount="indefinite" />
      <animate attributeName="fill"    values="rgb(60,60,60);rgb(100,100,100);rgb(190,190,190)"   keyTimes="0;0.25;1"      dur={dur} begin={delay} repeatCount="indefinite" />
    </circle>
  );
}

function GasCarSVG({ s = 1 }) {
  return (
    <svg width={52 * s} height={22 * s} viewBox="0 0 52 22" style={{ display: "block", overflow: "visible" }}>
      <defs>
        <filter id="smokeBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" />
        </filter>
      </defs>
      {/* Body */}
      <rect x="0" y="4.84" width="52" height="11.44" rx="3" fill="#C0392B" />
      {/* Roof / cabin trapezoid */}
      <polygon points="7.28,4.84 11.44,0 41.6,0 45.24,4.84" fill="#96281B" />
      {/* Window */}
      <rect x="11.96" y="0.66" width="28.08" height="3.96" rx="2" fill="rgba(140,190,220,0.45)" />
      {/* Headlight – left = front */}
      <rect x="3.64" y="6.16" width="4.16" height="3.08" rx="1" fill="rgba(200,150,50,0.75)" />
      {/* Tail light – right = rear */}
      <rect x="43.68" y="6.6" width="4.68" height="3.96" rx="2" fill="rgba(255,50,30,0.9)" />
      {/* Ground shadow */}
      <rect x="2.6" y="16.28" width="46.8" height="2.2" fill="rgba(80,55,25,0.3)" />
      {/* Rear wheel */}
      <circle cx="11.96" cy="16.28" r="4.84" fill="#111" />
      <circle cx="11.96" cy="16.28" r="2.86" fill="#2a2a2a" />
      {/* Front wheel */}
      <circle cx="40.04" cy="16.28" r="4.84" fill="#111" />
      <circle cx="40.04" cy="16.28" r="2.86" fill="#2a2a2a" />
      {/* Smoke from exhaust — drawn last so it appears above car body */}
      {SMOKE_PARTICLES.map((p, i) => (
        <SmokeParticle key={i} {...p} />
      ))}
    </svg>
  );
}

// Cybertruck SVG — matches drawCybertruck() from the HTML reference
// viewBox 0 0 58 22: w=58, h=22 (h≈w*0.38=22.04)
function CybertruckSVG({ s = 1 }) {
  return (
    <svg width={58 * s} height={22 * s} viewBox="0 0 58 22" style={{ display: "block" }}>
      {/* Lower body base */}
      <rect x="0" y="6.6" width="58" height="11" rx="2" fill="#6b7078" />
      {/* Main angular body */}
      <polygon
        points="1.16,6.6 16.24,0.44 35.96,0.44 51.04,6.16 56.84,6.6 56.84,17.6 1.16,17.6"
        fill="#9a9fa8"
      />
      {/* Highlight edge strip */}
      <polygon
        points="1.74,6.6 16.24,0.66 35.96,0.66 50.46,6.16 56.26,6.6 56.26,7.04 50.46,6.6 35.96,1.1 16.24,1.1 1.74,7.04"
        fill="#d0d5de"
      />
      {/* Left window pane */}
      <rect x="16.82" y="1.1" width="8.7" height="4.84" fill="rgba(180,220,240,0.55)" />
      {/* Right window pane – trapezoid */}
      <polygon points="26.68,1.1 35.38,1.1 41.76,5.94 26.68,5.94" fill="rgba(180,220,240,0.55)" />
      {/* Window divider */}
      <line x1="26.1" y1="1.1" x2="26.1" y2="5.94" stroke="rgba(150,165,175,0.4)" strokeWidth="0.8" />
      {/* Headlight – left = front */}
      <rect x="0.58" y="7.04" width="8.12" height="2.2" rx="1" fill="rgba(210,230,255,0.7)" />
      {/* Tail light – right = rear */}
      <rect x="49.88" y="7.04" width="6.96" height="2.2" rx="1" fill="rgba(255,70,70,0.9)" />
      {/* Ground shadow */}
      <rect x="2.32" y="16.72" width="53.36" height="2.2" fill="rgba(100,110,120,0.22)" />
      {/* Left wheel */}
      <circle cx="11.6" cy="16.72" r="5.5" fill="#1a1a22" />
      <circle cx="11.6" cy="16.72" r="3.52" fill="#2e2e38" />
      <circle cx="11.6" cy="16.72" r="1.76" fill="none" stroke="rgba(180,200,220,0.6)" strokeWidth="1" />
      {/* Right wheel */}
      <circle cx="46.4" cy="16.72" r="5.5" fill="#1a1a22" />
      <circle cx="46.4" cy="16.72" r="3.52" fill="#2e2e38" />
      <circle cx="46.4" cy="16.72" r="1.76" fill="none" stroke="rgba(180,200,220,0.6)" strokeWidth="1" />
    </svg>
  );
}

function Vehicle({ electric, size = 1, top = "50%", left = "0%", popping = false }) {
  const badgeBg = electric ? "rgba(0,175,108,0.92)" : "rgba(200,50,30,0.9)";
  const badgeIcon = electric ? "⚡" : "⛽";
  const badgeSize = 20 * size;
  const badgeFontSize = 11 * size;

  return (
    // Outer Box: positions the vehicle on the stage (no animation so transform isn't clobbered)
    <Box sx={{ position: "absolute", top, left, transform: "translate(-50%, -50%)", zIndex: 2 }}>
      {/* Inner Box: flex column + bob animation */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: `${3 * size}px`,
          animation: "vehicleBob 1.8s ease-in-out infinite",
          "@keyframes vehicleBob": {
            "0%, 100%": { transform: "translateY(0)" },
            "50%": { transform: `translateY(${-2 * size}px)` },
          },
          position: "relative",
        }}
      >
        {/* Badge — matches HTML drawIcon: colored rounded square + emoji */}
        <Box
          sx={{
            width: `${badgeSize}px`,
            height: `${badgeSize}px`,
            borderRadius: `${5 * size}px`,
            bgcolor: badgeBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: `${badgeFontSize}px`,
            lineHeight: 1,
            flexShrink: 0,
            boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
            zIndex: 2,
            position: "relative",
          }}
        >
          {badgeIcon}

          {/* Popping burst — centered on badge when vehicle converts to EV */}
          {popping && (
            <>
              {/* Big outer shockwave ring */}
              <Box sx={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:`${70*size}px`, height:`${70*size}px`, borderRadius:"50%", border:`3px solid rgba(0,232,150,0.95)`, animation:"evShockwave 0.7s ease-out forwards", pointerEvents:"none",
                "@keyframes evShockwave":{ "0%":{transform:"translate(-50%,-50%) scale(0.2)", opacity:1}, "100%":{transform:"translate(-50%,-50%) scale(1)", opacity:0} } }} />
              {/* Second inner ring */}
              <Box sx={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:`${44*size}px`, height:`${44*size}px`, borderRadius:"50%", border:`2px solid rgba(160,255,96,0.9)`, animation:"evShockwave2 0.6s 0.1s ease-out forwards", pointerEvents:"none",
                "@keyframes evShockwave2":{ "0%":{transform:"translate(-50%,-50%) scale(0.3)", opacity:1}, "100%":{transform:"translate(-50%,-50%) scale(1.1)", opacity:0} } }} />
              {/* 10 sparks flying outward */}
              {Array.from({ length: 10 }).map((_, i) => {
                const angle = (i / 10) * Math.PI * 2;
                const dist = 36 * size;
                const colors = ["#00e896","#00d4ff","#a0ff60","#50ffcc","#00c87a","#ffffff","#b0ffb0","#00e896","#a0ff60","#50ffcc"];
                return (
                  <Box key={i} sx={{
                    position:"absolute", top:"50%", left:"50%",
                    width:`${7*size}px`, height:`${7*size}px`,
                    borderRadius:"50%", bgcolor: colors[i],
                    animation:`evSpark${i} 0.75s ease-out forwards`,
                    [`@keyframes evSpark${i}`]:{
                      "0%":{ transform:"translate(-50%,-50%) scale(1)", opacity:1 },
                      "100%":{ transform:`translate(calc(-50% + ${Math.cos(angle)*dist}px), calc(-50% + ${Math.sin(angle)*dist}px)) scale(0)`, opacity:0 }
                    },
                    pointerEvents:"none",
                  }} />
                );
              })}
              {/* Flash white overlay on badge */}
              <Box sx={{ position:"absolute", inset:0, borderRadius:`${5*size}px`, bgcolor:"rgba(255,255,255,0.95)", animation:"evFlash 0.4s ease-out forwards", pointerEvents:"none",
                "@keyframes evFlash":{ "0%":{opacity:1}, "100%":{opacity:0} } }} />
            </>
          )}
        </Box>

        {/* Car SVG — gas car or cybertruck matching the HTML canvas designs */}
        {electric ? <CybertruckSVG s={size} /> : <GasCarSVG s={size} />}
      </Box>
    </Box>
  );
}

export default function StrategyForecastExperience({
  language = "en",
  progress = 0,
  interactive = false,
  showBackButton = false,
  showSlider = interactive,
  onProgressChange,
}) {
  const isArabic = language === "ar";
  const t = copy[language] || copy.en;
  const safeProgress = clamp(Number(progress) || 0, 0, 100);
  const metrics = useMemo(() => getForecastMetrics(safeProgress, language), [safeProgress, language]);
  const prevEvCountRef = useRef(metrics.evVehicles);
  const [poppingVehicles, setPoppingVehicles] = useState([]);
  const gasVehicles = Math.max(0, 10 - metrics.evVehicles);
  const celebrationActive = safeProgress >= 96;
  const nightMode = safeProgress >= 72;

  // 2 lanes matching HTML reference: lane 0 = top (smaller, perspective), lane 1 = bottom (larger)
  // xFrac: 0.04 + i*0.096 for i=0..9, alternating lanes
  const vehicleSlots = [
    { top: "26%", left: "4%",  lane: 0, size: 1.0  },
    { top: "72%", left: "13%", lane: 1, size: 1.32 },
    { top: "26%", left: "23%", lane: 0, size: 1.0  },
    { top: "72%", left: "33%", lane: 1, size: 1.32 },
    { top: "26%", left: "43%", lane: 0, size: 1.0  },
    { top: "72%", left: "52%", lane: 1, size: 1.32 },
    { top: "26%", left: "62%", lane: 0, size: 1.0  },
    { top: "72%", left: "71%", lane: 1, size: 1.32 },
    { top: "26%", left: "81%", lane: 0, size: 1.0  },
    { top: "72%", left: "90%", lane: 1, size: 1.32 },
  ];

  useEffect(() => {
    const previous = prevEvCountRef.current;
    const next = metrics.evVehicles;
    if (next > previous) {
      const added = Array.from({ length: next - previous }, (_, index) => previous + index);
      setPoppingVehicles(added);
      const timeout = setTimeout(() => setPoppingVehicles([]), 850);
      prevEvCountRef.current = next;
      return () => clearTimeout(timeout);
    }
    prevEvCountRef.current = next;
  }, [metrics.evVehicles]);

  return (
    <Box
      dir={isArabic ? "rtl" : "ltr"}
      sx={{
        width: "100%",
        maxWidth: interactive ? "min(92vw, 980px)" : "100%",
        mx: "auto",
        color: "#F6FCF6",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2.5, pl: showBackButton ? 7 : 0 }}
      >
        <Box sx={{ flex: 1, textAlign: isArabic ? "right" : "left" }}>
          <Typography
            sx={{
              fontSize: interactive
                ? "clamp(1.7rem, 3.2vw, 2.6rem)"
                : "clamp(1.8rem, 2.6vw, 2.7rem)",
              fontWeight: 700,
              textShadow: "0 8px 24px rgba(0,0,0,0.35)",
              lineHeight: 1.08,
            }}
          >
            {t.title}
          </Typography>
          <Typography
            sx={{
              opacity: 0.88,
              mt: 0.5,
              textAlign: isArabic ? "right" : "left",
              fontSize: interactive
                ? "clamp(0.92rem, 1.4vw, 1.1rem)"
                : "clamp(0.9rem, 1.2vw, 1rem)",
            }}
          >
            {t.subtitle}
          </Typography>
        </Box>
        <Chip
          label={metrics.year}
          sx={{
            bgcolor: "#1D9E75",
            color: "#fff",
            fontWeight: 700,
            fontSize: "clamp(0.92rem, 1.05vw, 1.1rem)",
            minWidth: "clamp(72px, 6vw, 108px)",
            boxShadow: "0 12px 24px rgba(29,158,117,0.35)",
          }}
        />
      </Stack>

        <Box
          sx={{
            position: "relative",
            borderRadius: "28px",
            overflow: "hidden",
          border: interactive
            ? "1px solid rgba(255,255,255,0.1)"
            : "1px solid rgba(17,34,28,0.92)",
          boxShadow: interactive
            ? "0 30px 60px rgba(0,0,0,0.28)"
            : "0 10px 22px rgba(0,0,0,0.1)",
          bgcolor: interactive ? "rgba(255,255,255,0.05)" : "#132823",
          backdropFilter: interactive ? "blur(10px)" : "none",
        }}
      >
        <Box
          sx={{
            position: "relative",
            height: interactive
              ? "clamp(290px, 44vw, 390px)"
              : "clamp(320px, 33vw, 430px)",
            background: nightMode
              ? "linear-gradient(180deg, #12223E 0%, #3A2A5A 46%, #4C6D59 47%, #2F4031 100%)"
              : "linear-gradient(180deg, #8FD7FA 0%, #D2F0FB 43%, #7DBC66 44%, #6C8B53 100%)",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: nightMode ? 28 : 24,
              left: `${12 + metrics.t * 60}%`,
              width: nightMode ? 28 : 46,
              height: nightMode ? 28 : 46,
              borderRadius: "50%",
              bgcolor: nightMode ? "rgba(250,252,255,0.95)" : "#FFD96B",
              boxShadow: nightMode
                ? "0 0 24px rgba(255,255,255,0.35)"
                : "0 0 38px rgba(255,217,107,0.5)",
              transform: "translateX(-50%)",
              transition: "all 0.35s ease",
            }}
          />

          <Box
            sx={{
              position: "absolute",
              top: 16,
              left: 16,
              right: 16,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              zIndex: 2,
            }}
          >
            <Chip
              label={`${t.electric}: ${metrics.evVehicles}`}
              sx={{
                bgcolor: "rgba(21,183,126,0.16)",
                color: "#EFFFF9",
                border: "1px solid rgba(21,183,126,0.26)",
                fontWeight: 600,
              }}
            />
            <Chip
              label={`${t.conventional}: ${gasVehicles}`}
              sx={{
                bgcolor: "rgba(198,83,66,0.14)",
                color: "#FFF3F0",
                border: "1px solid rgba(198,83,66,0.24)",
                fontWeight: 600,
              }}
            />
          </Box>

          <Box
            sx={{
              position: "absolute",
              left: "-3%",
              right: "-3%",
              top: "53%",
              bottom: "11%",
              overflow: "hidden",
              clipPath: "polygon(2% 0, 98% 0, 100% 100%, 0 100%)",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(64,64,64,0.98) 0%, rgba(32,32,32,1) 100%)",
              }}
            />

            {[0, 1].map((laneIndex) => (
              <Box
                key={laneIndex}
                sx={{
                  position: "absolute",
                  left: `${laneIndex === 0 ? 5 : 1}%`,
                  right: `${laneIndex === 0 ? 5 : 1}%`,
                  top: `${laneIndex === 0 ? 26 : 70}%`,
                  height: laneIndex === 0 ? 2 : 3,
                  overflow: "hidden",
                  opacity: laneIndex === 0 ? 0.65 : 0.88,
                  zIndex: 1,
                }}
              >
                <Box
                  sx={{
                    width: "180%",
                    height: "100%",
                    backgroundImage:
                      "repeating-linear-gradient(90deg, rgba(255,220,88,0) 0 28px, rgba(255,220,88,0.9) 28px 54px, rgba(255,220,88,0) 54px 92px)",
                    animation: `roadMove ${laneIndex === 0 ? 14 : 10}s linear infinite`,
                    "@keyframes roadMove": {
                      "0%": { transform: "translateX(0)" },
                      "100%": { transform: "translateX(-28%)" },
                    },
                  }}
                />
              </Box>
            ))}

            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 18%, rgba(0,0,0,0.12) 100%)",
              }}
            />

            {vehicleSlots.map((slot, index) => {
              const electric = index < metrics.evVehicles;
              return (
                <Vehicle
                  key={`vehicle-${index}`}
                  electric={electric}
                  size={(interactive ? 1.1 : 1.2) * slot.size}
                  top={slot.top}
                  left={slot.left}
                  popping={poppingVehicles.includes(index)}
                />
              );
            })}
          </Box>

          {celebrationActive && (
            <Box sx={{ position:"absolute", inset:0, pointerEvents:"none", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-start", pt:"2%" }}>

              {/* Confetti leaves */}
              {Array.from({ length: 24 }).map((_, i) => (
                <Box key={i} sx={{
                  position:"absolute",
                  left:`${8 + (i % 8) * 12}%`,
                  top:`${10 + Math.floor(i / 8) * 28}%`,
                  width: i % 3 === 0 ? 12 : 8,
                  height: i % 3 === 0 ? 22 : 16,
                  borderRadius:"10px 10px 2px 10px",
                  bgcolor: ["#2BE495","#A6FF7D","#00D4FF","#FFE066","#50FFCC"][i % 5],
                  animation:`cLeaf${i % 3} ${1.4 + (i % 4) * 0.2}s ease-in-out ${i * 0.04}s infinite`,
                  "@keyframes cLeaf0":{ "0%":{transform:"translateY(0) rotate(-10deg)",opacity:0}, "20%":{opacity:1}, "100%":{transform:"translateY(-55px) rotate(30deg)",opacity:0} },
                  "@keyframes cLeaf1":{ "0%":{transform:"translateY(0) rotate(10deg)",opacity:0}, "20%":{opacity:0.9}, "100%":{transform:"translateY(-50px) rotate(-20deg)",opacity:0} },
                  "@keyframes cLeaf2":{ "0%":{transform:"translateY(0) rotate(0deg)",opacity:0}, "20%":{opacity:0.85}, "100%":{transform:"translateY(-60px) rotate(15deg)",opacity:0} },
                }} />
              ))}

              {/* NET ZERO hero text — matches HTML reference spawnCelebration text */}
              <Box sx={{ textAlign:"center", animation:"netZeroIn 0.5s ease-out forwards", "@keyframes netZeroIn":{ "0%":{opacity:0, transform:"scale(0.6)"}, "100%":{opacity:1, transform:"scale(1)"} } }}>
                <Typography
                  dir={isArabic ? "rtl" : "ltr"}
                  sx={{
                    fontSize: interactive ? "clamp(2rem,5vw,3.2rem)" : "clamp(2.4rem,4.5vw,4rem)",
                    fontWeight: 900,
                    color: "#00E896",
                    textShadow: "0 0 40px rgba(0,232,150,0.7), 0 4px 16px rgba(0,0,0,0.5)",
                    letterSpacing: "0.04em",
                    lineHeight: 1.1,
                    animation: "netZeroPulse 1.6s ease-in-out infinite",
                    "@keyframes netZeroPulse":{ "0%,100%":{textShadow:"0 0 30px rgba(0,232,150,0.6)"}, "50%":{textShadow:"0 0 60px rgba(0,232,150,1), 0 0 100px rgba(0,232,150,0.4)"} },
                  }}
                >
                  {isArabic ? "الحياد الصفري" : "NET ZERO"}
                </Typography>
                <Typography
                  dir={isArabic ? "rtl" : "ltr"}
                  sx={{
                    mt: 0.5,
                    fontSize: interactive ? "clamp(0.85rem,1.5vw,1.1rem)" : "clamp(1rem,1.6vw,1.3rem)",
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.92)",
                    textShadow: "0 2px 12px rgba(0,0,0,0.55)",
                  }}
                >
                  {isArabic ? "2050 — قطاع النقل يحقق الحياد الصفري 🎉" : "2050 — Transport sector achieved net zero 🎉"}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        <Box sx={{ p: { xs: 2, md: 2.5 } }}>
          {showSlider && (
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2.5 }} dir="ltr">
              <Typography variant="caption" sx={{ color: "rgba(246,252,246,0.86)", minWidth: 40 }}>
                {t.from}
              </Typography>
              <Slider
                min={0}
                max={100}
                step={1}
                value={safeProgress}
                onChange={(_, value) => {
                  if (typeof onProgressChange === "function") {
                    onProgressChange(Array.isArray(value) ? value[0] : value);
                  }
                }}
                aria-label="strategy forecast progress"
                sx={{
                  color: "#1D9E75",
                  "& .MuiSlider-thumb": {
                    width: 18,
                    height: 18,
                  },
                  "& .MuiSlider-track": {
                    border: "none",
                  },
                  "& .MuiSlider-rail": {
                    bgcolor: "rgba(255,255,255,0.25)",
                  },
                }}
              />
              <Typography variant="caption" sx={{ color: "rgba(246,252,246,0.86)", minWidth: 40 }}>
                {t.to}
              </Typography>
            </Stack>
          )}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
              gap: 1.5,
            }}
          >
            {[
              { label: t.year, value: metrics.year },
              { label: t.evAdoption, value: `${metrics.evAdoption}%` },
              { label: t.co2Reduced, value: `${metrics.co2Reduced}%` },
              { label: t.airQuality, value: metrics.airQualityLabel },
            ].map((item) => (
              <Box
                key={item.label}
                sx={{
                  p: 1.5,
                  borderRadius: "18px",
                  bgcolor: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  textAlign: "center",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
                }}
              >
                <Typography variant="caption" sx={{ color: "rgba(246,252,246,0.72)" }}>
                  {item.label}
                </Typography>
                <Typography
                  sx={{
                    mt: 0.5,
                    fontSize: { xs: "1rem", md: interactive ? "1.2rem" : "1.45rem" },
                    fontWeight: 700,
                    color: "#F6FCF6",
                  }}
                >
                  {item.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
