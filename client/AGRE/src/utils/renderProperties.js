export const nodeResolution = 15;

export function calculateScaledFidelity(radius) {
    return Math.floor(Math.log2(radius + 2) * nodeResolution);
}