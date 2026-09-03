"""Single source of truth for crops supported by the price-intelligence service."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class CommoditySpec:
    api_names: tuple[str, ...]
    price_range: tuple[int, int]
    harvest_months: frozenset[int]
    peak_harvest_month: int
    base_arrivals: float
    seasonal_phase: float
    seasonal_amplitude: float


COMMODITY_SPECS: dict[str, CommoditySpec] = {
    "Tomato": CommoditySpec(("Tomato",), (800, 3200), frozenset({2, 3, 4, 9, 10}), 9, 52, 0.5, 0.34),
    "Onion": CommoditySpec(("Onion",), (400, 2800), frozenset({3, 4, 5, 9, 10}), 10, 88, 1.0, 0.38),
    "Potato": CommoditySpec(("Potato",), (600, 1600), frozenset({1, 2, 3}), 2, 64, 0.0, 0.13),
    "Brinjal": CommoditySpec(("Brinjal",), (700, 2800), frozenset({1, 2, 3, 9, 10, 11, 12}), 11, 37, 0.4, 0.27),
    "Green Chilli": CommoditySpec(("Green Chilli", "Chilly Capsicum"), (1200, 5000), frozenset({1, 2, 7, 8}), 7, 24, 0.8, 0.40),
    "Cabbage": CommoditySpec(("Cabbage",), (400, 1800), frozenset({1, 2, 11, 12}), 12, 44, -0.2, 0.24),
    "Cauliflower": CommoditySpec(("Cauliflower",), (500, 2600), frozenset({1, 2, 11, 12}), 12, 39, -0.1, 0.29),
    "Okra": CommoditySpec(("Bhindi(Ladies Finger)", "Ladies Finger", "Okra"), (900, 3600), frozenset({3, 4, 5, 6, 9, 10}), 5, 30, 0.7, 0.30),
    "Capsicum": CommoditySpec(("Capsicum",), (1200, 4800), frozenset({1, 2, 3, 10, 11, 12}), 11, 21, 0.1, 0.33),
    "Cucumber": CommoditySpec(("Cucumbar(Kheera)", "Cucumber", "Kheera"), (500, 2200), frozenset({2, 3, 4, 5, 10, 11}), 4, 34, 0.6, 0.26),
    "Bottle Gourd": CommoditySpec(("Bottle gourd", "Bottle Gourd"), (500, 2200), frozenset({2, 3, 4, 7, 8, 9}), 8, 27, 0.5, 0.25),
    "Bitter Gourd": CommoditySpec(("Bitter gourd", "Bitter Gourd"), (900, 3400), frozenset({2, 3, 4, 7, 8}), 8, 23, 0.8, 0.31),
    "Pumpkin": CommoditySpec(("Pumpkin",), (400, 1600), frozenset({1, 2, 3, 9, 10}), 10, 33, 0.3, 0.19),
    "Carrot": CommoditySpec(("Carrot",), (700, 2600), frozenset({1, 2, 11, 12}), 12, 29, -0.1, 0.25),
    "Radish": CommoditySpec(("Raddish", "Radish"), (400, 1800), frozenset({1, 2, 11, 12}), 12, 31, -0.2, 0.22),
    "Peas": CommoditySpec(("Peas Wet", "Peas", "Green Peas"), (1200, 5200), frozenset({1, 2, 11, 12}), 1, 19, -0.4, 0.38),
    "Garlic": CommoditySpec(("Garlic",), (2500, 12000), frozenset({2, 3, 4}), 3, 28, 0.2, 0.35),
    "Ginger": CommoditySpec(("Ginger(Green)", "Ginger Green", "Ginger"), (1800, 9000), frozenset({1, 2, 11, 12}), 12, 22, -0.3, 0.36),
    "Grapes": CommoditySpec(("Grapes",), (8000, 24000), frozenset({2, 3, 4}), 3, 31, -1.8, 0.32),
    "Banana": CommoditySpec(("Banana",), (900, 2600), frozenset({9, 10, 11, 12}), 10, 58, 0.5, 0.19),
    "Pomegranate": CommoditySpec(("Pomegranate",), (4500, 14000), frozenset({7, 8, 9, 10}), 9, 26, -0.8, 0.28),
    "Wheat": CommoditySpec(("Wheat",), (1800, 2600), frozenset({3, 4, 5}), 4, 115, -0.2, 0.08),
    "Maize": CommoditySpec(("Maize",), (1500, 2800), frozenset({9, 10, 11}), 10, 86, 0.1, 0.12),
    "Chickpea": CommoditySpec(("Chickpea", "Gram"), (3800, 6800), frozenset({2, 3, 4}), 3, 42, -0.4, 0.16),
    "Pigeon Pea": CommoditySpec(("Pigeon Pea", "Arhar (Tur/Red Gram)"), (5200, 9000), frozenset({12, 1, 2}), 1, 34, 0.7, 0.19),
    "Soybean": CommoditySpec(("Soybean",), (3000, 6200), frozenset({9, 10, 11}), 10, 78, 0.2, 0.17),
    "Groundnut": CommoditySpec(("Groundnut",), (4200, 7600), frozenset({9, 10, 11}), 10, 46, 0.4, 0.18),
    "Cotton": CommoditySpec(("Cotton",), (5000, 9000), frozenset({10, 11, 12, 1}), 11, 62, 0.6, 0.15),
    "Turmeric": CommoditySpec(("Turmeric",), (7000, 16500), frozenset({1, 2, 3}), 2, 24, -0.5, 0.24),
}

COMMODITIES = list(COMMODITY_SPECS)
HARVEST_MONTHS = {name: set(spec.harvest_months) for name, spec in COMMODITY_SPECS.items()}
PEAK_HARVEST_MONTH = {name: spec.peak_harvest_month for name, spec in COMMODITY_SPECS.items()}

_API_NAME_LOOKUP = {
    api_name.casefold(): canonical
    for canonical, spec in COMMODITY_SPECS.items()
    for api_name in spec.api_names
}


def canonical_commodity(api_name: str) -> str | None:
    """Map the publisher's crop spelling to the name shown by माझे Kisan."""
    return _API_NAME_LOOKUP.get(api_name.strip().casefold())
