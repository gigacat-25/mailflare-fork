import assert from "node:assert/strict";
import test from "node:test";
import { cleanEmailSubject, cleanEmailPreview } from "../src/lib/email/parse.ts";
import { isMessageDetailRoute } from "../src/lib/messages/route-utils.ts";

test("cleanEmailSubject strips raw HTML tags and decodes entities properly", () => {
	// Real-world example from user's bug screenshot
	const rawSubject = '<h2 id="avWBGd-1567" data-legacy-thread-id="1a05659a2ffafc3d" data-thread-perm-id="thread-a:r-77797987352109418" tabindex="-1" class="hP">2nd Edition of Founders Meet | Google for Startups Hub Community</h2>';
	const cleaned = cleanEmailSubject(rawSubject);
	assert.equal(cleaned, "2nd Edition of Founders Meet | Google for Startups Hub Community");

	// Forwarded subject with HTML tags
	const fwdRaw = 'Fwd: <h2 class="title">Meeting Notes &amp; Updates</h2>';
	assert.equal(cleanEmailSubject(fwdRaw), "Fwd: Meeting Notes & Updates");

	// Encoded entities
	const entities = "Hello &quot;World&quot; &amp; &lt;Team&#39;s Progress&gt;";
	assert.equal(cleanEmailSubject(entities), "Hello \"World\" & <Team's Progress>");

	// Null or empty
	assert.equal(cleanEmailSubject(null), "(no subject)");
	assert.equal(cleanEmailSubject(""), "(no subject)");
	assert.equal(cleanEmailSubject("   "), "(no subject)");
	assert.equal(cleanEmailSubject("<span>   </span>"), "(no subject)");
});

test("cleanEmailPreview strips tags and decodes whitespace", () => {
	const snippet = "<p>Welcome to <strong>Mailflare</strong>!</p>   <span>Enjoy clean email.</span>";
	assert.equal(cleanEmailPreview(snippet), "Welcome to Mailflare ! Enjoy clean email.");
	assert.equal(cleanEmailPreview(""), "");
	assert.equal(cleanEmailPreview(null), "");
});

test("isMessageDetailRoute accurately identifies single email viewing routes", () => {
	// Standard folder message routes
	assert.equal(isMessageDetailRoute("/inbox/1a05659a2ffafc3d"), true);
	assert.equal(isMessageDetailRoute("/sent/msg-123"), true);
	assert.equal(isMessageDetailRoute("/starred/msg-456"), true);
	assert.equal(isMessageDetailRoute("/trash/msg-789"), true);
	assert.equal(isMessageDetailRoute("/spam/msg-000"), true);
	assert.equal(isMessageDetailRoute("/snoozed/msg-111"), true);
	assert.equal(isMessageDetailRoute("/archived/msg-222"), true);
	assert.equal(isMessageDetailRoute("/drafts/msg-333"), true);

	// Custom folder message routes
	assert.equal(isMessageDetailRoute("/folders/work-folder/msg-444"), true);

	// Root folder routes (should NOT be detected as message detail)
	assert.equal(isMessageDetailRoute("/inbox"), false);
	assert.equal(isMessageDetailRoute("/sent"), false);
	assert.equal(isMessageDetailRoute("/starred"), false);
	assert.equal(isMessageDetailRoute("/folders/work-folder"), false);
	assert.equal(isMessageDetailRoute("/settings/account"), false);
	assert.equal(isMessageDetailRoute("/compose"), false);
	assert.equal(isMessageDetailRoute("/"), false);
	assert.equal(isMessageDetailRoute(""), false);
	assert.equal(isMessageDetailRoute(null), false);
});
