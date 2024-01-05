function check(data, min, max) {
    const isBetween = (value, i) => value >= min[i] && value <= max[i];
    return data.every(isBetween);
}

function checkMask(empty, pixel, condition) {
    if (!empty) return true;

    const is0 = (value) => value === 0;
    const isNot0 = (value) => value !== 0;

    if (condition) {
        if (pixel.every(is0)) return true
        else return false
    }
    
    else {
        if (pixel.every(is0)) return false
        else return true
    }
}

function checkAffect(data, pixelHsv, proportionS, proportionV) {
    const hue = data.affect.hue ? data.newColor[0] : pixelHsv[0];
    const saturation = data.affect.saturation ? Number(round(pixelHsv[1] * proportionS , 1)) : pixelHsv[1];
    const value = data.affect.value ? Number(round(pixelHsv[2] * proportionV , 1)) : pixelHsv[2];

    return [hue, saturation, value];
}

function hsvToRgb(hsv) {
    const hue = hsv[0] / 60;
    const saturation = hsv[1] / 100;
    const value = hsv[2] / 100;

    const chroma = value * saturation;

    const x = chroma * (1 - Math.abs(hue % 2 - 1));
    
    const rgbPrime = [];

    if (hue >= 0 && hue <= 1) rgbPrime.push(chroma, x, 0)
    else if (hue >= 1 && hue <= 2) rgbPrime.push(x, chroma, 0)
    else if (hue >= 2 && hue <= 3) rgbPrime.push(0, chroma, x)
    else if (hue >= 3 && hue <= 4) rgbPrime.push(0, x, chroma)
    else if (hue >= 4 && hue <= 5) rgbPrime.push(x, 0, chroma)
    else rgbPrime.push(chroma, 0, x)

    const m = value - chroma;

    const rgb = rgbPrime.map((each) => round((each + m) * 255, 0));
    return rgb.map((each) => Number(each));
}

function rgbToHsv(rgb) {
    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    const chroma = max - min;

    const hue = chroma === 0 ? 0 :
    max === r ? 60 * ((g - b) / chroma % 6) :
    max === g ? 60 * ((b - r) / chroma + 2) :
    60 * ((r - g) / chroma + 4);

    const saturation = max === 0 ? 0 : chroma / max;

    const value = max;
    const hsv = [hue < 0 ? round(hue + 360, 0) : round(hue, 0), round(saturation * 100, 1), round(value * 100, 1)];
    return hsv.map((each) => Number(each));
}

function round(value, decimals) {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals).toFixed(decimals);
}

onmessage = (data) => {
    for (let i = 0; i < data.data.canvasObj.data.length; i = i + 4) {
        const pixel = [];
        const maskPixel = [];

        for (let j = 0; j < 3; j++) {
            pixel.push(data.data.canvasObj.data[i + j]);
            maskPixel.push(data.data.canvasMaskObj.data[i + j]);
        }

        const pixelHsv = rgbToHsv(pixel);

        if (check(pixelHsv, data.data.start, data.data.end) && checkMask(data.data.empty, maskPixel, data.data.reverse)) {
            const newPixel = checkAffect(data.data, pixelHsv, data.data.proportionS, data.data.proportionV);
            const newRgb = hsvToRgb(newPixel);
            
            for (let k = 0; k < 3; k++) {
                data.data.canvasObj.data[i + k] = newRgb[k];
            }
        }
    }

    
    postMessage(data.data.canvasObj);
}