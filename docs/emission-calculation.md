# Emission Factor Data Model & Storage Strategy

**Date**: 2026-02-20
**Status**: Draft
**Scope**: Scope 1 (Stationary & Mobile Combustion)

## Overview

To support high-performance, multi-tenant GHG calculations, the system must store and version emission factors from multiple scientific authorities (IPCC, DEFRA, EPA). This document defines the database schema for the "Factor Dump" and the logic for resolving factors by version and year.

## 1. Database Schema

### Table: `emission_factor_libraries`

Acts as a container for a specific dataset import (e.g., "IPCC 2006 Database" or "DEFRA 2024").

| Column         | Type    | Description                                          |
| :------------- | :------ | :--------------------------------------------------- |
| `id`           | UUID    | Primary Key                                          |
| `name`         | Text    | Human-readable name (e.g., "IPCC 2006 EFDB")         |
| `authority`    | Enum    | `ipcc`, `defra`, `epa`, `iea`, `egrid`               |
| `version`      | Text    | Version identifier (e.g., "v1.0", "2019-Refinement") |
| `release_year` | Integer | Publication year (e.g., 2024)                        |
| `is_default`   | Boolean | System default for this authority                    |

### Table: `emission_factors`

The granular factors linked to a specific library version.

| Column             | Type    | Description                                             |
| :----------------- | :------ | :------------------------------------------------------ |
| `id`               | UUID    | Primary Key                                             |
| `library_id`       | UUID    | FK to `emission_factor_libraries`                       |
| `external_id`      | Text    | Original ID from source (e.g., EFDB ID "13932")         |
| `category`         | Text    | IPCC Category (e.g., "1.A.1", "1.A.3.b")                |
| `fuel_type`        | Text    | Standardized fuel name (e.g., "Natural Gas")            |
| `gas`              | Text    | Greenhouse gas (e.g., "CO2", "CH4", "N2O")              |
| `is_biogenic`      | Boolean | If true, gas is reported separately from Scope 1 totals |
| `value`            | Numeric | The numerical factor                                    |
| `oxidation_factor` | Numeric | Default 1.0 (complete oxidation)                        |
| `unit`             | Text    | Unit of the factor (e.g., "kg/TJ", "g/kg")              |
| `region`           | Text    | Regional context (e.g., "Europe", "US", "Global")       |
| `technology`       | Text    | Specific tech/practice (e.g., "Three-way catalyst")     |

## 2. Example Data Rows

### Example A: Stationary Combustion (IPCC 2006)

**Library**: { name: "IPCC 2006", authority: "ipcc", release_year: 2006 }

| external_id | fuel_type   | gas | value | unit  | category |
| :---------- | :---------- | :-- | :---- | :---- | :------- |
| 13932       | Natural Gas | CO2 | 56100 | kg/TJ | 1.A.1    |
| 13933       | Natural Gas | CH4 | 1.0   | kg/TJ | 1.A.1    |

### Example B: Mobile Combustion (Regional/Tech Specific)

**Library**: { name: "IPCC 2006", authority: "ipcc", release_year: 2006 }

| external_id | fuel_type      | gas | value | unit | category | region | technology         |
| :---------- | :------------- | :-- | :---- | :--- | :------- | :----- | :----------------- |
| 15421       | Motor Gasoline | CH4 | 0.3   | g/kg | 1.A.3.b  | Europe | Three-way catalyst |
| 15422       | Motor Gasoline | CH4 | 0.8   | g/kg | 1.A.3.b  | Europe | Uncontrolled       |

## 3. Versioning & Import Logic

1. **Immutability**: Once a library is imported, its factors are never updated.
2. **New Datasets**: Importing "DEFRA 2025" creates a new `library_id`. Existing calculations for 2024 remain linked to the 2024 `library_id`.
3. **Resolution**: The calculation engine resolves the factor by matching:
   - Authority (Tenant/OrgUnit preference)
   - Reporting Year (Matches `release_year` or closest predecessor)
   - Fuel Type + Gas

## 4. Factor Resolution Rules

The calculation engine uses the following prioritized logic to select the most accurate factor for a given data entry.

### Resolution Inputs

- **Authority Preference**: Defined at the Tenant or Organizational Unit level (e.g., `ipcc`, `defra`).
- **Reporting Year**: The year the emission occurred (e.g., `2024`).
- **Location**: The country or region of the source (e.g., `Netherlands` -> `Europe`).
- **Source Details**: Fuel type, vehicle type, and technology (if applicable).

### Resolution Hierarchy

1.  **Library Selection**:
    - Find libraries matching the **Authority Preference**.
    - Select the library where `release_year <= Reporting Year`.
    - If multiple exist, pick the one with the highest `release_year` (the most recent version available at that time).
2.  **Factor Matching**:
    - Filter by `fuel_type`, `gas`, and `category`.
3.  **Refined Matching (Priority Order)**:
    - **Tier 1 (Specific)**: Exact match on both `region` AND `technology`.
    - **Tier 2 (Regional)**: Match on `region` only (if no technology is specified).
    - **Tier 3 (Global)**: Fallback to factors where `region` is null or "Global".

### Error Handling

- **Missing Factors**: If no factor is found for the preferred authority, the system will:
  1.  Check for a system-wide "Global Default" library (e.g., IPCC 2006).
  2.  If still missing, raise a `MISSING_EMISSION_FACTOR` validation error to the user, requesting manual entry or correction.

## 5. Fuel Properties (NCV & Density)

To support calculations across different activity units (L, m³, kg), the system stores bridge factors. These are also versioned within the library system to ensure scientific consistency.

### Table: `fuel_properties`

Stores the constants needed to convert between units. Linked to the same versioned libraries.

| Column          | Type    | Description                       |
| :-------------- | :------ | :-------------------------------- |
| `id`            | UUID    | Primary Key                       |
| `library_id`    | UUID    | FK to `emission_factor_libraries` |
| `fuel_type`     | Text    | Standardized fuel name            |
| `property_type` | Enum    | `density`, `ncv`                  |
| `value`         | Numeric | The numerical value               |
| `unit`          | Text    | e.g., `kg/m3`, `TJ/Gg`, `kg/L`    |
| `region`        | Text    | Regional override (nullable)      |

## 6. GWP Versioning (AR5 vs AR6)

### Table: `gwp_values`

Stores the GWP multipliers for various gases across different IPCC reports.

| Column    | Type    | Description                                       |
| :-------- | :------ | :------------------------------------------------ |
| `id`      | UUID    | Primary Key                                       |
| `version` | Enum    | `ar4`, `ar5`, `ar6`                               |
| `gas`     | Text    | The GHG name (e.g., `CH4`, `N2O`, `SF6`, `R134a`) |
| `value`   | Numeric | The GWP value (relative to CO2 = 1)               |

## 7. Calculation & Application Logic

### Step 1: The "Unit Bridge"

When calculating emissions for a volume-based input (e.g., 1000 m³ of Natural Gas), the engine follows this chain:

1.  **Mass Calculation**: $Activity\_Volume \times Density = Mass$
2.  **Energy Calculation**: $Mass \times NCV = Energy\_TJ$
3.  **Emission Calculation**: $Energy\_TJ \times EF = Emissions\_kg$

### Step 2: CO2e Conversion

The CO2e calculation is performed _after_ the individual gas masses are calculated:

1.  **Resolve GWP Version**: The engine checks the `effectiveGwpVersion` for the Organizational Unit.
2.  **Lookup Multipliers**: Fetches the values for `CH4` and `N2O` for that version.
3.  **Calculate CO2e**: $Total\_CO2e = Mass_{CO2} \times 1 + Mass_{CH4} \times GWP_{CH4} + Mass_{N2O} \times GWP_{N2O}$

## 8. Emission Source Management

To improve user efficiency for recurring data entry, the system distinguishes between "Emission Sources" (the asset) and "Emission Entries" (the data points).

### Table: `emission_sources`

Pre-defined assets owned or controlled by the tenant.

| Column              | Type | Description                                                                           |
| :------------------ | :--- | :------------------------------------------------------------------------------------ |
| `id`                | UUID | Primary Key                                                                           |
| `tenant_id`         | UUID | FK to Tenant                                                                          |
| `org_unit_id`       | UUID | FK to Organizational Unit                                                             |
| `category`          | Enum | `stationary`, `mobile`, `fugitive`, `process`                                         |
| `name`              | Text | **Mandatory.** Asset Name (e.g., "Main Office Boiler")                                |
| `meter_number`      | Text | **Optional.** Physical identifier (Meter ID for Stationary, License Plate for Mobile) |
| `vehicle_type`      | Text | **Optional.** For Mobile sources (e.g., "Passenger Car")                              |
| `technology`        | Text | **Optional.** For Mobile/Stationary (e.g., "Three-way catalyst")                      |
| `default_fuel_type` | Text | Pre-fills the entry form for the user                                                 |

## 9. Data Entry UI Design

### Mandatory Requirements

1.  **Evidence Document**: Every entry **MUST** have at least one uploaded file (PDF, Image, etc.) before submission.
2.  **Asset Identification**: Every entry must be linked to an Asset Name.

### Entry Workflow

- **Option 1: Saved Source**: User selects from a dropdown of `emission_sources`.
  - _Effect_: Name, License Plate/Meter, Vehicle Type, Technology, and Fuel Type are pre-filled and locked.
- **Option 2: Ad-hoc Entry**: User manually enters Name and identifiers.
  - _Feature_: User can toggle "Save as a new Emission Source" to reuse this data in the future.

### Dynamic Entry Fields by Category

#### **Stationary Combustion**

- **Asset Info**: Source Name + Meter Number (Optional).
- **Activity**: Fuel Type, Amount, Unit.
- **Timing**: Start Date, End Date.
- **Evidence**: Mandatory File Upload.

#### **Mobile Combustion**

- **Asset Info**: Vehicle Name + License Plate (Optional).
- **Method Selection**: Toggle between "Fuel-Based" (Preferred) and "Distance-Based".
- **Technical Context**: Vehicle Type (Passenger, HDV, etc.) + Technology (Modern, Catalytic, etc.).
- **Activity**: Fuel/Distance Amount + Unit.
- **Timing**: Start Date, End Date.
- **Evidence**: Mandatory File Upload.

## 10. Calculation Trace & Auditability

To satisfy international audit standards (ISO 14064, GHG Protocol), every calculation must be fully transparent and reproducible. The system stores a "Calculation Trace" for every entry.

### Table: `calculation_traces`

An immutable snapshot of the scientific constants and logic used at the moment of calculation.

| Column                   | Type    | Description                                            |
| :----------------------- | :------ | :----------------------------------------------------- |
| `id`                     | UUID    | Primary Key                                            |
| `library_id`             | UUID    | FK to the versioned library (e.g., IPCC 2006)          |
| `ef_id`                  | UUID    | FK to the specific emission factor row used            |
| `ncv_id`                 | UUID    | FK to the specific NCV factor row used (if applicable) |
| `density_id`             | UUID    | FK to the specific Density row used (if applicable)    |
| `gwp_version`            | Enum    | The GWP report used (ar4, ar5, ar6)                    |
| `unit_conv_factor`       | Numeric | e.g., 0.001 (converts input unit to basis unit)        |
| `intermediate_mass_kg`   | Numeric | Total mass calculated ($Input \times Density$)         |
| `intermediate_energy_tj` | Numeric | Total energy calculated ($Mass \times NCV$)            |
| `co2_raw_kg`             | Numeric | Raw CO2 mass calculated                                |
| `ch4_raw_kg`             | Numeric | Raw CH4 mass calculated                                |
| `n2o_raw_kg`             | Numeric | Raw N2O mass calculated                                |
| `co2_co2e_kg`            | Numeric | CO2e for CO2 (usually same as raw)                     |
| `ch4_co2e_kg`            | Numeric | CO2e for CH4 ($Raw \times GWP_{CH4}$)                  |
| `n2o_co2e_kg`            | Numeric | CO2e for N2O ($Raw \times GWP_{N2O}$)                  |
| `uncertainty_pct`        | Numeric | Calculated uncertainty percentage for this entry       |
| `data_quality_score`     | Integer | 1-5 DQI score (1=High, 5=Low)                          |
| `formula_text`           | Text    | Human-readable string of the calculation               |

### UI Representation

The fields above are designed to drive a "Transparency View" in the UI, allowing users to see:

1.  **The Pipeline**: Step-by-step conversion from Input -> Unit Conversion -> Mass -> Energy -> Emissions.
2.  **The Breakdown**: A table showing the contribution of each gas (CO2, CH4, N2O) to the total CO2e.
3.  **The Formula**: A code-block style summary for quick technical verification.

### Formula Text Example

For a stationary combustion entry of 1000 m³ Natural Gas:

> "Activity: 1000 m³ | Density: 0.802 kg/m³ | NCV: 48 TJ/Gg | EF_CO2: 56100 kg/TJ | GWP_CH4: 27.9 (AR6)"

## 11. Fugitive Emissions Logic (Refrigerants)

Fugitive emissions are calculated using the "Direct Refill" or "Material Balance" method.

### Calculation Logic

$$CO2e_{kg} = Amount_{Refill} \times GWP_{gas}$$

- **Input**: Gas type (e.g., R-134a, R-410a) and Amount in kg.
- **Data Source**: The `gwp_values` table must be populated with refrigerant-specific values (e.g., R-134a has a GWP of 1,530 in AR6).

## 12. Process Emissions Logic (Industrial Reactions)

Process emissions are split into two groups based on the nature of the industry and the available abatement technology.

### Group 1: Production-Based

Used for heavy industries (Cement, Glass, Steel).
$$CO2e_{kg} = Production\_Volume_{(tons)} \times EF_{(kg\_CO2e/ton)}$$

### Group 2: Gas-Based with Abatement

Used for high-tech manufacturing (Semiconductors, Chemicals) where abatement systems are present.
$$CO2e_{kg} = Amount_{gas} \times (1 - Abatement\_Efficiency) \times GWP_{gas}$$

### Data Model Support

To support Process Emissions, the `calculation_traces` table should also store:

- `abatement_efficiency`: The percentage of gas destroyed by the system (0.0 to 1.0).
- `process_type`: Indicator for Group 1 vs Group 2.

## 13. Mobile Combustion: Distance-Based Logic

When fuel consumption data (receipts/logs) is unavailable, the system supports distance-based calculations.

### Calculation Logic

$$E_{gas} = (Distance_{(km)} \times EF_{(g/km)}) / 1000$$

- **EF Selection**: The resolution engine filters the `emission_factors` table for rows where `unit = 'g/km'`.
- **Unit Conversion**: If the input is in `miles`, the system applies a constant conversion ($1.60934$) before resolving the factor.

### Technical Nuance

For distance-based mobile combustion, the **Vehicle Type** and **Technology** (e.g., Euro 6, US Tier 2) are mandatory because they dictate the `g/km` performance of the engine.

## 14. Biogenic CO2 Reporting (ISO 14064 Compliance)

In accordance with GHG Protocol and ISO 14064-1, direct CO2 emissions from the combustion of biomass/biofuels must be reported **separately** and not included in the Scope 1 total.

- **Resolution Rule**: If the `fuel_type` is identified as biomass (e.g., Wood, Biodiesel), the resolved CO2 factor should have `is_biogenic: true`.
- **Totaling**:
  - `Scope 1 Total = CO2 (Anthropogenic) + CH4 (CO2e) + N2O (CO2e)`
  - `Outside of Scopes = CO2 (Biogenic)`

## 15. Uncertainty & Data Quality

To meet "Accuracy" and "Transparency" principles, every entry stores data quality metadata.

1.  **Uncertainty Level**: Users can provide a specific uncertainty percentage or the system applies a default based on the source (e.g., Fuel Receipts = 2%, Estimates = 10%).
2.  **Data Quality Indicators (DQI)**: A 1-5 score based on:
    - **1 (High)**: Metered data with third-party verification.
    - **3 (Medium)**: Fuel receipts/bills.
    - **5 (Low)**: Rough estimates based on floor area or proxy.

## 16. Use Case Examples

### Scenario 1: Standard Stationary Combustion

- **User Input**: 500 m³ of Natural Gas for a Boiler.
- **Reporting Year**: 2024
- **Authority Preference**: IPCC
- **Resolution Process**:
  1.  **Library**: Selects "IPCC 2006 EFDB" (most recent available relative to 2024).
  2.  **Matching**: Filters for `fuel_type: "Natural Gas"` and `category: "1.A.1"`.
  3.  **Refinement**: No specific technology provided; selects factors where `region` is null/Global.
- **Result**: Returns EFs in `kg/TJ` for CO2, CH4, and N2O from the 2006 global dataset.

### Scenario 2: Regional Mobile Combustion (Europe)

- **User Input**: 100 L of Gasoline for a Passenger Car with a "Three-way catalyst".
- **Reporting Year**: 2024
- **Authority Preference**: IPCC
- **Location**: Netherlands (Auto-mapped to `region: "Europe"`)
- **Resolution Process**:
  1.  **Library**: Selects "IPCC 2006 EFDB".
  2.  **Matching**: Filters for `fuel_type: "Motor Gasoline"` and `category: "1.A.3.b"`.
  3.  **Refinement**: Searches for `region: "Europe"` AND `technology: "Three-way catalyst"`.
- **Result**: Returns high-precision EFs (e.g., 0.3 g/kg for CH4) specifically for European regulated vehicles.

### Scenario 3: Historical Data Backfilling

- **User Input**: Entering fuel receipts for the year 2022.
- **Reporting Year**: 2022
- **Authority Preference**: DEFRA
- **Resolution Process**:
  1.  **Library**: The system has "DEFRA 2022" and "DEFRA 2024" libraries.
  2.  **Selection**: Selects "DEFRA 2022" because it matches the reporting year exactly.
- **Result**: Ensures the 2022 carbon footprint uses the scientific factors legally valid at that time, even if newer factors exist in the system.
