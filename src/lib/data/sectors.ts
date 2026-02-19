export const SECTOR_SUB_SECTORS: Record<string, string[]> = {
  Energy: [
    "Oil & Gas Exploration",
    "Oil & Gas Refining",
    "Renewable Energy",
    "Power Generation",
    "Energy Trading & Services",
  ],
  Materials: [
    "Chemicals",
    "Construction Materials",
    "Metals & Mining",
    "Paper & Forest Products",
    "Packaging",
  ],
  Industrials: [
    "Aerospace & Defense",
    "Building Products",
    "Electrical Equipment",
    "Industrial Conglomerates",
    "Machinery",
    "Commercial Services",
  ],
  Manufacturing: [
    "Automotive",
    "Electronics",
    "Food & Beverage Processing",
    "Pharmaceuticals",
    "Textiles & Apparel",
    "Metals & Steel",
  ],
  "Transportation & Logistics": [
    "Air Freight & Airlines",
    "Maritime Shipping",
    "Rail Transport",
    "Road & Trucking",
    "Warehousing & Distribution",
  ],
  Technology: [
    "Software Development",
    "Hardware & Semiconductors",
    "IT Services & Consulting",
    "Data Centers & Cloud",
    "Telecommunications",
  ],
  "Financial Services": [
    "Banking",
    "Insurance",
    "Asset Management",
    "Fintech",
    "Real Estate Investment",
  ],
  "Construction & Real Estate": [
    "Commercial Construction",
    "Residential Construction",
    "Property Management",
    "Infrastructure Development",
  ],
  "Agriculture & Forestry": [
    "Crop Production",
    "Livestock & Dairy",
    "Forestry & Logging",
    "Fisheries & Aquaculture",
    "Agricultural Services",
  ],
  Utilities: [
    "Electric Utilities",
    "Gas Utilities",
    "Water & Wastewater",
    "Waste Management & Recycling",
  ],
  Healthcare: [
    "Hospitals & Health Systems",
    "Pharmaceuticals & Biotech",
    "Medical Devices",
    "Health Services",
  ],
  "Consumer Goods & Retail": [
    "Food & Beverage Retail",
    "Consumer Products",
    "Wholesale & Distribution",
    "E-Commerce",
  ],
  "Hospitality & Tourism": [
    "Hotels & Accommodation",
    "Restaurants & Food Services",
    "Travel & Leisure",
  ],
  "Mining & Extraction": [
    "Coal Mining",
    "Metal Ore Mining",
    "Non-Metallic Mining",
    "Quarrying",
  ],
};

export const SECTORS = Object.keys(SECTOR_SUB_SECTORS);

export function getSubSectors(
  sector: string | null | undefined,
): string[] {
  return sector ? (SECTOR_SUB_SECTORS[sector] ?? []) : [];
}
