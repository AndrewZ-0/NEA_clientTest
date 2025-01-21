import {GraphicsEngine} from "./src/app.js";
import {Cube, Cylinder, Sphere, Torus} from "./src/objects/objects.js";



const response = await fetch('./test.json');
const data = await response.json();
//console.log(data["plane123"]);

/*
let objects = [];
for (let i in data) {
    if (data[i]["dtype"] === 0) {
        let obj = data[i]["object"];

        let colour = obj["colour"];

        const radius = obj["radius"];
        const fidelity = Math.max(Math.min(radius, 240), 25);

        objects.push(new Sphere(i, ...obj["position"], radius, fidelity, colour)); 
    }
}*/



//*
const objects = [
    new Sphere("Sam the Sphere", 0, 0, 0, 1, 25, [0, 0, 1]), 
    new Sphere("Sunny the Sphere", 3, 0, 0, 0.5, 30, [0, 0, 1]), 
    new Sphere("Sofia the Sphere", 2, 2, 2, 1, 30, [0, 0, 1]), 
    new Sphere("Sasha the Sphere", -2, 2, -2, 1.3, 20, [0, 1, 0]), 
    new Sphere("Simon the Sphere", -2, -2, -2, 0.8, 50, [1, 1, 0]), 
    //new Cylinder(1, 2, 0, 0.4, 0.8, 10, [1, 1, 1], "horizontalY"), 
    //new Cylinder(-2, -1, 0, 0.5, 2, 50, [0, 0.7, 1], "horizontalZ"), 
    new Cube("Charlie the Cube", 3, -2, 1, 0, 0, 0), 
    new Cube("Christopher the Cube", -2.5, 2, 1, 0, Math.PI / 6, Math.PI / 2), 
    new Torus("Tom the Torus", 0, -2, 0, 0, 0, 0, 1, 0.5, 32, 16, [1, 0.5, 0.3]), 
    new Torus("Timmy the torus", 1, -2, -4, 0, Math.PI / 4, Math.PI / 4, 1.5, 0.4, 32, 16, [0, 0.6, 0.9]), 
    new Torus("Timmy2 the torus", -3, -1, -4, 0, Math.PI, 0, 1, 0.4, 32, 16, [1, 0, 1]), 
];
//*/





/*
//the induction stove test
const range = 40;
const objects = [];
for (let i = -range; i <= range; i += 2) {
    for (let j = -range; j <= range; j += 2) {
        for (let k = -range; k <= range; k += 2) {
            objects.push(new Sphere("Sam the Destroyer", i, j, k, 1, 10, [0, 0, 1]));
        }
    }
}
*/


/*
const objects = [
    new Sphere("Sam the Sphere", 0, 2, 0, 1, 25, [0, 0, 1]), 
    new Cube("Charlie the Cube", 0, 0, 0, 0, 0, 0), 
    new Torus("Tom the Torus", 0, -2, 0, 0, 0, 0, 1, 0.5, 32, 16, [1, 0.5, 0.3]), 
];
/*/




const ge = new GraphicsEngine(objects);
ge.start();





