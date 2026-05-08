from __future__ import annotations

import re

MODE_PROMPTS: dict[str, str] = {
    "space_researcher": (
        "You are a rigorous space researcher. Prioritize evidence, identify uncertainty, "
        "and compare NASA and arXiv findings before concluding."
    ),
    "space_scientist": (
        "You are a space scientist focused on measurements, methods, and reproducibility. "
        "Use precise technical language and link findings to known physical principles."
    ),
    "astronaut": (
        "You are an astronaut advisor focused on mission practicality, safety, and operations. "
        "Translate theory into flight-relevant guidance."
    ),
    "mission_commander": (
        "You are a mission commander. Emphasize decision quality, risks, priorities, and "
        "execution trade-offs."
    ),
    "astrophysicist": (
        "You are an astrophysicist. Center the response on theory, models, and interpretation "
        "of astronomical observations."
    ),
}

THINKING_STYLE_PROMPTS: dict[str, str] = {
    "deep_thinking": "Perform deep, stepwise reasoning before presenting the final answer.",
    "analytical_thinking": "Use an analytical structure with assumptions, evidence, and conclusions.",
    # "creative_thinking": "Generate at least one novel but plausible hypothesis grounded in evidence.",
    # "critical_thinking": "Critique claims, list limitations, and challenge weak assumptions.",
    # "strategic_thinking": "Frame guidance with strategy, timelines, risks, and contingency plans.",
}

MODE_ALIASES: dict[str, str] = {
    "space researcher": "space_researcher",
    "space_scientist": "space_scientist",
    "space scientist": "space_scientist",
    "astronaut": "astronaut",
    "mission commander": "mission_commander",
    "mission_commander": "mission_commander",
    "astrophysicist": "astrophysicist",
    "space_researcher": "space_researcher",
    "🔬space researcher": "space_researcher",
    "🧪space scientist": "space_scientist",
    "🧑‍🚀astronaut": "astronaut",
    "🎖️mission commander": "mission_commander",
    "🌌astrophysicist": "astrophysicist",
}

THINKING_STYLE_ALIASES: dict[str, str] = {
    "deep thinking": "deep_thinking",
    "deep_thinking": "deep_thinking",
    "analytical thinking": "analytical_thinking",
    "analytical_thinking": "analytical_thinking",
    # "creative thinking": "creative_thinking",
    # "creative_thinking": "creative_thinking",
    "critical thinking": "critical_thinking",
    "critical_thinking": "critical_thinking",
    # "strategic thinking": "strategic_thinking",
    # "strategic_thinking": "strategic_thinking",
    "📊analytical thinking": "analytical_thinking",
    # "💡creative thinking": "creative_thinking",
    # "🔍critical thinking": "critical_thinking",
    # "♟️strategic thinking": "strategic_thinking",
}


def _normalize_key(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"\s+", " ", value)
    return value


def normalize_mode(mode: str | None) -> str:
    if not mode:
        return "space_researcher"
    key = _normalize_key(mode)
    return MODE_ALIASES.get(key, "space_researcher")


def normalize_thinking_style(style: str | None) -> str:
    if not style:
        return "deep_thinking"
    key = _normalize_key(style)
    return THINKING_STYLE_ALIASES.get(key, "deep_thinking")


def build_persona_prompt(mode: str, thinking_style: str) -> str:
    mode_key = normalize_mode(mode)
    style_key = normalize_thinking_style(thinking_style)

    mode_prompt = MODE_PROMPTS[mode_key]
    style_prompt = THINKING_STYLE_PROMPTS[style_key]

    return (
        f"{mode_prompt} {style_prompt} "
        "Use only NASA and arXiv evidence available in context. "
        "Do not claim web search or external sources beyond provided tool outputs."
    )
