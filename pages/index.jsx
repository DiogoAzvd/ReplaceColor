import { useContext, createContext, memo, useState, useRef } from "react";

const Data = createContext(null);

function round(value, decimals) {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals).toFixed(decimals);
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

export default function Main() {
    const canvasMain = useRef(null);
    const canvasMask = useRef(null);
    const canvasErase = useRef(null);

    const [targetColor, setTargetColor] = useState({
        pen: false,
        base: true,
        start: false,
        end: false,
        wheel: {
            start: [0, 0, 0],
            base: [0, 0, 0],
            end: [0, 0, 0],
        },
    });

    const [newColor, setNewColor] = useState(0, 0, 0);

    const [mask, setMask] = useState({
        draw: false,
        erase: false,
        width: 20,
        reverseEffect: false,
    });

    const [drawing, setDrawing] = useState(false);

    const [resetImage, setResetImage] = useState(null);

    const [affect, setAffect] = useState({
        hue: true,
        saturation: false,
        value: false,
    });

    const [loading, setLoading] = useState(false);

    return (
        <Data.Provider
            value=
                {{canvasMask, canvasMain, canvasErase, targetColor, setTargetColor, mask, setMask,
                newColor, setNewColor, drawing, setDrawing, resetImage, setResetImage, affect, setAffect, setLoading}}>

            <div id="main">
                <Toolbar />
                <ImageViewer />
                {loading && <Loading />}
            </div>
        </Data.Provider>
    );
}

const Toolbar = memo(function Toolbar() {
    return (
        <div id="toolbar">       
            <TargetColor />
            <Mask />
            <Settings />
        </div>
    );
});

/* TARGET COLOR COMPONENTS */
const TargetColor = memo(function TargetColor() {
    const data = useContext(Data);

    return (
        <div id="targetColor" className="flex">
            <span className="mediumText">Target Color</span>

            <div className="flex" style={{gap: "1vw"}}> 
                <ColorWheel keyword={"start"}/>
                <ColorWheel keyword={"base"}/>
                <ColorWheel keyword={"end"}/>

                <div className="colorsWrapper flex">
                    <Colors keyword={"Start"} />
                    <Colors keyword={"Base"} />
                    <Colors keyword={"End"} />
                </div>
            </div>

            <div className="hsvWrapper flex">
                {data.targetColor.start && <HSV keyword={"start"}/>}
                {data.targetColor.base && <HSV keyword={"base"}/>}
                {data.targetColor.end && <HSV keyword={"end"}/>}
            </div>              
        </div>
    );
});

function ColorWheel({keyword}) {
    const data = useContext(Data);
    const rgb = hsvToRgb(data.targetColor.wheel[keyword]);

    function pen() {
        const newData = {...data.targetColor};
        newData.pen = !newData.pen;
        data.setTargetColor(newData);
    }

    return (
        <>
            {data.targetColor[keyword] && <div className="colorWheel">
                <div className="Wheel flex" style={{backgroundColor: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`}}>
                    <div className="smallWheel"
                        style={{backgroundImage: data.targetColor.pen ? "url('/images/colorPicker.png')" :
                            "url('/images/colorPickerDisabled.png')"}}
                        onClick={() => pen()}>
                    </div>
                </div>
            </div>}
        </>
    );
}

function Colors({keyword}) {
    const data = useContext(Data);
    const rgb = hsvToRgb(data.targetColor.wheel[keyword.toLowerCase()]);

    function colors() {
        const newData = {...data.targetColor};

        Object.keys(newData).map((each) => {
            if (each !== "pen" && each !== "wheel") {
                newData[each] = false;
            }
        });

        newData[keyword.toLowerCase()] = true;
        data.setTargetColor(newData);
    }

    return (
        <div className="colors flex" onClick={() => colors()}>
            <div className="colorsCircle" style={{backgroundColor: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`}}></div>

            <span className="smallText"
                style={{color: data.targetColor[keyword.toLowerCase()] ? "#d1ccb9" : "#505050"}}
            >{keyword}</span>
        </div>
    );
}

function HSV({keyword}) {  
    return (
        <>
            <RangeSlider title={"H"} keyword={keyword} index={0} rangeValue={360}/>
            <RangeSlider title={"S"} keyword={keyword} index={1} rangeValue={100}/>
            <RangeSlider title={"V"} keyword={keyword} index={2} rangeValue={100}/>
        </>
    );
}

function RangeSlider({title, keyword , index, rangeValue}) {
    const data = useContext(Data);

    function setText(e, maxValue) {
        const inputValue = Number(e.currentTarget.value);
        const newValue = data.targetColor.wheel[keyword];
        newValue[index] = inputValue < 0 || inputValue == NaN ? 0 :
        inputValue > maxValue ? maxValue :
        inputValue

        const newData = {
            ...data.targetColor,
            wheel : {
                ...data.targetColor.wheel,
                [keyword] : newValue
            }           
        }

        data.setTargetColor(newData);
    }

    const [pointerDown, setPointerDown] = useState(false);

    const [minValue, setMinValue] = useState(0);
    const [maxValue, setMaxValue] = useState(0)

    const rangeSlide = useRef(null);
    const thumb = useRef(null);

    function setRange(newValue) {
        const wheelValue = data.targetColor.wheel[keyword];
        
        wheelValue[index] = newValue < 0 ? 0 :
        newValue > 100 ? rangeValue : Math.round(newValue * rangeValue / 100);

        const newData = {
            ...data.targetColor,
            wheel: {
                ...data.targetColor.wheel,
                [keyword]: wheelValue
            }
        }

        data.setTargetColor(newData);
    }

    function moveThumb(e, condition) {
        if (pointerDown || condition) {
            const newValue = (e.screenX - minValue) / (maxValue - minValue) * 100;
            
            if (e.screenX >= minValue && e.screenX <= maxValue) {
                setRange(newValue);
            }
            
            if (e.screenX < minValue) {
                setRange(0);
            }

            if (e.screenX > maxValue) {
                setRange(rangeValue);
            }

        }
    }

    function pointerEvents(e) {
        e.currentTarget.setPointerCapture(e.pointerId);
        setPointerDown(true);

        const width = rangeSlide.current.scrollWidth
        const leftPosition = Math.round(rangeSlide.current.getBoundingClientRect().x);

        setMinValue(leftPosition);
        setMaxValue(leftPosition + width);
    }

    return (
        <div className="rangeSliderWrapper flex">
            <span className="mediumText">{title}</span>

            <div className="rangeSlider flex" ref={rangeSlide}
                onClick={(e) => moveThumb(e, true)}
                onPointerDown={(e) => pointerEvents(e)}
                onPointerMove={(e) => moveThumb(e, false)}
                onPointerUp={() => setPointerDown(false)}
                style={{backgroundImage: title === "H" ?
                "linear-gradient(to right, hsl(0, 100%, 50%), hsl(90, 100%, 50%), hsl(180, 100%, 50%), hsl(270, 100%, 50%), hsl(360, 100%, 50%))" :
                ""}}
            >
                <div className="thumb" ref={thumb}
                    style={{
                        backgroundColor: title === "H" ? `hsl(${data.targetColor.wheel[keyword][index]}, 100%, 50%)` : "",
                        border: title === "H" ? ".2vw #ccc solid" : "",
                        transform: `translateX(${data.targetColor.wheel[keyword][index] / rangeValue * 100 * .12 - .75}vw)`
                    }}
                ></div>
            </div>

            <input type="text" value={data.targetColor.wheel[keyword][index]}
                className="rangeSliderTextInput"
                onChange={(e) => setText(e, rangeValue)}
            ></input>
        </div>
    );
}
/* END - TARGET COLOR COMPONENTS */

const Mask = memo(function Mask() {
    const data = useContext(Data);

    function updateStatus(keyword) {
        if (keyword === "reverseEffect") {
            const newData = {
                ...data.mask,
                [keyword] : !data.mask[keyword],
            }

            data.setMask(newData);
        }

        else {
            const keyOff = keyword == "draw" ? "erase" : "draw";

            const newData = {
                ...data.mask,
                [keyword] : !data.mask[keyword],
                [keyOff] : false
            }

            data.setMask(newData);
        }
    }

    function setMaskWidth(e) {
        const inputValue = Number(e.currentTarget.value);

        if (inputValue !== NaN && inputValue >= 0) {
            const newData = {
                ...data.mask,
                width: inputValue
            }

            data.setMask(newData);
        }
    }

    function loadImage(element) {
        const file = element.currentTarget.files[0];    
        const img = new Image();    
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target.result;
        };

        reader.readAsDataURL(file);

        img.onload = () => {
            [data.canvasMask.current.width, data.canvasMask.current.height ] = [img.width, img.height];
            const contextMask = data.canvasMask.current.getContext("2d");
            contextMask.drawImage(img, 0, 0);
        }
    }

    return (
        <div className="mask flex">
            <span className="mediumText underline">Mask</span>

            <div className="maskOptions1 flex">
                <span className="smallText"
                    style={{color: data.mask.draw ? "" : "#505050"}}
                    onClick={() => updateStatus("draw")}
                >Draw</span>

                <span className="smallText"
                    style={{color: data.mask.erase ? "" : "#505050"}}
                    onClick={() => updateStatus("erase")}
                >Erase</span>

                <label className="flex">
                    <span className="smallText">Width</span>
                    <input className="maskWidthInput"
                        type="text" value={data.mask.width}
                        onChange={(e) => setMaskWidth(e)}
                    ></input>
                </label>
                
            </div>

            <div className="maskOptions2 flex">
                <span className="smallText"
                    style={{color: data.mask.reverseEffect ? "" : "#505050"}}
                    onClick={() => updateStatus("reverseEffect")}
                >Reverse Effect</span>

                <label>
                    <div className="maskImport flex">
                        <span className="smallText">Import</span>
                    </div>                    
                    <input type="file" style={{display: "none"}} onChange={(e) => loadImage(e)}></input>
                </label>
            </div>
        </div>
    );
});

const Settings = memo(function Settings() { 
    const data = useContext(Data);

    function colorSwitch() {
        const context = data.canvasMain.current.getContext("2d");
        const canvasObj = context.getImageData(0, 0, data.canvasMain.current.width, data.canvasMain.current.height);

        const contextMask = data.canvasMask.current.getContext("2d");
        const canvasMaskObj = contextMask.getImageData(0, 0, data.canvasMain.current.width, data.canvasMain.current.height);

        const proportionS = data.newColor[1] / data.targetColor.wheel.base[1];
        const proportionV = data.newColor[2] / data.targetColor.wheel.base[2];

        const empty = canvasMaskObj.data.find((each) => each !== 0);

        const workerData = {
            canvasObj,
            canvasMaskObj,
            empty,
            proportionS,
            proportionV,
            start: data.targetColor.wheel.start,
            end: data.targetColor.wheel.end,
            reverse: data.mask.reverseEffect,
            affect: data.affect,
            newColor: data.newColor
        }

        const myWorker = new Worker(new URL("../public/worker.js", import.meta.url),
        {type: "module"});

        myWorker.postMessage(workerData);
        data.setLoading(true);

        const tmp = data;

        myWorker.onmessage = (data) => {
            context.putImageData(data.data, 0, 0);
            tmp.setLoading(false);
        }              
    }

    function resetImage() {
        if (data.resetImage !== null) {
            const context = data.canvasMain.current.getContext("2d");
            context.putImageData(data.resetImage, 0, 0);
        }
    }

    function updateAffect(keyword) {
        const newData = {
            ...data.affect,
            [keyword] : !data.affect[keyword]
        };

        data.setAffect(newData);
    }

    return (
        <div className="settings flex">
            <span className="mediumText underline">Settings</span>

            <div className="flex" style={{gap: "1.5vw"}}>
                <span className="smallText">Affect :</span>

                <span className="smallText"
                    style={{color: data.affect.hue ? "" : "#505050"}}
                    onClick={() => updateAffect("hue")}
                >Hue</span>

                <span className="smallText"
                    style={{color: data.affect.saturation ? "" : "#505050"}}
                    onClick={() => updateAffect("saturation")}
                >Saturation</span>

                <span className="smallText"
                    style={{color: data.affect.value ? "" : "#505050"}}
                    onClick={() => updateAffect("value")}
                >Value</span>
            </div>

            <div className="flex" style={{gap: "1.5vw"}}>
                <NewColor />                
                <span className="smallText" onClick={() => resetImage()}>Reset Image</span>
            </div>
            
            <div className="colorSwitch flex" onClick={() => colorSwitch()}>
                <span className="smallText">Color Switch</span>
            </div>            
        </div>
    );
});

function NewColor() {
    const data = useContext(Data);
    const rgb = hsvToRgb(data.newColor);

    function updateColor(e) {
        const rgbArray = [];

        for (let i = 1; i < 6; i = i + 2) {
            rgbArray.push(Number("0x" + e.currentTarget.value.slice(i, i + 2)));
        }

        const hsv = rgbToHsv(rgbArray);

        data.setNewColor(hsv);
    }

    return (
        <label className="newColor flex">
            <span className="smallText">New Color</span>
            <div className="newColorCircle" style={{backgroundColor: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`}}></div>
            <input type="color" onChange={(e) => updateColor(e)}></input>
        </label>
    );
}

const ImageViewer = memo (function ImageViewer() {
    const data = useContext(Data);
    const imageViewerLabel = useRef(null);
    const canvasBox = useRef(null);

    const [pointerDown, setPointerDown] = useState(false);

    function loadImage(element) {
        imageViewerLabel.current.style.display = "none";

        const file = element.currentTarget.files[0];    
        const img = new Image();    
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target.result;
        };

        reader.readAsDataURL(file);

        img.onload = () => {
            [data.canvasMain.current.width, data.canvasMain.current.height ] = [img.width, img.height];           
            const context = data.canvasMain.current.getContext("2d");
            context.drawImage(img, 0, 0); 

            [data.canvasMask.current.width, data.canvasMask.current.height ] = [img.width, img.height];
            const contextMask = data.canvasMask.current.getContext("2d");
            contextMask.putImageData(new ImageData(img.width, img.height), img.width, img.height);

            [data.canvasErase.current.width, data.canvasErase.current.height ] = [img.width, img.height];
            const contextErase = data.canvasErase.current.getContext("2d");
            contextErase.putImageData(new ImageData(img.width, img.height), img.width, img.height);

            data.setResetImage(context.getImageData(0, 0, data.canvasMain.current.width, data.canvasMain.current.height));
            canvasBox.current.style.display = "block"; 
        }
    }

    function canvasPen(e) {
        if (data.targetColor.pen) {            
            const tmpContext = data.canvasMain.current.getContext("2d");
            const imgData = tmpContext.getImageData(e.nativeEvent.layerX, e.nativeEvent.layerY, 1, 1);

            const keyword = Object.keys(data.targetColor).find((key) => {if (data.targetColor[key] && key !== "pen") return key});

            const newData = keyword === "base" ? {
                ...data.targetColor,
                pen : false,
                wheel : {
                    start: rgbToHsv(imgData.data.slice(0, 3)),
                    base: rgbToHsv(imgData.data.slice(0, 3)),
                    end: rgbToHsv(imgData.data.slice(0, 3))
                }                
            } :

            {
                ...data.targetColor,
                pen : false,
                wheel : {
                    ...data.targetColor.wheel,
                    [keyword]: rgbToHsv(imgData.data.slice(0, 3))
                }      
            }

            data.setTargetColor(newData);
        }
    }

    function draw(e, start, stop) {
        const context = data.canvasMask.current.getContext("2d");

        if (start) {
            setPointerDown(true);
            context.beginPath();
            return;
        }
        

        if (stop) {
            context.closePath();
            setPointerDown(false);
            return;
        }

        if (pointerDown) {            
            context.strokeStyle = "rgba(150, 0, 0, .2)";
            context.lineWidth = data.mask.width;
            
            context.lineCap = 'round';
            context.lineJoin = 'round';

            context.lineTo(e.nativeEvent.layerX, e.nativeEvent.layerY);
            context.stroke();          
        }
    }

    function erase(e, start, stop) {
        const context = data.canvasErase.current.getContext("2d");
        const contextMask = data.canvasMask.current.getContext("2d");
        const maskObj = contextMask.getImageData(0, 0, data.canvasMask.current.width, data.canvasMask.current.height);

        if (start) {
            setPointerDown(true);
            context.beginPath();
            return;
        }
        

        if (stop) {
            context.closePath();
            setPointerDown(false);
            return;
        }

        if (pointerDown) {            
            context.strokeStyle = "rgba(50, 50, 50, 1)";
            context.lineWidth = data.mask.width;
            
            context.lineCap = 'round';
            context.lineJoin = 'round';

            context.lineTo(e.nativeEvent.layerX, e.nativeEvent.layerY);
            context.stroke();
            
            const eraseObj = context.getImageData(0, 0, data.canvasErase.current.width, data.canvasErase.current.height);

            for (let i = 0; i < eraseObj.data.length; i++) {
                if (eraseObj.data[i] !== 0) {
                    maskObj.data[i] = 0;
                    eraseObj.data[i] = 0;
                }
            }

            contextMask.putImageData(maskObj, 0, 0);
            context.putImageData(eraseObj, 0, 0);
        }
    }

    return (
        <div className="imageViewer flex">
            <label ref={imageViewerLabel}>
                <div className="flex">
                    <span className="bigText">Upload an Image</span>
                </div>
                <input type="file" onChange={(e) => loadImage(e)}></input>
            </label>

            <div className="canvasBox" ref={canvasBox}>
                <canvas className="canvasMain" ref={data.canvasMain}
                    onClick={(e) => canvasPen(e)}
                    style={{filter: data.mask.draw || data.mask.erase ? "opacity(.25)" : ""}}
                ></canvas>

                <canvas className="canvasMask" ref={data.canvasMask}
                    onPointerDown={(e) => draw(e, true, false)}
                    onPointerUp={(e) => draw(e, false, true)}
                    onPointerMove={(e) => draw(e, false, false)}
                    style={{
                        zIndex: data.mask.draw ? "100" : 
                        data.mask.erase ? "50" :
                        "",
                        display: data.mask.draw || data.mask.erase ? "block" : "none",
                    }}
                ></canvas>

                <canvas className="canvasErase" ref={data.canvasErase}
                    onPointerDown={(e) => erase(e, true, false)}
                    onPointerUp={(e) => erase(e, false, true)}
                    onPointerMove={(e) => erase(e, false, false)}
                    style={{
                        zIndex: data.mask.erase ? "100" : "",
                        display: data.mask.erase  ? "block" : "none"
                    }}
                ></canvas>               
            </div>
        </div>
    );
});

function Loading() {
    return (
        <div className="loading flex">
            <span>Loading</span>
            <span className="dot">.</span>
            <span className="dot">.</span>
            <span className="dot">.</span>
        </div>
    );
}