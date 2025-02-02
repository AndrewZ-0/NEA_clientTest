import {RenderObject} from "./objectAbstract.js";

export class Torus extends RenderObject {
    constructor(name, x, y, z, pitch, yaw, roll, R, r, radialSegments, tubularSegments, colour) {
        super(name, x, y, z, pitch, yaw, roll);
        
        this.R = R; //distance from the center of the tube to the center of the torus
        this.r = r; //radius of the tube
        this.radialSegments = radialSegments; //num of segs around the tube
        this.tubularSegments = tubularSegments; //num of segs along the tube
        this.colour = colour;
    }
    
    generate(normalsFlag) {
        this.vertices = [];
        this.indices = [];
        
        for (let i = 0; i <= this.radialSegments; i++) {
            const u = i / this.radialSegments * Math.PI * 2; //angle around the torus
            
            for (let j = 0; j <= this.tubularSegments; j++) {
                const v = j / this.tubularSegments * Math.PI * 2; //angle around the tube
                
                //parametric equation for torus
                const x = (this.R + this.r * Math.cos(v)) * Math.cos(u);
                const y = this.r * Math.sin(v);
                const z = (this.R + this.r * Math.cos(v)) * Math.sin(u);

                let nx = Math.cos(v) * Math.cos(u);
                let ny = Math.sin(v);
                let nz = Math.cos(v) * Math.sin(u);
                
                const length = (nx * nx + ny * ny + nz * nz) ** 0.5;
                if (length > 0) {
                    nx /= length;
                    ny /= length;
                    nz /= length;
                }

                if (normalsFlag) {
                    this.vertices.push(x, y, z, nx, ny, nz, ...this.colour);
                } 
                else {
                    this.vertices.push(x, y, z, ...this.colour);
                }
            }
        }

        for (let i = 0; i < this.radialSegments; i++) {
            for (let j = 0; j < this.tubularSegments; j++) {
                const first = (i * (this.tubularSegments + 1)) + j;
                const second = first + this.tubularSegments + 1;

                this.indices.push(first, second, first + 1);
                this.indices.push(second, second + 1, first + 1);
            }
        }
    }

    getBoundingSphereRadius() {
        return this.R + this.r;
    }
}
