import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { domains, mailboxes, users } from "@/db/schema";
import { getMailboxAccessLevel } from "@/lib/mailboxes/access";
import { formatEmailAddress, getEmailAddress } from "@/lib/email/address";
import { getMailboxDomainAddresses } from "@/lib/mailboxes/domain-addresses";

export async function getAuthorizedSenderAddress(
	env: CloudflareEnv,
	input: {
		userId: string;
		from: string;
		mailboxId?: string | null;
	},
): Promise<{ fromAddr: string; mailboxId: string }> {
	const db = getDb(env);
	const requestedAddress = getEmailAddress(input.from).toLowerCase();
	const [fromLocalPart, fromHostname] = requestedAddress.split("@");

	let mailbox: {
		localPart: string;
		displayName: string | null;
		hostname: string;
		domainId: string;
		useAllDomains: boolean;
		id: string;
	} | null = null;

	if (input.mailboxId) {
		const [found] = await db
			.select({
				localPart: mailboxes.localPart,
				displayName: mailboxes.displayName,
				hostname: domains.hostname,
				domainId: mailboxes.domainId,
				useAllDomains: mailboxes.useAllDomains,
				id: mailboxes.id,
			})
			.from(mailboxes)
			.innerJoin(domains, eq(mailboxes.domainId, domains.id))
			.where(eq(mailboxes.id, input.mailboxId))
			.limit(1);

		if (found) {
			mailbox = found;
		} else {
			// Check if mailbox exists but domainId was orphaned after domain recreation
			const [rawMailbox] = await db
				.select()
				.from(mailboxes)
				.where(eq(mailboxes.id, input.mailboxId))
				.limit(1);

			if (rawMailbox && fromHostname) {
				const [activeDomain] = await db
					.select()
					.from(domains)
					.where(eq(domains.hostname, fromHostname))
					.limit(1);

				if (activeDomain) {
					await db
						.update(mailboxes)
						.set({ domainId: activeDomain.id })
						.where(eq(mailboxes.id, rawMailbox.id))
						.catch(() => {});

					mailbox = {
						localPart: rawMailbox.localPart,
						displayName: rawMailbox.displayName,
						hostname: activeDomain.hostname,
						domainId: activeDomain.id,
						useAllDomains: rawMailbox.useAllDomains,
						id: rawMailbox.id,
					};
				}
			}
		}
	}

	// Fallback: match by sender address and user
	if (!mailbox && fromLocalPart && fromHostname) {
		const [matched] = await db
			.select({
				localPart: mailboxes.localPart,
				displayName: mailboxes.displayName,
				hostname: domains.hostname,
				domainId: mailboxes.domainId,
				useAllDomains: mailboxes.useAllDomains,
				id: mailboxes.id,
			})
			.from(mailboxes)
			.innerJoin(domains, eq(mailboxes.domainId, domains.id))
			.where(
				and(
					eq(mailboxes.userId, input.userId),
					eq(mailboxes.localPart, fromLocalPart),
					eq(domains.hostname, fromHostname),
				),
			)
			.limit(1);

		if (matched) mailbox = matched;
	}

	// Fallback: match by any active mailbox on the domain for this user
	if (!mailbox && fromHostname) {
		const [anyUserMailbox] = await db
			.select({
				localPart: mailboxes.localPart,
				displayName: mailboxes.displayName,
				hostname: domains.hostname,
				domainId: mailboxes.domainId,
				useAllDomains: mailboxes.useAllDomains,
				id: mailboxes.id,
			})
			.from(mailboxes)
			.innerJoin(domains, eq(mailboxes.domainId, domains.id))
			.where(
				and(
					eq(mailboxes.userId, input.userId),
					eq(domains.hostname, fromHostname),
				),
			)
			.limit(1);

		if (anyUserMailbox) mailbox = anyUserMailbox;
	}

	if (!mailbox) throw new Error("Mailbox not found");
	const [actor] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
	if (!actor || actor.disabled) throw new Error("Sender account not found");

	const access = await getMailboxAccessLevel(db, actor, mailbox.id);
	if (!access?.canSendOnBehalf) {
		throw new Error("You do not have permission to send from this mailbox");
	}

	const permittedAddresses = await getMailboxDomainAddresses(db, mailbox);
	if (!permittedAddresses.includes(requestedAddress)) {
		throw new Error("Sender address does not match the selected mailbox");
	}
	const senderAddress = requestedAddress;

	if (access.canSendAs) {
		return {
			fromAddr: formatEmailAddress(senderAddress, mailbox.displayName),
			mailboxId: mailbox.id,
		};
	}

	const mailboxName = mailbox.displayName || senderAddress;
	return {
		fromAddr: formatEmailAddress(senderAddress, `${actor.name} on behalf of ${mailboxName}`),
		mailboxId: mailbox.id,
	};
}
