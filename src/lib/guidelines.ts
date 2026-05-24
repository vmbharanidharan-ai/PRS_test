import type {
  CancerType,
  PrsComputationResult,
  RiskTier,
  ScreeningRecommendation,
} from "./types";

interface GuidelineRule {
  minPercentile?: number;
  maxPercentile?: number;
  tiers?: RiskTier[];
  sex?: "female" | "male";
  minAge?: number;
  maxAge?: number;
  recommendations: ScreeningRecommendation[];
}

const BREAST_RULES: GuidelineRule[] = [
  {
    tiers: ["high"],
    sex: "female",
    recommendations: [
      {
        source: "NCCN",
        guideline: "NCCN Breast Cancer Screening (high-risk)",
        recommendation:
          "Discuss enhanced screening with your clinician: annual breast MRI plus mammography, typically starting at age 30 or 10 years before the youngest affected relative.",
        rationale:
          "Elevated polygenic risk may warrant risk-adapted screening similar to other intermediate-risk factors.",
      },
      {
        source: "USPSTF",
        guideline: "USPSTF — supplemental tools",
        recommendation:
          "USPSTF recommends mammography every 2 years for average-risk women 40–74. Higher PRS is not a USPSTF standalone indication for MRI; shared decision-making is advised.",
        rationale:
          "PRS is not yet incorporated into USPSTF Grade A/B recommendations.",
      },
    ],
  },
  {
    tiers: ["moderate"],
    sex: "female",
    recommendations: [
      {
        source: "ACS",
        guideline: "ACS Breast Cancer Screening",
        recommendation:
          "Consider annual mammography starting at age 40 (or earlier if family history). Discuss whether your PRS percentile changes your preferred start age.",
        rationale:
          "Moderate polygenic elevation (~80th–95th percentile) may justify earlier initiation through shared decision-making.",
      },
    ],
  },
  {
    tiers: ["average", "low"],
    sex: "female",
    recommendations: [
      {
        source: "USPSTF",
        guideline: "USPSTF Breast Cancer Screening (2024)",
        recommendation:
          "Biennial mammography from age 40–74 for average risk. Continue routine screening unless your clinician identifies additional risk factors.",
        rationale:
          "Your polygenic score falls within the population average range.",
      },
    ],
  },
];

const COLORECTAL_RULES: GuidelineRule[] = [
  {
    tiers: ["high", "moderate"],
    recommendations: [
      {
        source: "USPSTF",
        guideline: "USPSTF Colorectal Cancer Screening",
        recommendation:
          "Average-risk screening starts at age 45. With elevated polygenic risk, discuss starting at age 40 or using colonoscopy rather than stool-based tests.",
        rationale:
          "Earlier or more sensitive screening may be reasonable when combined with family history and PRS.",
      },
      {
        source: "NCCN",
        guideline: "NCCN Colorectal Cancer Screening",
        recommendation:
          "Colonoscopy every 10 years is standard for average risk. Higher PRS may support colonoscopy every 5 years after shared decision-making.",
        rationale:
          "NCCN allows individualized intervals for increased-risk individuals.",
      },
    ],
  },
  {
    tiers: ["average", "low"],
    recommendations: [
      {
        source: "USPSTF",
        guideline: "USPSTF Colorectal Cancer Screening (2021)",
        recommendation:
          "Screen from age 45–75 using colonoscopy, FIT, or other USPSTF-recommended modalities.",
        rationale: "Polygenic score within population norms.",
      },
    ],
  },
];

const PROSTATE_RULES: GuidelineRule[] = [
  {
    tiers: ["high"],
    sex: "male",
    recommendations: [
      {
        source: "NCCN",
        guideline: "NCCN Prostate Cancer Early Detection",
        recommendation:
          "Discuss baseline PSA and shared decision-making about annual PSA and digital rectal exam from age 40–45, especially if African ancestry or family history.",
        rationale:
          "High polygenic risk for prostate cancer may lower the threshold for early PSA discussion.",
      },
    ],
  },
  {
    tiers: ["moderate", "average", "low"],
    sex: "male",
    recommendations: [
      {
        source: "USPSTF",
        guideline: "USPSTF Prostate Cancer Screening",
        recommendation:
          "For men 55–69, PSA screening is an individual decision. USPSTF does not recommend routine PSA for all men; discuss benefits and harms with your clinician.",
        rationale:
          "USPSTF emphasizes shared decision-making regardless of PRS.",
      },
    ],
  },
];

const OVARIAN_RULES: GuidelineRule[] = [
  {
    tiers: ["high", "moderate"],
    sex: "female",
    recommendations: [
      {
        source: "NCCN",
        guideline: "NCCN Genetic/Familial High-Risk Assessment",
        recommendation:
          "There is no routine ovarian screening for average-risk women. With elevated PRS plus family history, discuss genetic counseling for BRCA1/2 and Lynch syndrome.",
        rationale:
          "Polygenic risk alone does not trigger NCCN ovarian screening; pathogenic variants change management.",
      },
    ],
  },
  {
    tiers: ["average", "low"],
    sex: "female",
    recommendations: [
      {
        source: "USPSTF",
        guideline: "USPSTF Ovarian Cancer Screening",
        recommendation:
          "USPSTF recommends against screening asymptomatic average-risk women for ovarian cancer (Grade D).",
        rationale:
          "No effective population screening exists; PRS elevation alone does not change this.",
      },
    ],
  },
];

const RULES: Record<CancerType, GuidelineRule[]> = {
  breast: BREAST_RULES,
  colorectal: COLORECTAL_RULES,
  prostate: PROSTATE_RULES,
  ovarian: OVARIAN_RULES,
};

export function getScreeningRecommendations(
  cancerType: CancerType,
  prs: PrsComputationResult,
  options?: { sex?: "female" | "male"; age?: number },
): ScreeningRecommendation[] {
  const rules = RULES[cancerType];
  const matched: ScreeningRecommendation[] = [];

  for (const rule of rules) {
    if (rule.tiers && !rule.tiers.includes(prs.riskTier)) continue;
    if (rule.sex && options?.sex && rule.sex !== options.sex) continue;
    if (rule.minAge && options?.age && options.age < rule.minAge) continue;
    if (rule.maxAge && options?.age && options.age > rule.maxAge) continue;
    matched.push(...rule.recommendations);
  }

  if (matched.length === 0) {
    return [
      {
        source: "general",
        guideline: "Clinical follow-up",
        recommendation:
          "Discuss this polygenic risk result with your primary care clinician or a genetic counselor.",
        rationale:
          "Guidelines vary by age, sex, and family history not captured in this report.",
      },
    ];
  }

  return matched;
}

export const GLOBAL_DISCLAIMER = `This report is for educational and informational purposes only. It is not medical advice, a diagnosis, or a substitute for care from a licensed clinician. Polygenic risk scores estimate statistical risk from common DNA variants; they do not detect cancer, pathogenic mutations (e.g., BRCA1/2), or guarantee future health outcomes. Always discuss results and screening decisions with your physician or genetic counselor. PRS Screen does not store your genetic data.`;
