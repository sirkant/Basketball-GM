import { afterEach, assert, beforeAll, test } from "vitest";
import { contractNegotiation } from "../index.ts";
import { idb } from "../../db/index.ts";
import { g } from "../../util/index.ts";
import { beforeTests, givePlayerMinContract } from "./testHelpers.ts";

beforeAll(beforeTests);
afterEach(() => idb.cache.negotiations.clear());

test("no signing above the cap without an available exception", async () => {
	const pid = 1;
	await givePlayerMinContract(pid);
	const negotiation = await contractNegotiation.create(pid, false);
	if (typeof negotiation === "string") {
		throw new Error("Should never happen");
	}
	const error2 = await contractNegotiation.accept({
		negotiation,
		amount: g.get("salaryCap"),
		exp: g.get("season") + 1,
		dryRun: false,
	});
	assert.strictEqual(
		error2,
		__SPORT === "basketball"
			? "You do not have enough cap space or an available mid-level exception for this contract. Reduce the salary or duration, or free up payroll."
			: "You cannot go over the salary cap to sign free agents to contracts higher than the minimum salary.",
	);
});
