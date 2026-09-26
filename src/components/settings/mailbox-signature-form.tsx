"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Camera, LoaderCircle, Trash2, Building2 } from "lucide-react";
import { useSelectedMailbox } from "@/components/mailbox-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { authFetch } from "@/lib/auth/client";
import { clearMailboxesCache } from "@/components/mailbox-provider-utils";
import { updateMailboxSignature } from "./utils";

const LOGO_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const MAX_LOGO_SIZE = 2 * 1024 * 1024;

function validateLogo(file: File): string | null {
	if (!LOGO_ACCEPT.split(",").includes(file.type)) {
		return "Use a JPEG, PNG, WebP, or GIF image";
	}
	if (file.size > MAX_LOGO_SIZE) {
		return "Image must be 2 MB or smaller";
	}
	return null;
}

export function MailboxSignatureForm() {
	const { selectedMailbox, setSelectedMailbox, mailboxes, isLoading } = useSelectedMailbox();
	const [signature, setSignature] = useState("");
	const [savedSignature, setSavedSignature] = useState("");
	const [status, setStatus] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	// Logo state
	const [hasLogo, setHasLogo] = useState(false);
	const [logoUrl, setLogoUrl] = useState<string | null>(null);
	const [logoStatus, setLogoStatus] = useState<string | null>(null);
	const [logoUploading, setLogoUploading] = useState(false);
	const [logoDeleting, setLogoDeleting] = useState(false);
	const logoInputRef = useRef<HTMLInputElement>(null);

	// Auto-select first mailbox if none is selected
	useEffect(() => {
		if (!selectedMailbox && mailboxes.length > 0) {
			setSelectedMailbox(mailboxes[0]);
		}
	}, [mailboxes, selectedMailbox, setSelectedMailbox]);

	useEffect(() => {
		const nextSignature = selectedMailbox?.signature ?? "";
		setSignature(nextSignature);
		setSavedSignature(nextSignature);
		setStatus(null);

		// Refresh logo state when mailbox changes
		const hasKey = !!selectedMailbox?.signatureLogoKey;
		setHasLogo(hasKey);
		setLogoUrl(hasKey && selectedMailbox?.id ? `/api/mailboxes/${selectedMailbox.id}/signature-logo?v=${Date.now()}` : null);
		setLogoStatus(null);
	}, [selectedMailbox?.id, selectedMailbox?.signature, selectedMailbox?.signatureLogoKey]);

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!selectedMailbox) return;
		setSaving(true);
		setStatus(null);
		try {
			const saved = await updateMailboxSignature(selectedMailbox.id, signature);
			setSignature(saved);
			setSavedSignature(saved);
			setSelectedMailbox({ ...selectedMailbox, signature: saved });
			setStatus("Saved");
		} catch (error) {
			setStatus(error instanceof Error ? error.message : "Failed to update signature");
		} finally {
			setSaving(false);
		}
	}

	async function onLogoPick(event: React.ChangeEvent<HTMLInputElement>) {
		const picked = event.target.files?.[0] ?? null;
		event.target.value = "";
		if (!picked || !selectedMailbox) return;

		const validationError = validateLogo(picked);
		if (validationError) {
			setLogoStatus(validationError);
			return;
		}

		setLogoUploading(true);
		setLogoStatus(null);
		try {
			const body = new FormData();
			body.append("file", picked, picked.name);
			const res = await authFetch(`/api/mailboxes/${selectedMailbox.id}/signature-logo`, {
				method: "POST",
				body,
			});
			if (!res.ok) {
				const data = (await res.json().catch(() => null)) as { error?: string } | null;
				throw new Error(data?.error ?? "Upload failed");
			}
			clearMailboxesCache();
			const nextUrl = `/api/mailboxes/${selectedMailbox.id}/signature-logo?v=${Date.now()}`;
			setLogoUrl(nextUrl);
			setHasLogo(true);
			setSelectedMailbox({ ...selectedMailbox, signatureLogoKey: `mailbox-signature-logos/${selectedMailbox.id}` });
			setLogoStatus("Logo saved");
		} catch (error) {
			setLogoStatus(error instanceof Error ? error.message : "Upload failed");
		} finally {
			setLogoUploading(false);
		}
	}

	async function onLogoDelete() {
		if (!selectedMailbox) return;
		setLogoDeleting(true);
		setLogoStatus(null);
		try {
			const res = await authFetch(`/api/mailboxes/${selectedMailbox.id}/signature-logo`, {
				method: "DELETE",
			});
			if (!res.ok) {
				const data = (await res.json().catch(() => null)) as { error?: string } | null;
				throw new Error(data?.error ?? "Delete failed");
			}
			clearMailboxesCache();
			setLogoUrl(null);
			setHasLogo(false);
			setSelectedMailbox({ ...selectedMailbox, signatureLogoKey: null });
			setLogoStatus("Logo removed");
		} catch (error) {
			setLogoStatus(error instanceof Error ? error.message : "Failed to remove logo");
		} finally {
			setLogoDeleting(false);
		}
	}

	if (isLoading) return <p className="text-sm text-neutral-500">Loading inbox…</p>;

	if (mailboxes.length === 0) {
		return (
			<p className="text-sm text-neutral-500">
				No mailboxes found. Please create or assign a mailbox first in{" "}
				<Link href="/settings/mailboxes" className="text-blue-600 underline hover:text-blue-700">
					Settings → Mailboxes
				</Link>
				.
			</p>
		);
	}

	if (!selectedMailbox) {
		return (
			<div className="space-y-3">
				<p className="text-sm text-neutral-500">Select an inbox to configure its signature:</p>
				<div className="flex flex-wrap gap-2">
					{mailboxes.map((mb) => (
						<Button
							key={mb.id}
							type="button"
							variant="outline"
							size="sm"
							onClick={() => setSelectedMailbox(mb)}
						>
							{mb.displayName ? `${mb.displayName} (${mb.localPart}@${mb.hostname})` : `${mb.localPart}@${mb.hostname}`}
						</Button>
					))}
				</div>
			</div>
		);
	}

	const address = `${selectedMailbox.localPart}@${selectedMailbox.hostname}`;
	const canManage = selectedMailbox.permission === "full_access";

	return (
		<form onSubmit={onSubmit} className="space-y-6">
			{mailboxes.length > 1 && (
				<div className="space-y-2">
					<Label htmlFor="signature-mailbox-select" className="text-sm text-neutral-600">
						Configuring signature for
					</Label>
					<div className="max-w-md">
						<Select
							id="signature-mailbox-select"
							value={selectedMailbox.id}
							onChange={(e) => {
								const found = mailboxes.find((m) => m.id === e.target.value);
								if (found) setSelectedMailbox(found);
							}}
						>
							{mailboxes.map((mb) => {
								const addr = `${mb.localPart}@${mb.hostname}`;
								return (
									<option key={mb.id} value={mb.id}>
										{mb.displayName ? `${mb.displayName} (${addr})` : addr}
									</option>
								);
							})}
						</Select>
					</div>
				</div>
			)}
			{/* Company logo section */}
			<div className="space-y-3">
				<Label>Company logo</Label>
				<div className="flex items-start gap-4">
					{/* Logo preview / upload button */}
					<Input
						ref={logoInputRef}
						type="file"
						accept={LOGO_ACCEPT}
						className="hidden"
						onChange={onLogoPick}
						disabled={!canManage || logoUploading || logoDeleting}
					/>
					<button
						type="button"
						onClick={() => logoInputRef.current?.click()}
						disabled={!canManage || logoUploading || logoDeleting}
						className="group relative flex h-16 w-40 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-400 shadow-sm outline-none ring-blue-500 transition hover:border-neutral-300 focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
						aria-label={hasLogo ? "Change company logo" : "Upload company logo"}
					>
						{hasLogo && logoUrl ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img
								src={logoUrl}
								alt="Company logo"
								className="h-full w-full object-contain p-2"
								onError={() => setHasLogo(false)}
							/>
						) : (
							<span className="flex flex-col items-center gap-1 text-[11px] font-medium">
								<Building2 className="h-5 w-5" />
								Upload logo
							</span>
						)}
						<span className="absolute inset-0 flex items-center justify-center bg-neutral-950/50 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 text-white">
							{logoUploading ? (
								<LoaderCircle className="h-5 w-5 animate-spin" />
							) : (
								<span className="flex flex-col items-center gap-1 text-[11px] font-medium">
									<Camera className="h-5 w-5" />
									{hasLogo ? "Change" : "Upload"}
								</span>
							)}
						</span>
					</button>

					{/* Delete button if logo exists */}
					{hasLogo && canManage && (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={onLogoDelete}
							disabled={logoDeleting || logoUploading}
							className="mt-1 gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
						>
							{logoDeleting ? (
								<LoaderCircle className="h-3.5 w-3.5 animate-spin" />
							) : (
								<Trash2 className="h-3.5 w-3.5" />
							)}
							Remove
						</Button>
					)}
				</div>
				<p className="text-xs leading-5 text-neutral-500">
					PNG, JPEG, WebP, or GIF · max 2 MB · displayed above your signature text.
				</p>
				{logoStatus && (
					<p className={`text-xs ${logoStatus.includes("failed") || logoStatus.includes("removed") ? "text-neutral-500" : logoStatus.startsWith("Logo") ? "text-green-600" : "text-red-600"}`}>
						{logoStatus}
					</p>
				)}
			</div>

			{/* Signature text section */}
			<div className="space-y-2">
				<Label htmlFor="mailboxSignature">Signature for {address}</Label>
				<Textarea
					id="mailboxSignature"
					value={signature}
					onChange={(event) => setSignature(event.target.value)}
					placeholder={"Your name\nRole or company\nContact details"}
					rows={6}
					disabled={!canManage || saving}
				/>
				<p className="text-xs leading-5 text-neutral-500">
					This signature is added when composing from the selected inbox.
				</p>
			</div>
			<div className="flex items-center gap-3">
				<Button type="submit" disabled={!canManage || saving || signature.trim() === savedSignature}>
					{saving ? "Saving..." : "Save signature"}
				</Button>
				{!canManage && <p className="text-sm text-neutral-500">Full access is required to edit this signature.</p>}
				{status && <p className="text-sm text-neutral-500">{status}</p>}
			</div>
		</form>
	);
}
