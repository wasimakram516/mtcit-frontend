"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Chip, Slider, Stack, Typography } from "@mui/material";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function getForecastMetrics(progress) {
  const safeProgress = clamp(Number(progress) || 0, 0, 100);
  const t = safeProgress / 100;
  const year = Math.round(lerp(2030, 2050, t));
  const evAdoption = Math.round(lerp(25, 100, t));
  const co2Reduced = Math.round(lerp(3, 100, t));
  const airQualityScore = Math.round(lerp(20, 98, t));

  let airQualityLabel = "Poor";
  if (airQualityScore >= 90) airQualityLabel = "Excellent";
  else if (airQualityScore >= 72) airQualityLabel = "Good";
  else if (airQualityScore >= 52) airQualityLabel = "Improving";
  else if (airQualityScore >= 34) airQualityLabel = "Moderate";

  return {
    t,
    year,
    evAdoption,
    co2Reduced,
    airQualityScore,
    airQualityLabel,
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

function Vehicle({ electric, size = 1, top = "50%", left = "0%", popping = false }) {
  const bodyColor = electric ? "#15B77E" : "#C65342";
  const roofColor = electric ? "#96F5D3" : "#F0B0A6";
  const glow = electric ? "rgba(21,183,126,0.42)" : "rgba(198,83,66,0.2)";

  return (
    <Box
      sx={{
        position: "absolute",
        top,
        left,
        width: `${54 * size}px`,
        height: `${30 * size}px`,
        transform: "translate(-50%, -50%)",
        animation: "vehicleBob 1.8s ease-in-out infinite",
        "@keyframes vehicleBob": {
          "0%, 100%": { marginTop: 0 },
          "50%": { marginTop: -0.5 },
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          left: `${7 * size}px`,
          bottom: `${11 * size}px`,
          width: `${24 * size}px`,
          height: `${10 * size}px`,
          borderRadius: `${5 * size}px ${5 * size}px 1px 1px`,
          bgcolor: roofColor,
          opacity: 0.92,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          left: 0,
          bottom: `${6 * size}px`,
          width: `${54 * size}px`,
          height: `${14 * size}px`,
          borderRadius: `${5 * size}px`,
          bgcolor: bodyColor,
          boxShadow: `0 8px 20px ${glow}`,
        }}
      />
      {electric && (
        <Box
          sx={{
            position: "absolute",
            left: `${21 * size}px`,
            bottom: `${18 * size}px`,
            width: `${9 * size}px`,
            height: `${15 * size}px`,
            clipPath: "polygon(42% 0, 100% 0, 62% 40%, 100% 40%, 26% 100%, 44% 58%, 10% 58%)",
            bgcolor: "#D8FF72",
            filter: "drop-shadow(0 0 8px rgba(216,255,114,0.85))",
            animation: "evPulse 1.2s ease-in-out infinite",
            "@keyframes evPulse": {
              "0%, 100%": { opacity: 0.55, transform: "translateY(0) scale(0.9)" },
              "50%": { opacity: 1, transform: "translateY(-2px) scale(1.04)" },
            },
          }}
        />
      )}
      {popping && (
        <>
          <Box
            sx={{
              position: "absolute",
              left: `${13 * size}px`,
              bottom: `${10 * size}px`,
              width: `${28 * size}px`,
              height: `${28 * size}px`,
              borderRadius: "50%",
              border: "2px solid rgba(43,228,149,0.9)",
              animation: "evBurst 0.8s ease-out forwards",
              "@keyframes evBurst": {
                "0%": { transform: "scale(0.4)", opacity: 0.95 },
                "100%": { transform: "scale(1.8)", opacity: 0 },
              },
            }}
          />
          {Array.from({ length: 6 }).map((_, index) => (
            <Box
              key={index}
              sx={{
                position: "absolute",
                left: `${22 * size}px`,
                bottom: `${18 * size}px`,
                width: `${5 * size}px`,
                height: `${5 * size}px`,
                borderRadius: "50%",
                bgcolor: ["#00e896", "#00d4ff", "#a0ff60", "#50ffcc", "#00c87a", "#ffffff"][index],
                animation: `evSpark${index} 0.8s ease-out forwards`,
                [`@keyframes evSpark${index}`]: {
                  "0%": { transform: "translate(0, 0) scale(0.8)", opacity: 1 },
                  "100%": {
                    transform: `translate(${Math.cos((index / 6) * Math.PI * 2) * 24 * size}px, ${Math.sin((index / 6) * Math.PI * 2) * 24 * size}px) scale(0.3)`,
                    opacity: 0,
                  },
                },
              }}
            />
          ))}
        </>
      )}
      {[10, 38].map((wheelLeft) => (
        <Box
          key={wheelLeft}
          sx={{
            position: "absolute",
            left: `${wheelLeft * size}px`,
            bottom: 0,
            width: `${10 * size}px`,
            height: `${10 * size}px`,
            borderRadius: "50%",
            bgcolor: "#17201D",
            border: "2px solid #D3DDD7",
            animation: "wheelSpin 0.9s linear infinite",
            "@keyframes wheelSpin": {
              "0%": { transform: "rotate(0deg)" },
              "100%": { transform: "rotate(360deg)" },
            },
          }}
        />
      ))}
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
  const metrics = useMemo(() => getForecastMetrics(safeProgress), [safeProgress]);
  const prevEvCountRef = useRef(metrics.evVehicles);
  const [poppingVehicles, setPoppingVehicles] = useState([]);
  const gasVehicles = Math.max(0, 10 - metrics.evVehicles);
  const celebrationActive = safeProgress >= 96;
  const nightMode = safeProgress >= 72;

  const vehicleSlots = [
    { top: "28%", left: "14%", lane: 0, size: 0.82 },
    { top: "42%", left: "19%", lane: 1, size: 0.88 },
    { top: "56%", left: "24%", lane: 2, size: 0.96 },
    { top: "30%", left: "31%", lane: 0, size: 0.82 },
    { top: "44%", left: "38%", lane: 1, size: 0.88 },
    { top: "58%", left: "46%", lane: 2, size: 0.96 },
    { top: "32%", left: "54%", lane: 0, size: 0.82 },
    { top: "46%", left: "63%", lane: 1, size: 0.88 },
    { top: "60%", left: "73%", lane: 2, size: 0.96 },
    { top: "34%", left: "83%", lane: 0, size: 0.82 },
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
        <Box sx={{ flex: 1, textAlign: "left" }}>
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
              textAlign: "left",
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
            : "1px solid rgba(255,255,255,0.05)",
          boxShadow: interactive
            ? "0 30px 60px rgba(0,0,0,0.28)"
            : "0 10px 22px rgba(0,0,0,0.1)",
          bgcolor: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(10px)",
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

            {[0, 1, 2].map((laneIndex) => (
              <Box
                key={laneIndex}
                sx={{
                  position: "absolute",
                  left: `${laneIndex === 0 ? 7 : laneIndex === 1 ? 4 : 1}%`,
                  right: `${laneIndex === 0 ? 7 : laneIndex === 1 ? 4 : 1}%`,
                  top: `${laneIndex === 0 ? 12 : laneIndex === 1 ? 36 : 60}%`,
                  height: 3,
                  overflow: "hidden",
                  opacity: laneIndex === 0 ? 0.62 : laneIndex === 1 ? 0.78 : 0.9,
                  zIndex: 1,
                }}
              >
                <Box
                  sx={{
                    width: "180%",
                    height: "100%",
                    backgroundImage:
                      "repeating-linear-gradient(90deg, rgba(255,220,88,0) 0 28px, rgba(255,220,88,0.9) 28px 54px, rgba(255,220,88,0) 54px 92px)",
                    animation: `roadMove ${laneIndex === 0 ? 5.8 : laneIndex === 1 ? 5 : 4.3}s linear infinite`,
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
                  size={(interactive ? 0.9 : 0.94) * slot.size}
                  top={slot.top}
                  left={slot.left}
                  popping={poppingVehicles.includes(index)}
                />
              );
            })}
          </Box>

          {celebrationActive && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
              }}
            >
              {Array.from({ length: 18 }).map((_, index) => (
                <Box
                  key={index}
                  sx={{
                    position: "absolute",
                    left: `${18 + (index % 6) * 12}%`,
                    top: `${18 + Math.floor(index / 6) * 15}%`,
                    width: 10,
                    height: 18,
                    borderRadius: "12px 12px 2px 12px",
                    bgcolor: index % 2 === 0 ? "#2BE495" : "#A6FF7D",
                    opacity: 0.82,
                    animation: `celebrateLeaf ${1.6 + (index % 3) * 0.25}s ease-in-out ${index * 0.05}s infinite`,
                    "@keyframes celebrateLeaf": {
                      "0%": { transform: "translateY(0) rotate(0deg) scale(0.8)", opacity: 0 },
                      "20%": { opacity: 0.9 },
                      "100%": { transform: "translateY(-42px) rotate(26deg) scale(1.1)", opacity: 0 },
                    },
                  }}
                />
              ))}
              <Typography
                sx={{
                  position: "absolute",
                  left: "50%",
                  top: "19%",
                  transform: "translateX(-50%)",
                  fontSize: { xs: "1.05rem", md: interactive ? "1.35rem" : "1.8rem" },
                  fontWeight: 700,
                  color: "#F4FFF7",
                  textShadow: "0 8px 24px rgba(0,0,0,0.45)",
                }}
              >
                {t.achieved}
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ p: { xs: 2, md: 2.5 } }}>
          {showSlider && (
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2.5 }}>
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
