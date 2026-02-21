<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Alert, AlertDescription } from '$lib/components/ui/alert/index.js';
	import { toast } from 'svelte-sonner';
	import { TENANT_ROLE_LABELS } from '$lib/api/types.js';
	import { profileSchema } from '$lib/schemas/profile.js';

	let { data } = $props();

	const superform = superForm(data.form, {
		validators: zod4Client(profileSchema),
		onUpdated({ form }) {
			if (form.valid && form.message && !form.message.includes('wrong')) {
				toast.success(form.message);
			}
		}
	});
	const { form, enhance, message, submitting } = superform;

	const roleBadgeConfig: Record<string, string> = {
		super_admin: 'bg-violet-100 text-violet-700 border-violet-200',
		tenant_admin: 'bg-blue-100 text-blue-700 border-blue-200',
		data_approver: 'bg-emerald-100 text-emerald-700 border-emerald-200',
		data_entry: 'bg-amber-100 text-amber-700 border-amber-200',
		viewer: 'bg-gray-100 text-gray-700 border-gray-200'
	};
</script>

<svelte:head>
	<title>Profile | Settings | Akriva</title>
</svelte:head>

<div class="flex flex-col gap-6 p-7 px-8">
	<div class="flex flex-col gap-1">
		<h1 class="text-2xl font-semibold">Profile</h1>
		<p class="text-sm text-muted-foreground">Manage your personal information</p>
	</div>

	<Card.Root class="max-w-2xl">
		<Card.Header>
			<Card.Title>Personal Information</Card.Title>
		</Card.Header>
		<Card.Content>
			{#if $message && ($message.includes('wrong') || $message.includes('check'))}
				<Alert variant="destructive" class="mb-4">
					<AlertDescription>{$message}</AlertDescription>
				</Alert>
			{/if}

			<form method="POST" use:enhance class="flex flex-col gap-5">
				<div class="flex flex-col gap-2">
					<span class="text-sm font-medium">Email</span>
					<p class="text-sm text-muted-foreground">{data.currentUser.email}</p>
				</div>

				<Form.Field form={superform} name="displayName">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Display Name</Form.Label>
							<Input
								{...props}
								placeholder="Your display name"
								bind:value={$form.displayName}
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<div class="flex flex-col gap-2">
					<span class="text-sm font-medium">Role</span>
					<div>
						<Badge variant="outline" class={roleBadgeConfig[data.currentUser.role] ?? ''}>
							{TENANT_ROLE_LABELS[data.currentUser.role] ?? data.currentUser.role}
						</Badge>
					</div>
				</div>

				<div class="flex justify-end pt-2">
					<Form.Button disabled={$submitting}>
						{$submitting ? 'Saving...' : 'Save Changes'}
					</Form.Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
