import { Field, Struct } from "o1js";

export class Position2D extends Struct({x: Field, y: Field}){
    static new(x: number, y: number){
        return {x: Field(x), y: Field(y)}
    }
}