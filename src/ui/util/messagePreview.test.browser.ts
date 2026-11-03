import { expect, test } from "vitest";
import { messagePreview } from "./messagePreview.ts";

test("message previews retain words and entities without markup or executable content", () => {
	expect(
		messagePreview(
			"<p>Owner &amp; board</p><p>Keep <strong>our core</strong>.</p><script>bad()</script><img src=x onerror=bad()>",
		),
	).toBe("Owner & board Keep our core.");
	expect(messagePreview("<ul><li>Salary</li><li>Wins</li></ul>")).toBe(
		"Salary Wins",
	);
	expect(messagePreview("")).toBe("");
});
