import {RenderObject} from "./objectAbstract.js";

export class Line extends RenderObject {
    constructor(name, x, y, z, dir, colour) {
        super(name, x, y, z, 0, 0, 0);

        this.dir = dir; //[dx, dy, dz] dir vec
        this.colour = colour;
        this.length = 10000; //arbitrary length in each direction
    }

    getVertecies() {
        //calc two points in the dir vec from the origin, at +/- length
        const a = {
            x: this.x - this.length * this.dir[0], 
            y: this.y - this.length * this.dir[1], 
            z: this.z - this.length * this.dir[2]
        };

        const b = {
            x: this.x + this.length * this.dir[0], 
            y: this.y + this.length * this.dir[1], 
            z: this.z + this.length * this.dir[2]
        };

        return {a, b};
    }

    generate(normalsFlag) {
        this.vertices = [];
        this.indices = [];

        const {a, b} = this.getVertecies();

        this.vertices.push(a.x, a.y, a.z, ...this.colour);
        this.vertices.push(b.x, b.y, b.z, ...this.colour);

        this.indices.push(0, 1);
    }
}
