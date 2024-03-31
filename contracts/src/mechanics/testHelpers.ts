import { AccountUpdate, Mina, PrivateKey } from "o1js";
import { GameMap } from "./map/map";
import { Position } from "./player/position";

export async function mapDeploy(deployerKey: PrivateKey, zkAppKey: PrivateKey, zkApp: GameMap) {
    const pubkey = deployerKey.toPublicKey();
    const txn = await Mina.transaction(pubkey, () => {
        AccountUpdate.fundNewAccount(pubkey);
        zkApp.deploy();
    });
    await txn.prove();
    await txn.sign([deployerKey, zkAppKey]).send();
}

export async function positionDeploy(deployerKey: PrivateKey, zkAppKey: PrivateKey, zkApp: Position) {
    const pubkey = deployerKey.toPublicKey();
    const txn = await Mina.transaction(pubkey, () => {
        AccountUpdate.fundNewAccount(pubkey);
        zkApp.deploy();
    });
    await txn.prove();
    await txn.sign([deployerKey, zkAppKey]).send();
}