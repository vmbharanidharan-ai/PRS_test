import type {
  CancerType,
  PrsComputationResult,
  RiskTier,
  ScreeningTimelineItem,
} from "./types";

export function buildScreeningTimelineFromTier(
  cancerType: CancerType,
  tier: RiskTier,
  options?: { sex?: "female" | "male"; age?: number },
): ScreeningTimelineItem[] {
  const age = options?.age ?? 40;

  switch (cancerType) {
    case "breast":
      if (options?.sex !== "female") {
        return generalNote(
          "Breast cancer screening timelines apply when clinically relevant to your sex and history.",
        );
      }
      return breastTimeline(tier, age);
    case "colorectal":
      return colorectalTimeline(tier, age);
    case "prostate":
      if (options?.sex !== "male") {
        return generalNote(
          "Prostate screening discussions apply to individuals with a prostate.",
        );
      }
      return prostateTimeline(tier, age);
    case "ovarian":
      if (options?.sex !== "female") {
        return generalNote(
          "Ovarian cancer context applies when clinically relevant to your history.",
        );
      }
      return ovarianTimeline(tier);
    default:
      return [];
  }
}

export function buildScreeningTimeline(
  cancerType: CancerType,
  prs: PrsComputationResult,
  options?: { sex?: "female" | "male"; age?: number },
): ScreeningTimelineItem[] {
  return buildScreeningTimelineFromTier(cancerType, prs.riskTier, options);
}

function generalNote(text: string): ScreeningTimelineItem[] {
  return [
    {
      age: 0,
      label: "General information",
      description: text,
      source: "general",
      framing: "educational",
    },
  ];
}

function breastTimeline(tier: RiskTier, currentAge: number): ScreeningTimelineItem[] {
  const items: ScreeningTimelineItem[] = [
    {
      age: 40,
      label: "Typical discussion age (USPSTF context)",
      description:
        "Many guidelines discuss mammography starting around age 40 for average-risk women — timing is individualized.",
      source: "USPSTF",
      framing: "general_guideline",
    },
    {
      age: 50,
      label: "Routine screening window",
      description:
        "Biennial mammography is commonly discussed for average risk between ages 50–74 in U.S. guidelines.",
      source: "USPSTF",
      framing: "general_guideline",
    },
  ];

  if (tier === "moderate" || tier === "high") {
    items.unshift({
      age: Math.min(40, Math.max(30, currentAge)),
      label: "Earlier conversation (higher PRS context)",
      description:
        "Some clinicians discuss earlier mammography or supplemental imaging when polygenic and family risk factors align — not automatic.",
      source: "NCCN",
      framing: "general_guideline",
    });
  }

  return items.sort((a, b) => a.age - b.age);
}

function colorectalTimeline(
  tier: RiskTier,
  currentAge: number,
): ScreeningTimelineItem[] {
  const start =
    tier === "high" || tier === "moderate"
      ? Math.min(45, Math.max(40, currentAge))
      : 45;

  return [
    {
      age: start,
      label: "Screening discussion age",
      description:
        "U.S. guidelines often discuss colorectal screening from age 45; higher polygenic signals may prompt earlier shared decision-making.",
      source: "USPSTF",
      framing: "general_guideline",
    },
    {
      age: 50,
      label: "Common screening ages",
      description:
        "Colonoscopy, FIT, or other approved methods are discussed based on preference and risk.",
      source: "USPSTF",
      framing: "general_guideline",
    },
    {
      age: 75,
      label: "Upper screening age (average risk)",
      description:
        "Guidelines often taper screening discussions after 75 depending on health status.",
      source: "USPSTF",
      framing: "general_guideline",
    },
  ];
}

function prostateTimeline(tier: RiskTier, currentAge: number): ScreeningTimelineItem[] {
  const items: ScreeningTimelineItem[] = [
    {
      age: 55,
      label: "Shared decision-making window",
      description:
        "PSA screening is commonly discussed as an individual choice for men 55–69 in U.S. guidelines.",
      source: "USPSTF",
      framing: "general_guideline",
    },
  ];

  if (tier === "high" || tier === "moderate") {
    items.unshift({
      age: Math.min(45, Math.max(40, currentAge)),
      label: "Earlier discussion (higher PRS context)",
      description:
        "Some clinicians discuss baseline PSA earlier when risk factors cluster — benefits and harms still weighed.",
      source: "NCCN",
      framing: "general_guideline",
    });
  }

  return items.sort((a, b) => a.age - b.age);
}

function ovarianTimeline(tier: RiskTier): ScreeningTimelineItem[] {
  return [
    {
      age: 0,
      label: "No routine population screening",
      description:
        "U.S. guidelines generally do not recommend ovarian screening for average-risk women (limited benefit).",
      source: "USPSTF",
      framing: "general_guideline",
    },
    ...(tier === "moderate" || tier === "high"
      ? [
          {
            age: 0,
            label: "Genetic counseling context",
            description:
              "Elevated PRS plus family history may prompt discussion of BRCA/Lynch testing — not ultrasound screening alone.",
            source: "NCCN",
            framing: "general_guideline",
          } as ScreeningTimelineItem,
        ]
      : []),
  ];
}
