<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { DatePicker } from '$lib/components/ui/date-picker/index.js';
	import { toast } from 'svelte-sonner';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import AlertCircle from '@lucide/svelte/icons/alert-circle';
	import MessageSquareWarning from '@lucide/svelte/icons/message-square-warning';
	import Upload from '@lucide/svelte/icons/upload';
	import FileText from '@lucide/svelte/icons/file-text';
	import X from '@lucide/svelte/icons/x';
	import Check from '@lucide/svelte/icons/check';
	import type { DataCollectionTaskResponseDto } from '$lib/api/types.js';
	import type { EmissionSourceResponseDto, FuelTypeDto } from '$lib/api/types.js';

	interface Props {
		open: boolean;
		task: DataCollectionTaskResponseDto | null;
	}

	let { open = $bindable(false), task }: Props = $props();

	// Source data
	let source = $state<EmissionSourceResponseDto | null>(null);
	let fuelTypes = $state<FuelTypeDto[]>([]);
	let activityUnits = $state<{ value: string; label: string }[]>([]);
	let loading = $state(false);
	let loadError = $state<string | null>(null);

	// Form state
	let activityAmount = $state('');
	let activityUnit = $state('');
	let startDate = $state('');
	let endDate = $state('');
	let notes = $state('');

	// Evidence upload state
	interface UploadedFile {
		evidenceId: string;
		name: string;
		uploading: boolean;
		error: string | null;
	}
	let uploadedFiles = $state<UploadedFile[]>([]);

	let submitting = $state(false);
	let submitError = $state<string | null>(null);

	// Derived
	let fuelTypeLabel = $derived(
		source?.fuelType
			? (fuelTypes.find((ft) => ft.id === source!.fuelType)?.label ?? source!.fuelType)
			: '—'
	);
	let hasUploadInProgress = $derived(uploadedFiles.some((f) => f.uploading));
	let successfulEvidenceIds = $derived(
		uploadedFiles
			.filter((f) => f.evidenceId && !f.uploading && !f.error)
			.map((f) => f.evidenceId)
	);

	// Fetch source data when sheet opens
	$effect(() => {
		if (open && task) {
			loadSourceData(task.emissionSourceId, task.orgUnitId);
		}
		if (!open) {
			resetForm();
		}
	});

	async function loadSourceData(sourceId: string, orgUnitId: string) {
		loading = true;
		loadError = null;

		try {
			const res = await fetch(
				`/tasks/source-data?sourceId=${encodeURIComponent(sourceId)}&orgUnitId=${encodeURIComponent(orgUnitId)}`
			);
			if (!res.ok) {
				const data = await res.json();
				loadError = data.error || 'Failed to load source data.';
				return;
			}

			const data = await res.json();
			source = data.source;
			fuelTypes = data.fuelTypes ?? [];
			// Normalize activity units — API may return strings or objects
			const rawUnits: unknown[] = data.activityUnits ?? [];
			activityUnits = rawUnits.map((u) =>
				typeof u === 'string'
					? { value: u, label: u }
					: { value: (u as Record<string, string>).id ?? (u as Record<string, string>).value ?? String(u), label: (u as Record<string, string>).label ?? (u as Record<string, string>).name ?? String(u) }
			);

			// Pre-fill unit from source if available
			const unitValues = activityUnits.map((u) => u.value);
			if (data.source?.unit && unitValues.includes(data.source.unit)) {
				activityUnit = data.source.unit;
			} else if (activityUnits.length === 1) {
				activityUnit = activityUnits[0].value;
			}
		} catch {
			loadError = 'Failed to load source data.';
		} finally {
			loading = false;
		}
	}

	function resetForm() {
		source = null;
		fuelTypes = [];
		activityUnits = [] as { value: string; label: string }[];
		loading = false;
		loadError = null;
		activityAmount = '';
		activityUnit = '';
		startDate = '';
		endDate = '';
		notes = '';
		uploadedFiles = [];
		submitting = false;
		submitError = null;
	}

	async function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const files = input.files;
		if (!files?.length) return;

		for (const file of files) {
			const idx = uploadedFiles.length;
			uploadedFiles.push({
				evidenceId: '',
				name: file.name,
				uploading: true,
				error: null
			});

			try {
				// 1. Get presigned upload URL
				const urlRes = await fetch('/tasks/evidence/upload-url', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ originalFilename: file.name, contentType: file.type })
				});
				if (!urlRes.ok) throw new Error('Failed to get upload URL');
				const { evidenceId, uploadUrl } = await urlRes.json();
				uploadedFiles[idx].evidenceId = evidenceId;

				// 2. Upload directly to S3 (no extra headers — presigned URL only signs 'host')
				const s3Res = await fetch(uploadUrl, {
					method: 'PUT',
					body: file
				});
				if (!s3Res.ok) throw new Error('Failed to upload file');

				// 3. Confirm upload with backend
				const confirmRes = await fetch(`/tasks/evidence/${evidenceId}/confirm`, {
					method: 'POST'
				});
				if (!confirmRes.ok) throw new Error('Failed to confirm upload');

				uploadedFiles[idx].uploading = false;
			} catch {
				uploadedFiles[idx].error = 'Upload failed';
				uploadedFiles[idx].uploading = false;
			}
		}

		input.value = '';
	}

	function removeFile(file: UploadedFile) {
		uploadedFiles = uploadedFiles.filter((f) => f !== file);
	}

	async function handleSubmit() {
		if (!task || !source) return;

		submitting = true;
		submitError = null;

		try {
			const payload = {
				orgUnitId: task.orgUnitId,
				sourceId: task.emissionSourceId,
				category: source.category,
				fuelType: source.fuelType,
				activityAmount: Number(activityAmount),
				activityUnit,
				reportingYear: startDate ? new Date(startDate).getFullYear() : new Date().getFullYear(),
				startDate,
				endDate,
				notes: notes || null,
				evidenceIds: successfulEvidenceIds
			};

			const res = await fetch(`/tasks/${task.id}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			const data = await res.json();

			if (!res.ok) {
				submitError = data.error || 'Failed to submit entry.';
				return;
			}

			open = false;
			toast.success('Emission entry submitted successfully.');
			await invalidateAll();
		} catch {
			submitError = 'Something went wrong. Please try again.';
		} finally {
			submitting = false;
		}
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="flex flex-col gap-0 p-0 sm:max-w-[576px] bg-card">
		<Sheet.Header class="border-b border-border px-6 py-5 gap-1 pr-12">
			<Sheet.Title class="text-lg font-semibold leading-tight">
				{task?.status === 'revision_needed' ? 'Revise Emission Data' : 'Submit Emission Data'}
			</Sheet.Title>
			<Sheet.Description class="text-sm text-muted-foreground">
				{#if task}
					{task.emissionSourceName || task.emissionSourceId} · {task.orgUnitName || task.orgUnitId}
				{/if}
			</Sheet.Description>
		</Sheet.Header>

		<div class="flex-1 overflow-y-auto">
			{#if task?.reviewNote}
				<div
					class="mx-6 mt-4 flex items-start gap-3 rounded-md border border-orange-200 bg-orange-50 px-4 py-3"
				>
					<MessageSquareWarning class="size-4 text-orange-700 mt-0.5 shrink-0" />
					<div class="flex flex-col gap-1">
						<p class="text-xs font-medium text-orange-700">Revision requested</p>
						<p class="text-xs text-orange-700 leading-relaxed">{task.reviewNote}</p>
					</div>
				</div>
			{/if}

			{#if loading}
				<div class="flex items-center justify-center h-48">
					<Loader2 class="size-6 text-muted-foreground animate-spin" />
				</div>
			{:else if loadError}
				<div class="flex flex-col items-center justify-center gap-3 h-48 px-6">
					<AlertCircle class="size-6 text-destructive" />
					<p class="text-sm text-destructive text-center">{loadError}</p>
					<Button
						variant="outline"
						size="sm"
						onclick={() => {
							if (task) loadSourceData(task.emissionSourceId, task.orgUnitId);
						}}
					>
						Retry
					</Button>
				</div>
			{:else if source}
				<div class="divide-y divide-border">
					<!-- Source Information (read-only) -->
					<div class="p-6">
						<Field.Set class="gap-4">
							<Field.Legend>Source Information</Field.Legend>
							<div class="grid grid-cols-3 gap-4">
								<div class="flex flex-col gap-1">
									<span class="text-xs font-medium text-muted-foreground">Emission Source</span>
									<span class="text-sm">{source.name}</span>
								</div>
								<div class="flex flex-col gap-1">
									<span class="text-xs font-medium text-muted-foreground">Fuel Type</span>
									<span class="text-sm">{fuelTypeLabel}</span>
								</div>
								<div class="flex flex-col gap-1">
									<span class="text-xs font-medium text-muted-foreground">Facility</span>
									<span class="text-sm">{task?.orgUnitName || task?.orgUnitId}</span>
								</div>
							</div>
						</Field.Set>
					</div>

					<!-- Activity Data -->
					<div class="p-6">
						<Field.Set class="gap-4">
							<Field.Legend>Activity Data</Field.Legend>
							<div class="grid grid-cols-2 gap-4">
								<div class="flex flex-col gap-2">
									<Label class="text-sm font-medium">Amount</Label>
									<Input
										type="number"
										bind:value={activityAmount}
										placeholder="0.00"
										class="tabular-nums"
										min="0"
										step="0.01"
									/>
								</div>
								<div class="flex flex-col gap-2">
									<Label class="text-sm font-medium">Unit</Label>
									{#if activityUnits.length > 0}
										<Select.Root
											type="single"
											value={activityUnit || undefined}
											onValueChange={(v) => (activityUnit = v ?? '')}
										>
											<Select.Trigger class="w-full">
												{activityUnits.find((u) => u.value === activityUnit)?.label ?? (activityUnit || 'Select unit')}
											</Select.Trigger>
											<Select.Content>
												{#each activityUnits as u}
													<Select.Item value={u.value} label={u.label} />
												{/each}
											</Select.Content>
										</Select.Root>
									{:else}
										<Input bind:value={activityUnit} placeholder="e.g. kg, m³" />
									{/if}
								</div>
							</div>
						</Field.Set>
					</div>

					<!-- Billing Period -->
					<div class="p-6">
						<Field.Set class="gap-4">
							<Field.Legend>Billing Period</Field.Legend>
							<div class="grid grid-cols-2 gap-4">
								<DatePicker label="Start Date" bind:value={startDate} placeholder="YYYY-MM-DD" />
								<DatePicker label="End Date" bind:value={endDate} placeholder="YYYY-MM-DD" />
							</div>
						</Field.Set>
					</div>

					<!-- Evidence -->
					<div class="p-6">
						<Field.Set class="gap-4">
							<Field.Legend>Evidence</Field.Legend>
							<Field.Description>Upload the bill or supporting document</Field.Description>

							{#each uploadedFiles as file}
								<div class="flex items-center gap-3 rounded-md border border-border px-3 py-2">
									<FileText class="size-4 text-muted-foreground shrink-0" />
									<span class="text-sm flex-1 truncate">{file.name}</span>
									{#if file.uploading}
										<Loader2 class="size-4 animate-spin text-muted-foreground shrink-0" />
									{:else if file.error}
										<span class="text-xs text-destructive shrink-0">{file.error}</span>
									{:else}
										<Check class="size-4 text-emerald-600 shrink-0" />
									{/if}
									<button
										type="button"
										class="text-muted-foreground hover:text-foreground transition-colors shrink-0"
										onclick={() => removeFile(file)}
										disabled={file.uploading}
									>
										<X class="size-4" />
									</button>
								</div>
							{/each}

							<label
								class="flex flex-col items-center gap-2 rounded-md border border-dashed border-border p-6 cursor-pointer hover:bg-muted/50 transition-colors"
							>
								<Upload class="size-5 text-muted-foreground" />
								<span class="text-sm text-muted-foreground">Click to upload</span>
								<span class="text-xs text-muted-foreground">PDF, PNG, JPG up to 10 MB</span>
								<input
									type="file"
									class="hidden"
									accept=".pdf,.png,.jpg,.jpeg"
									multiple
									onchange={handleFileSelect}
								/>
							</label>
						</Field.Set>
					</div>

					<!-- Notes -->
					<div class="p-6">
						<Field.Set class="gap-4">
							<Field.Legend>Notes</Field.Legend>
							<Textarea
								bind:value={notes}
								placeholder="Optional notes about this emission entry..."
								rows={3}
							/>
						</Field.Set>
					</div>
				</div>

				<!-- Submit error -->
				{#if submitError}
					<div
						class="mx-6 mb-4 flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3"
					>
						<AlertCircle class="size-4 text-destructive mt-0.5 shrink-0" />
						<p class="text-xs text-destructive leading-relaxed">{submitError}</p>
					</div>
				{/if}
			{/if}
		</div>

		<Sheet.Footer class="border-t border-border px-6 py-4">
			<div class="flex items-center justify-end gap-3">
				<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
				<Button
					onclick={handleSubmit}
					disabled={loading || !!loadError || submitting || hasUploadInProgress}
				>
					{#if submitting}
						<Loader2 class="size-4 mr-2 animate-spin" />
						Submitting...
					{:else}
						Submit Entry
					{/if}
				</Button>
			</div>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
