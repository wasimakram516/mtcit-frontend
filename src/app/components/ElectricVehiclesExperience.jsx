"use client";
import { useMemo } from "react";
import { Box, Chip, Slider, Stack, Typography } from "@mui/material";

const EV_DATA = [
  { year: 2017, count: 4 },
  { year: 2018, count: 76 },
  { year: 2019, count: 71 },
  { year: 2020, count: 24 },
  { year: 2021, count: 33 },
  { year: 2022, count: 99 },
  { year: 2023, count: 191 },
  { year: 2024, count: 455 },
  { year: 2025, count: 3000 },
  { year: 2026, count: 5549 },
];

const copy = {
  en: {
    title: "Electric Vehicles Growth Map",
    subtitle: "Track Oman EV registrations and watch the map fill outward over time.",
    selectedYear: "Selected year",
    vehiclesRegistered: "electric vehicles registered",
    target: "of 5,549 target",
    veryEarly: "Very early adoption",
    growing: "Growing momentum",
    rapid: "Rapid growth phase",
    near: "Near target",
    reached: "Target reached",
    firstRecorded: "first recorded year",
    vs: "vs",
    allYears: "All years",
    from: "2017",
    to: "2026",
    mapFill: "Map fill",
    growth: "Growth trend",
  },
  ar: {
    title: "خريطة نمو المركبات الكهربائية",
    subtitle: "تابع تسجيل المركبات الكهربائية في عُمان وشاهد الخريطة تمتلئ تدريجياً مع الزمن.",
    selectedYear: "السنة المختارة",
    vehiclesRegistered: "مركبة كهربائية مسجلة",
    target: "من هدف 5,549",
    veryEarly: "مرحلة مبكرة جداً",
    growing: "زخم متزايد",
    rapid: "مرحلة نمو متسارعة",
    near: "قريب من الهدف",
    reached: "تم الوصول إلى الهدف",
    firstRecorded: "أول سنة مسجلة",
    vs: "مقارنة مع",
    allYears: "جميع السنوات",
    from: "2017",
    to: "2026",
    mapFill: "امتلاء الخريطة",
    growth: "اتجاه النمو",
  },
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getExperienceMetrics(yearIndex) {
  const safeIndex = clamp(Math.round(Number(yearIndex) || 0), 0, EV_DATA.length - 1);
  const current = EV_DATA[safeIndex];
  const previous = safeIndex > 0 ? EV_DATA[safeIndex - 1] : null;
  const percent = current.count / EV_DATA[EV_DATA.length - 1].count;
  const percentRounded = Math.round(percent * 100);
  const ringOffset = 131.9 - percent * 131.9;
  const mapRadius = Math.round(Math.sqrt(percent) * 148);
  const revealRadiusPercent = Math.sqrt(percent) * 58;
  const changePercent = previous
    ? Math.round(((current.count - previous.count) / previous.count) * 100)
    : null;

  let statusLabel = "Very early adoption";
  if (percentRounded >= 90) statusLabel = "Target reached";
  else if (percentRounded >= 60) statusLabel = "Near target";
  else if (percentRounded >= 30) statusLabel = "Rapid growth phase";
  else if (percentRounded >= 10) statusLabel = "Growing momentum";

  return {
    safeIndex,
    current,
    previous,
    percent,
    percentRounded,
    ringOffset,
    mapRadius,
    revealRadiusPercent,
    changePercent,
    statusLabel,
  };
}

function getLocalizedStatus(label, language) {
  const t = copy[language] || copy.en;
  if (label === "Target reached") return t.reached;
  if (label === "Near target") return t.near;
  if (label === "Rapid growth phase") return t.rapid;
  if (label === "Growing momentum") return t.growing;
  return t.veryEarly;
}

export default function ElectricVehiclesExperience({
  language = "en",
  yearIndex = 9,
  interactive = false,
  showSlider = interactive,
  onYearIndexChange,
}) {
  const isArabic = language === "ar";
  const t = copy[language] || copy.en;
  const metrics = useMemo(() => getExperienceMetrics(yearIndex), [yearIndex]);
  const revealRadius = 8 + metrics.percent * 64;

  return (
    <Box
      dir={isArabic ? "rtl" : "ltr"}
      sx={{
        width: "100%",
        maxWidth: interactive ? "min(92vw, 1040px)" : "100%",
        mx: "auto",
        color: "#F6FCF6",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 2.5 }}
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
          label={metrics.current.year}
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
            p: "clamp(18px, 2vw, 28px)",
            background:
              "linear-gradient(180deg, rgba(11,40,18,0.72) 0%, rgba(9,86,25,0.62) 52%, rgba(21,122,57,0.46) 100%)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing="clamp(18px, 2vw, 28px)"
            alignItems="stretch"
          >
            <Box
              sx={{
                flex: { xs: "unset", md: "0 0 clamp(190px, 20vw, 250px)" },
                width: { xs: "100%", md: "auto" },
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "clamp(220px, 28vw, 320px)",
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  width: "clamp(230px, 24vw, 320px)",
                  aspectRatio: "168 / 344",
                  filter: "drop-shadow(0 18px 30px rgba(0,0,0,0.2))",
                }}
              >
                <Box
                  component="img"
                  src="/oman-ev-green.png"
                  alt=""
                  aria-hidden="true"
                  sx={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    userSelect: "none",
                    pointerEvents: "none",
                    opacity: 1,
                  }}
                />
                <Box
                  component="img"
                  src="/oman-ev-green.png"
                  alt=""
                  aria-hidden="true"
                  sx={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    userSelect: "none",
                    pointerEvents: "none",
                    filter: "grayscale(1) saturate(0.2) brightness(0.92)",
                    WebkitMaskImage: `radial-gradient(circle at 44% 53%, transparent 0%, transparent ${revealRadius - 1}%, black ${revealRadius + 1}%, black 100%)`,
                    maskImage: `radial-gradient(circle at 44% 53%, transparent 0%, transparent ${revealRadius - 1}%, black ${revealRadius + 1}%, black 100%)`,
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    transition:
                      "-webkit-mask-image 0.8s cubic-bezier(.4,0,.2,1), mask-image 0.8s cubic-bezier(.4,0,.2,1)",
                  }}
                />
              </Box>
            </Box>

            <Stack
              spacing="clamp(16px, 1.8vw, 26px)"
              sx={{
                flex: 1,
                minHeight: "clamp(220px, 28vw, 320px)",
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontSize: "clamp(0.68rem, 0.84vw, 0.78rem)",
                    color: "rgba(246,252,246,0.72)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    mb: 0.5,
                  }}
                >
                  {t.selectedYear}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "clamp(2.6rem, 5vw, 4.4rem)",
                    lineHeight: 1,
                    fontWeight: 700,
                  }}
                >
                  {metrics.current.year}
                </Typography>
                <Typography
                  sx={{
                    mt: 0.8,
                    fontSize: "clamp(1.5rem, 2.5vw, 2.6rem)",
                    fontWeight: 700,
                    color: "#8DF0C7",
                  }}
                >
                  {metrics.current.count.toLocaleString()}
                </Typography>
                <Typography
                  sx={{
                    mt: 0.2,
                    fontSize: "clamp(0.82rem, 1vw, 0.96rem)",
                    color: "rgba(246,252,246,0.74)",
                  }}
                >
                  {t.vehiclesRegistered}
                </Typography>
                <Chip
                  label={
                    metrics.previous
                      ? `${metrics.changePercent >= 0 ? "+" : ""}${metrics.changePercent}% ${t.vs} ${metrics.previous.year}`
                      : t.firstRecorded
                  }
                  sx={{
                    mt: 1.4,
                    bgcolor: metrics.previous
                      ? metrics.changePercent >= 0
                        ? "rgba(225,245,238,0.94)"
                        : "rgba(250,236,231,0.94)"
                      : "rgba(255,255,255,0.12)",
                    color: metrics.previous
                      ? metrics.changePercent >= 0
                        ? "#0F6E56"
                        : "#993C1D"
                      : "#F6FCF6",
                    fontWeight: 700,
                    borderRadius: "999px",
                  }}
                />
              </Box>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing="clamp(14px, 1.6vw, 24px)"
                alignItems={{ xs: "flex-start", sm: "center" }}
              >
                <Box
                  sx={{
                    position: "relative",
                    width: "clamp(54px, 5vw, 66px)",
                    height: "clamp(54px, 5vw, 66px)",
                    flexShrink: 0,
                  }}
                >
                  <Box
                    component="svg"
                    viewBox="0 0 52 52"
                    sx={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
                  >
                    <circle cx="26" cy="26" r="21" fill="none" stroke="#E1F5EE" strokeWidth="4" />
                    <circle
                      cx="26"
                      cy="26"
                      r="21"
                      fill="none"
                      stroke="#1D9E75"
                      strokeWidth="4"
                      strokeDasharray="131.9"
                      strokeDashoffset={metrics.ringOffset}
                      strokeLinecap="round"
                      transform="rotate(-90 26 26)"
                      style={{
                        transition: "stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)",
                      }}
                    />
                  </Box>
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "clamp(0.72rem, 0.85vw, 0.84rem)",
                      fontWeight: 700,
                    }}
                  >
                    {metrics.percentRounded}%
                  </Box>
                </Box>

                <Box>
                  <Typography
                    sx={{
                      fontSize: "clamp(0.84rem, 1vw, 0.98rem)",
                      lineHeight: 1.5,
                    }}
                  >
                    <Box component="span" sx={{ color: "#8DF0C7", fontWeight: 700 }}>
                      {metrics.percentRounded}%
                    </Box>{" "}
                    {t.target}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "clamp(0.8rem, 0.95vw, 0.92rem)",
                      color: "rgba(246,252,246,0.72)",
                    }}
                  >
                    {getLocalizedStatus(metrics.statusLabel, language)}
                  </Typography>
                </Box>
              </Stack>

              <Box>
                <Typography
                  sx={{
                    fontSize: "clamp(0.72rem, 0.86vw, 0.8rem)",
                    color: "rgba(246,252,246,0.72)",
                    mb: 0.8,
                  }}
                >
                  {t.allYears}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: "clamp(3px, 0.3vw, 6px)",
                    height: "clamp(48px, 6vw, 68px)",
                  }}
                >
                  {EV_DATA.map((item, index) => {
                    const height = Math.max(
                      10,
                      Math.round(
                        (Math.log(item.count) / Math.log(EV_DATA[EV_DATA.length - 1].count)) * 54
                      )
                    );
                    const bg =
                      index === metrics.safeIndex
                        ? "#378ADD"
                        : index < metrics.safeIndex
                          ? "#1D9E75"
                          : "rgba(211,209,199,0.85)";
                    return (
                      <Box
                        key={item.year}
                        sx={{
                          flex: 1,
                          height: `${height}px`,
                          borderRadius: "4px 4px 0 0",
                          bgcolor: bg,
                          transition: "background-color 0.35s ease, height 0.5s cubic-bezier(.4,0,.2,1)",
                        }}
                      />
                    );
                  })}
                </Box>
              </Box>
            </Stack>
          </Stack>
        </Box>

        <Box sx={{ p: { xs: 2, md: 2.5 } }}>
          {showSlider && (
            <Stack spacing={1.2} sx={{ mb: 2.5 }}>
              <Box
                sx={{
                  alignSelf: "flex-start",
                  px: 1.2,
                  py: 0.5,
                  borderRadius: "8px",
                  bgcolor: "#1D9E75",
                  color: "#04342C",
                  fontSize: "clamp(0.78rem, 0.9vw, 0.88rem)",
                  fontWeight: 700,
                  boxShadow: "0 10px 18px rgba(29,158,117,0.22)",
                }}
              >
                {metrics.current.year}
              </Box>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography variant="caption" sx={{ color: "rgba(246,252,246,0.86)", minWidth: 40 }}>
                  {t.from}
                </Typography>
                <Slider
                  min={0}
                  max={EV_DATA.length - 1}
                  step={1}
                  value={metrics.safeIndex}
                  onChange={(_, value) => {
                    if (typeof onYearIndexChange === "function") {
                      onYearIndexChange(Array.isArray(value) ? value[0] : value);
                    }
                  }}
                  aria-label="electric vehicles year index"
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
              { label: t.selectedYear, value: metrics.current.year },
              { label: t.vehiclesRegistered, value: metrics.current.count.toLocaleString() },
              { label: t.mapFill, value: `${metrics.percentRounded}%` },
              { label: t.growth, value: getLocalizedStatus(metrics.statusLabel, language) },
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
