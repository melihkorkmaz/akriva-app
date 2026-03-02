import type { PageServerLoad } from "./$types.js";
import { getMyTasks } from "$lib/api/tasks.js";

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.session!;

  try {
    const tasks = await getMyTasks(session.idToken);
    return { tasks: tasks ?? [] };
  } catch (err) {
    console.error("Failed to load tasks:", err);
    return { tasks: [] };
  }
};
