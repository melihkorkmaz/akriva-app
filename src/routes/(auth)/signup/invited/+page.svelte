<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import * as Card from '$lib/components/ui/card';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import TextDivider from '$components/TextDivider.svelte';
	import { TENANT_ROLE_LABELS } from '$lib/api/types.js';
	import type { TenantRole } from '$lib/api/types.js';
	import { invitedSignupSchema } from '$lib/schemas/invited-signup.js';

	let { data } = $props();

	let showPassword = $state(false);

	const errorMessages: Record<string, string> = {
		not_found: 'This invite link is invalid.',
		expired: 'This invite has expired. Contact your administrator for a new invitation.',
		accepted: 'This invite has already been used. If you already have an account, sign in below.',
		revoked: 'This invite has been revoked. Contact your administrator for a new invitation.'
	};

	// superform is only used in the valid-invite branch of the template;
	// when data.form is null (error state) we never render the form elements.
	const superform = data.form
		? superForm(data.form, { validators: zod4Client(invitedSignupSchema) })
		: null;
	const form = superform?.form!;
	const enhance = superform?.enhance!;
	const message = superform?.message!;
	const submitting = superform?.submitting!;
</script>

<svelte:head>
	<title>Join Organization | Akriva</title>
</svelte:head>

<Card.Root class="w-full max-w-[490px]">
	<Card.Content class="pt-6">
		<div class="flex flex-col gap-5">
			{#if data.inviteError}
				<!-- Error State -->
				<Alert variant="destructive">
					<TriangleAlert class="size-4" />
					<AlertDescription>
						{errorMessages[data.inviteError] ?? 'This invite link is invalid.'}
					</AlertDescription>
				</Alert>

				<div class="flex flex-col gap-2 items-center">
					<h2 class="text-2xl font-semibold">Unable to Join</h2>
					<p class="text-base text-muted-foreground text-center">
						{errorMessages[data.inviteError] ?? 'This invite link is invalid.'}
					</p>
				</div>

				<div class="flex flex-col gap-3">
					<a
						href="/signin"
						class="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
					>
						Sign in instead
					</a>
					<a
						href="/signup"
						class="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
					>
						Back to signup
					</a>
				</div>
			{:else if superform}
				<!-- Valid Invite — Signup Form -->
				<Alert class="border-emerald-200 bg-emerald-50 text-emerald-800">
					<CircleCheck class="size-4 text-emerald-600" />
					<AlertDescription>
						You've been invited to join <strong>{data.tenantName}</strong>
						as
						<Badge variant="outline" class="ml-1">
							{TENANT_ROLE_LABELS[data.role as TenantRole] ?? data.role}
						</Badge>
					</AlertDescription>
				</Alert>

				<div class="flex flex-col gap-2 items-center">
					<h2 class="text-2xl font-semibold">Create Your Account</h2>
					<p class="text-base text-muted-foreground">
						Complete your profile to join {data.tenantName}
					</p>
				</div>

				{#if $message}
					<Alert variant="destructive">
						<AlertDescription>{$message}</AlertDescription>
					</Alert>
				{/if}

				<form method="POST" use:enhance class="flex flex-col gap-5">
					<!-- Hidden fields -->
					<input type="hidden" name="email" value={$form.email} />
					<input type="hidden" name="token" value={$form.token} />

					<div class="flex flex-col gap-2">
						<span class="text-sm font-medium">Email</span>
						<p class="text-sm text-muted-foreground">{$form.email}</p>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<Form.Field form={superform} name="firstName">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>First Name</Form.Label>
									<Input
										{...props}
										placeholder="Jane"
										bind:value={$form.firstName}
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<Form.Field form={superform} name="lastName">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Last Name</Form.Label>
									<Input
										{...props}
										placeholder="Doe"
										bind:value={$form.lastName}
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					</div>

					<Form.Field form={superform} name="password">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Password</Form.Label>
								<div class="relative">
									<Input
										{...props}
										type={showPassword ? 'text' : 'password'}
										placeholder="••••••••"
										bind:value={$form.password}
									/>
									<button
										type="button"
										class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
										onclick={() => (showPassword = !showPassword)}
										tabindex={-1}
									>
										{#if showPassword}
											<EyeOff class="size-4" />
										{:else}
											<Eye class="size-4" />
										{/if}
									</button>
								</div>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Button class="w-full" disabled={$submitting}>
						{$submitting ? 'Creating Account...' : 'Create Account'}
					</Form.Button>
				</form>

				<TextDivider />

				<div class="flex flex-wrap gap-2 justify-center">
					<span class="text-sm text-muted-foreground">Already have an account?</span>
					<a href="/signin" class="text-sm font-bold">Sign in</a>
				</div>
			{/if}
		</div>
	</Card.Content>
</Card.Root>
