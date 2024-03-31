import { Bool, Field, Poseidon, PublicKey, SmartContract, State, UInt64, method, state } from "o1js";
import { Position2D } from "../components";
import { FullMovement } from "../player/fullmovement";

export class GameMap extends SmartContract {
    @state(Position2D) mapBound = State<Position2D>();
    @state(UInt64) mapTick = State<UInt64>();
    @state(Field) gamePositionState = State<Field>();

    init() {
        super.init();
        this.mapBound.set(Position2D.new(0,0));
        this.mapTick.set(UInt64.from(0));
    }

    @method createMapArea(newMapBound: Position2D) {
        let noMapBound = this.mapBound.getAndRequireEquals();
        let isZeroMapOnchain = noMapBound.x.equals(Field(0)).and(noMapBound.y.equals(Field(0)));
        isZeroMapOnchain.assertEquals(Bool(true));

        let isValidMap = newMapBound.x.greaterThanOrEqual(Field(4)).and(newMapBound.y.greaterThanOrEqual(Field(4)));
        isValidMap.assertTrue();

        this.mapBound.set(newMapBound);
    }

    // will probably be a recursive zkProgram function 
    // to support multiple player action commits in parallel
    @method commitAllPlayerActions(playerMovementContract: PublicKey){
        let fullMoveZkApp = new FullMovement(playerMovementContract);
        let playerPositon = fullMoveZkApp.playerPosition.getAndRequireEquals();
        let actionTick = fullMoveZkApp.actionTick.getAndRequireEquals();

        let nextMapTick = this.mapTick.getAndRequireEquals().add(UInt64.from(1));
        nextMapTick.assertEquals(actionTick);
        this.mapTick.set(nextMapTick);

        let actionTickHash = Poseidon.hash(actionTick.toFields());
        let gamePositionState = Poseidon.hash([actionTickHash, playerPositon]);
        this.gamePositionState.set(gamePositionState);
    }

}