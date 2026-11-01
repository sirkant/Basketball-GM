import { getContractSalary } from "../../../common/contractSalary.ts";
import { idb } from "../../db/index.ts";

// Keep amount synchronized for game simulation and existing trade/UI paths.
// Released players have a separate guarantee, even after signing elsewhere.
export const updateAnnualSalaries = async (season: number) => {
	for (const p of await idb.cache.players.indexGetAll("playersByTid", [
		0,
		Infinity,
	])) {
		if (p.contract.schedule && p.contract.exp >= season) {
			const amount = getContractSalary(p.contract, season);
			if (amount !== p.contract.amount) {
				p.contract.amount = amount;
				await idb.cache.players.put(p);
			}
		}
	}
	for (const p of await idb.cache.releasedPlayers.getAll()) {
		if (p.contract.schedule && p.contract.exp >= season) {
			const amount = getContractSalary(p.contract, season);
			if (amount !== p.contract.amount) {
				p.contract.amount = amount;
				await idb.cache.releasedPlayers.put(p);
			}
		}
	}
};
