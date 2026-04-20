import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types.js";
import { getEmissionSource, listFuelTypes } from "$lib/api/emission-sources.js";
import { listActivityUnits } from "$lib/api/data-collection.js";
import { ApiError } from "$lib/api/client.js";

export const GET: RequestHandler = async ({ url, locals }) => {
  const session = locals.session!;
  const sourceId = url.searchParams.get("sourceId");
  const orgUnitId = url.searchParams.get("orgUnitId");

  if (!sourceId || !orgUnitId) {
    return json(
      { error: "sourceId and orgUnitId are required" },
      { status: 400 }
    );
  }

  try {
    const source = await getEmissionSource(session.idToken, sourceId);

    const [fuelTypes, activityUnits] = await Promise.all([
      listFuelTypes(session.idToken, source.category).catch(() => []),
      listActivityUnits(session.idToken, orgUnitId, source.category).catch(
        () => []
      ),
    ]);

    return json({ source, fuelTypes, activityUnits });
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 404) {
        return json({ error: "Emission source not found." }, { status: 404 });
      }
    }
    return json(
      { error: "Failed to load source data." },
      { status: 500 }
    );
  }
};
