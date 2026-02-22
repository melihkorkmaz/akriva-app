<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Alert, AlertDescription } from '$lib/components/ui/alert/index.js';
	import Upload from '@lucide/svelte/icons/upload';
	import FileIcon from '@lucide/svelte/icons/file';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Download from '@lucide/svelte/icons/download';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import type { EvidenceFileResponseDto } from '$lib/api/types.js';
	import { toast } from 'svelte-sonner';

	interface Props {
		taskId: string;
		existingEvidence: EvidenceFileResponseDto[];
		readonly?: boolean;
	}

	let { taskId, existingEvidence, readonly = false }: Props = $props();

	let evidenceFiles = $state<EvidenceFileResponseDto[]>([...existingEvidence]);
	let uploading = $state(false);
	let dragOver = $state(false);
	let fileInput: HTMLInputElement;

	async function uploadFile(file: File) {
		uploading = true;
		try {
			// Step 1: Request presigned upload URL
			const urlResponse = await fetch(`/tasks/${taskId}?/requestUploadUrl`, {
				method: 'POST',
				body: (() => {
					const fd = new FormData();
					fd.set('originalFilename', file.name);
					fd.set('contentType', file.type || 'application/octet-stream');
					return fd;
				})()
			});

			const urlResult = await urlResponse.json();
			// SvelteKit action response format: { type: 'success', status: 200, data: [...] }
			const actionData =
				urlResult?.data?.[1] ?? urlResult?.data?.[0] ?? urlResult;

			if (!actionData?.uploadUrl || !actionData?.evidenceId) {
				toast.error('Failed to get upload URL.');
				return;
			}

			// Step 2: Upload file directly to S3
			const s3Response = await fetch(actionData.uploadUrl, {
				method: 'PUT',
				body: file,
				headers: {
					'Content-Type': file.type || 'application/octet-stream'
				}
			});

			if (!s3Response.ok) {
				toast.error('Failed to upload file to storage.');
				return;
			}

			// Step 3: Confirm upload
			const confirmResponse = await fetch(`/tasks/${taskId}?/confirmUpload`, {
				method: 'POST',
				body: (() => {
					const fd = new FormData();
					fd.set('evidenceId', actionData.evidenceId);
					return fd;
				})()
			});

			const confirmResult = await confirmResponse.json();
			const confirmedData =
				confirmResult?.data?.[1] ?? confirmResult?.data?.[0] ?? confirmResult;

			if (confirmedData?.evidence) {
				evidenceFiles = [...evidenceFiles, confirmedData.evidence];
				toast.success(`${file.name} uploaded successfully.`);
			} else {
				// Add a basic record even if confirm response is unexpected
				evidenceFiles = [
					...evidenceFiles,
					{
						id: actionData.evidenceId,
						tenantId: '',
						entryId: null,
						s3Key: '',
						originalFilename: file.name,
						contentType: file.type || 'application/octet-stream',
						sizeBytes: file.size,
						status: 'uploaded' as const,
						uploadedAt: new Date().toISOString(),
						createdBy: '',
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString()
					}
				];
				toast.success(`${file.name} uploaded successfully.`);
			}
		} catch (err) {
			toast.error('An error occurred while uploading the file.');
			console.error('Upload error:', err);
		} finally {
			uploading = false;
		}
	}

	async function handleFiles(files: FileList | null) {
		if (!files || files.length === 0) return;
		for (const file of Array.from(files)) {
			await uploadFile(file);
		}
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		dragOver = false;
		if (readonly) return;
		handleFiles(event.dataTransfer?.files ?? null);
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		if (!readonly) dragOver = true;
	}

	function handleDragLeave() {
		dragOver = false;
	}

	async function handleDownload(evidence: EvidenceFileResponseDto) {
		try {
			const response = await fetch(`/tasks/${taskId}?/downloadEvidence`, {
				method: 'POST',
				body: (() => {
					const fd = new FormData();
					fd.set('evidenceId', evidence.id);
					return fd;
				})()
			});
			const result = await response.json();
			const data = result?.data?.[1] ?? result?.data?.[0] ?? result;
			if (data?.downloadUrl) {
				window.open(data.downloadUrl, '_blank');
			} else {
				toast.error('Failed to get download URL.');
			}
		} catch {
			toast.error('Failed to download file.');
		}
	}

	async function handleDelete(evidence: EvidenceFileResponseDto) {
		try {
			const response = await fetch(`/tasks/${taskId}?/deleteEvidence`, {
				method: 'POST',
				body: (() => {
					const fd = new FormData();
					fd.set('evidenceId', evidence.id);
					return fd;
				})()
			});
			const result = await response.json();
			const data = result?.data?.[1] ?? result?.data?.[0] ?? result;

			if (data?.error) {
				toast.error(data.error);
				return;
			}

			evidenceFiles = evidenceFiles.filter((f) => f.id !== evidence.id);
			toast.success('Evidence file deleted.');
		} catch {
			toast.error('Failed to delete evidence file.');
		}
	}

	function formatFileSize(bytes: number | null): string {
		if (bytes === null) return '\u2014';
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Evidence</Card.Title>
		<Card.Description>
			Upload supporting documents such as invoices, meter readings, or certificates.
		</Card.Description>
	</Card.Header>
	<Card.Content class="flex flex-col gap-4">
		{#if !readonly}
			<!-- Upload area -->
			<button
				type="button"
				class="flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 transition-colors {dragOver
					? 'border-primary bg-primary/5'
					: 'border-border hover:border-muted-foreground/50'}"
				ondrop={handleDrop}
				ondragover={handleDragOver}
				ondragleave={handleDragLeave}
				onclick={() => fileInput?.click()}
				disabled={uploading}
			>
				{#if uploading}
					<Loader2 class="size-8 animate-spin text-muted-foreground" />
					<p class="mt-2 text-sm text-muted-foreground">Uploading...</p>
				{:else}
					<Upload class="size-8 text-muted-foreground" />
					<p class="mt-2 text-sm text-muted-foreground">
						Drag & drop files here, or click to browse
					</p>
					<p class="mt-1 text-xs text-muted-foreground">
						PDF, images, spreadsheets, and documents supported
					</p>
				{/if}
			</button>
			<input
				bind:this={fileInput}
				type="file"
				multiple
				class="hidden"
				onchange={(e) => handleFiles(e.currentTarget.files)}
			/>
		{/if}

		<!-- File list -->
		{#if evidenceFiles.length > 0}
			<div class="rounded-md border">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b bg-muted/50">
							<th class="px-4 py-2 text-left font-medium">File</th>
							<th class="px-4 py-2 text-left font-medium">Type</th>
							<th class="px-4 py-2 text-left font-medium">Size</th>
							<th class="px-4 py-2 text-right font-medium">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each evidenceFiles as evidence (evidence.id)}
							<tr class="border-b last:border-b-0">
								<td class="px-4 py-2">
									<div class="flex items-center gap-2">
										<FileIcon class="size-4 text-muted-foreground" />
										<span class="max-w-[200px] truncate"
											>{evidence.originalFilename}</span
										>
									</div>
								</td>
								<td class="px-4 py-2 text-muted-foreground">
									{evidence.contentType.split('/').pop() ?? evidence.contentType}
								</td>
								<td class="px-4 py-2 text-muted-foreground">
									{formatFileSize(evidence.sizeBytes)}
								</td>
								<td class="px-4 py-2">
									<div class="flex items-center justify-end gap-1">
										<Button
											variant="ghost"
											size="sm"
											onclick={() => handleDownload(evidence)}
										>
											<Download class="size-3.5" />
										</Button>
										{#if !readonly}
											<Button
												variant="ghost"
												size="sm"
												class="text-destructive hover:text-destructive"
												onclick={() => handleDelete(evidence)}
											>
												<Trash2 class="size-3.5" />
											</Button>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else if !readonly}
			<Alert>
				<TriangleAlert class="size-4" />
				<AlertDescription>
					No evidence files uploaded yet. Evidence is recommended before submitting for
					review.
				</AlertDescription>
			</Alert>
		{/if}
	</Card.Content>
</Card.Root>
