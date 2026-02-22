<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Alert, AlertDescription } from '$lib/components/ui/alert/index.js';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import { cn } from '$lib/utils.js';
	import { createWorkflowTemplateSchema } from '$lib/schemas/workflow-template.js';
	import WorkflowPreview from '../_components/WorkflowPreview.svelte';

	let { data } = $props();

	const superform = superForm(data.form, {
		validators: zod4Client(createWorkflowTemplateSchema)
	});
	const { form, enhance, message, submitting } = superform;

	let selectedTiers = $derived($form.approvalTiers || 1);
</script>

<svelte:head>
	<title>New Workflow Template | Settings | Akriva</title>
</svelte:head>

<div class="flex flex-col gap-6 p-7 px-8">
	<!-- Page Header -->
	<div class="flex items-center gap-3">
		<Button variant="ghost" size="icon" href="/settings/workflow-templates">
			<ArrowLeft class="size-4" />
		</Button>
		<div class="flex flex-col gap-1">
			<h1 class="text-2xl font-semibold">New Workflow Template</h1>
			<p class="text-sm text-muted-foreground">
				Define an approval workflow for data collection campaigns
			</p>
		</div>
	</div>

	<Card.Root class="max-w-2xl">
		<Card.Content class="pt-6">
			{#if $message && ($message.includes('wrong') || $message.includes('check') || $message.includes('already'))}
				<Alert variant="destructive" class="mb-4">
					<AlertDescription>{$message}</AlertDescription>
				</Alert>
			{/if}

			<form method="POST" use:enhance class="flex flex-col gap-6">
				<!-- Name -->
				<Form.Field form={superform} name="name">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Template Name</Form.Label>
							<Input
								{...props}
								placeholder="e.g. Standard 2-Tier Approval"
								bind:value={$form.name}
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<!-- Description -->
				<Form.Field form={superform} name="description">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Description <span class="text-muted-foreground font-normal">(optional)</span></Form.Label>
							<Textarea
								{...props}
								placeholder="Describe the purpose of this workflow..."
								rows={3}
								bind:value={$form.description}
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<!-- Approval Tiers -->
				<Form.Field form={superform} name="approvalTiers">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Approval Tiers</Form.Label>
							<input type="hidden" name={props.name} value={$form.approvalTiers} />
							<RadioGroup.Root
								value={String($form.approvalTiers)}
								onValueChange={(val) => {
									$form.approvalTiers = Number(val);
								}}
							>
								<div class="flex flex-col gap-3">
									<label
										class={cn(
											'flex items-start gap-3 rounded-md border p-4 cursor-pointer transition-colors',
											selectedTiers === 1 && 'border-primary bg-primary/10'
										)}
									>
										<RadioGroup.Item value="1" />
										<div class="flex flex-col gap-1">
											<span class="text-sm font-semibold">1 Tier</span>
											<span class="text-xs text-muted-foreground">
												Single approval step after data submission
											</span>
										</div>
									</label>

									<label
										class={cn(
											'flex items-start gap-3 rounded-md border p-4 cursor-pointer transition-colors',
											selectedTiers === 2 && 'border-primary bg-primary/10'
										)}
									>
										<RadioGroup.Item value="2" />
										<div class="flex flex-col gap-1">
											<span class="text-sm font-semibold">2 Tiers</span>
											<span class="text-xs text-muted-foreground">
												Review step followed by a final approval
											</span>
										</div>
									</label>

									<label
										class={cn(
											'flex items-start gap-3 rounded-md border p-4 cursor-pointer transition-colors',
											selectedTiers === 3 && 'border-primary bg-primary/10'
										)}
									>
										<RadioGroup.Item value="3" />
										<div class="flex flex-col gap-1">
											<span class="text-sm font-semibold">3 Tiers</span>
											<span class="text-xs text-muted-foreground">
												Two review steps followed by final admin approval
											</span>
										</div>
									</label>
								</div>
							</RadioGroup.Root>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<!-- Workflow Preview -->
				<WorkflowPreview tiers={selectedTiers} />

				<!-- Submit -->
				<div class="flex justify-end gap-3 pt-2">
					<Button variant="outline" href="/settings/workflow-templates">
						Cancel
					</Button>
					<Form.Button disabled={$submitting}>
						{$submitting ? 'Creating...' : 'Create Template'}
					</Form.Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
