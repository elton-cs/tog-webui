import { Bool, Field, Poseidon, PublicKey, SmartContract, State, Struct, UInt64, method, state } from "o1js";
import { Position2D } from "../components";
import { GameMap } from "../map/map";

export class FullMovement extends SmartContract {
    @state(PublicKey) gameMapContract = State<PublicKey>();
    @state(Position2D) mapBound = State<Position2D>();

    @state(Field) playerPosition = State<Field>();
    @state(UInt64) actionTick = State<UInt64>();

    init(){
        super.init();
        // initial player position to center of map
        this.playerPosition.set(Field(0));
        // set max rectangle map bound to (10,10)
        this.mapBound.set(Position2D.new(0,0));

        this.actionTick.set(UInt64.from(0));
    }

    isWithinMapBounds(position: Position2D) {
        let onChainMapBound = this.mapBound.getAndRequireEquals();
        position.x.assertGreaterThanOrEqual(Field(0));
        position.x.assertLessThanOrEqual(onChainMapBound.x);
        position.y.assertGreaterThanOrEqual(Field(0));
        position.y.assertLessThanOrEqual(onChainMapBound.y);
    }

    getGameMapZkApp(gameMapContract: PublicKey): GameMap {
        let gameMapZkApp = new GameMap(gameMapContract);
        return gameMapZkApp
    }

    syncFromMapTicks() {
        let gameMapContract = this.gameMapContract.getAndRequireEquals();
        let gameMapZkApp = this.getGameMapZkApp(gameMapContract);
        let mapTick = gameMapZkApp.mapTick.getAndRequireEquals();
        let actionTick = this.actionTick.getAndRequireEquals();
        mapTick.assertEquals(actionTick);
        this.actionTick.set(actionTick.add(1));
    }

    @method setGameInstanceMap(gameMapContract: PublicKey){
        this.mapBound.requireEquals({x: Field(0), y: Field(0)});

        // let gameMapZkApp = new GameMap(gameMapContract);
        let gameMapZkApp = this.getGameMapZkApp(gameMapContract);
        let mapBound = gameMapZkApp.mapBound.getAndRequireEquals();

        this.mapBound.set(mapBound);
        this.gameMapContract.set(gameMapContract);
    }

    @method setInitPosition(initPosition: Position2D, playerSalt: Field){
        this.syncFromMapTicks();

        let onchainPosition = this.playerPosition.getAndRequireEquals();
        onchainPosition.assertEquals(Field(0));

        this.isWithinMapBounds(initPosition);
        let positionHash = Poseidon.hash([initPosition.x, initPosition.y, playerSalt])
        this.playerPosition.set(positionHash)
    }

    @method moveCardinal(oldPosition: Position2D, directionVector: Position2D, playerSalt: Field){
        // assert function caller knows the salt, and therefore, has permission to update the position
        let oldPositionHash = this.playerPosition.getAndRequireEquals();
        oldPositionHash.assertEquals(Poseidon.hash([oldPosition.x, oldPosition.y, playerSalt]));
        // An addition and multiplication check to assert that `directionVector` contains a unit vector
        // multiplying the components of the directionVector should give 0
        let vectorMul = directionVector.x.mul(directionVector.y);
        vectorMul.assertEquals(Field(0));
        // adding the components of the directionVector should give either 1 or -1
        let vectorSum = directionVector.x.add(directionVector.y);
        let isCorrectDirection = vectorSum.equals(Field(1)).or(vectorSum.equals(Field(-1)));
        isCorrectDirection.assertEquals(Bool(true));

        // add the directionVector to the old position to get the updated position
        let xNew = oldPosition.x.add(directionVector.x);
        let yNew = oldPosition.y.add(directionVector.y);
        this.isWithinMapBounds({x: xNew, y: yNew});
        
        // update to the new position
        let positionHash = Poseidon.hash([xNew, yNew, playerSalt])
        this.playerPosition.set(positionHash)
    }

    @method moveDiagonal(oldPosition: Position2D, directionVector: Position2D, playerSalt: Field){
        // assert function caller knows the salt, and therefore, has permission to update the position
        let oldPositionHash = this.playerPosition.getAndRequireEquals();
        oldPositionHash.assertEquals(Poseidon.hash([oldPosition.x, oldPosition.y, playerSalt]));
        // An addition and multiplication check to assert that `directionVector` contains a diagonal vector
        // multiplying the components of the vector should give either 1 or -1
        let vectorMul = directionVector.x.mul(directionVector.y);
        let isGoodMultiply = vectorMul.equals(Field(1)).or(vectorMul.equals(Field(-1)));
        isGoodMultiply.assertEquals(Bool(true));
        // adding the components of the directionVector should give 2, 0, or -2
        let vectorSum = directionVector.x.add(directionVector.y);
        let isGoodAddition = vectorSum.equals(Field(2)).or(vectorSum.equals(Field(0))).or(vectorSum.equals(Field(-2)));
        isGoodAddition.assertEquals(Bool(true));

        // add the directionVector to the old position to get the updated position
        let xNew = oldPosition.x.add(directionVector.x);
        let yNew = oldPosition.y.add(directionVector.y);
        this.isWithinMapBounds({x: xNew, y: yNew});

        // update to the new position
        let positionHash = Poseidon.hash([xNew, yNew, playerSalt])
        this.playerPosition.set(positionHash)
    }
    
}