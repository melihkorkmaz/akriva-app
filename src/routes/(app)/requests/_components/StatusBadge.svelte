<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import type { DataCollectionRequestStatus } from '$lib/api/types.js';
	import { DATA_COLLECTION_REQUEST_STATUS_LABELS } from '$lib/api/types.js';

	interface Props {
		status: DataCollectionRequestStatus;
	}

	let { status }: Props = $props();

	const statusClasses: Record<DataCollectionRequestStatus, string> = {
		open: 'bg-blue-50 text-blue-700 border-blue-200',
		in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
		completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
		cancelled: 'bg-slate-100 text-slate-600 border-slate-300'
	};
</script>

<Badge variant="outline" class={statusClasses[status]}>
	{DATA_COLLECTION_REQUEST_STATUS_LABELS[status]}
</Badge>
