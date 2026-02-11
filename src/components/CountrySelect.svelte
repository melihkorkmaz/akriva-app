<script lang="ts">
  import "@awesome.me/webawesome/dist/components/select/select.js";
  import "@awesome.me/webawesome/dist/components/option/option.js";
  import { waChange } from "$lib/actions/wa-events.js";

  interface Props {
    value?: string | null;
    label?: string;
    placeholder?: string;
    clearable?: boolean;
    name?: string;
    disabled?: boolean;
    "data-invalid"?: string;
    onchange?: (value: string | null) => void;
  }

  let {
    value = $bindable(null),
    label = "Country",
    placeholder = "Select country",
    clearable = true,
    name = "",
    disabled = false,
    "data-invalid": dataInvalid = undefined,
    onchange,
  }: Props = $props();

  const COUNTRIES = [
    { code: "AE", name: "United Arab Emirates" },
    { code: "AR", name: "Argentina" },
    { code: "AT", name: "Austria" },
    { code: "AU", name: "Australia" },
    { code: "BE", name: "Belgium" },
    { code: "BG", name: "Bulgaria" },
    { code: "BR", name: "Brazil" },
    { code: "CA", name: "Canada" },
    { code: "CH", name: "Switzerland" },
    { code: "CL", name: "Chile" },
    { code: "CN", name: "China" },
    { code: "CO", name: "Colombia" },
    { code: "CY", name: "Cyprus" },
    { code: "CZ", name: "Czech Republic" },
    { code: "DE", name: "Germany" },
    { code: "DK", name: "Denmark" },
    { code: "EE", name: "Estonia" },
    { code: "EG", name: "Egypt" },
    { code: "ES", name: "Spain" },
    { code: "FI", name: "Finland" },
    { code: "FR", name: "France" },
    { code: "GB", name: "United Kingdom" },
    { code: "GR", name: "Greece" },
    { code: "HK", name: "Hong Kong" },
    { code: "HR", name: "Croatia" },
    { code: "HU", name: "Hungary" },
    { code: "ID", name: "Indonesia" },
    { code: "IE", name: "Ireland" },
    { code: "IL", name: "Israel" },
    { code: "IN", name: "India" },
    { code: "IT", name: "Italy" },
    { code: "JP", name: "Japan" },
    { code: "KE", name: "Kenya" },
    { code: "KR", name: "South Korea" },
    { code: "LT", name: "Lithuania" },
    { code: "LU", name: "Luxembourg" },
    { code: "LV", name: "Latvia" },
    { code: "MT", name: "Malta" },
    { code: "MX", name: "Mexico" },
    { code: "MY", name: "Malaysia" },
    { code: "NG", name: "Nigeria" },
    { code: "NL", name: "Netherlands" },
    { code: "NO", name: "Norway" },
    { code: "NZ", name: "New Zealand" },
    { code: "PH", name: "Philippines" },
    { code: "PL", name: "Poland" },
    { code: "PT", name: "Portugal" },
    { code: "RO", name: "Romania" },
    { code: "SA", name: "Saudi Arabia" },
    { code: "SE", name: "Sweden" },
    { code: "SG", name: "Singapore" },
    { code: "SI", name: "Slovenia" },
    { code: "SK", name: "Slovakia" },
    { code: "TH", name: "Thailand" },
    { code: "TR", name: "Turkey" },
    { code: "TW", name: "Taiwan" },
    { code: "US", name: "United States" },
    { code: "VN", name: "Vietnam" },
    { code: "ZA", name: "South Africa" },
  ] as const;
</script>

{#if name}
  <input type="hidden" {name} value={value ?? ""} />
{/if}
<wa-select
  {label}
  {placeholder}
  {clearable}
  {disabled}
  value={value ?? ""}
  data-invalid={dataInvalid}
  use:waChange={(val) => {
    value = val || null;
    onchange?.(value);
  }}
>
  {#each COUNTRIES as country}
    <wa-option value={country.code}>{country.name}</wa-option>
  {/each}
</wa-select>
