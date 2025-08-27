import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';

import { readTextFile } from './readTextFile.js';


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
// camera position
camera.position.z = 1.5;
const canvas = document.querySelector('canvas');

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// orbit controls
// const controls = new OrbitControls(camera, renderer.domElement);

// const axesHelper = new THREE.AxesHelper(5);
// scene.add(axesHelper);

// background and scene
const backgroundLoader = new THREE.CubeTextureLoader();
const backgroundTexture = backgroundLoader.load([
    "background/right.png",
    "background/left.png",
    "background/top.png",
    "background/bot.png",
    "background/front.png",
    "background/back.png"
]);
scene.background = backgroundTexture;


// lights
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.25);
const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 4);
directionalLight.position.set(0.3, 1, 1);
directionalLight.target.position.set(0, 0, 0);
scene.add(ambientLight, directionalLight);


// ps4 game case dimensions
const ps4Dimensions = [0.666, 1, 0.1]

// box dimensions
const gameCaseGeometry = new THREE.BoxGeometry(ps4Dimensions[0], ps4Dimensions[1], ps4Dimensions[2]);

// list of games
let gameTitles = [
    "crosscode",
    "elden_ring",
    "spongebob",
    "stardew_valley",
    "terraria",
    "fortnite",
    "risk_of_rain",
    "kerbal_space_program",
    "one_step_from_eden",
    "deep_rock_galactic",
    "ftl",
    "starcraft",
    "diablo"
]

// pre loaded common textures
const textureLoader = new THREE.TextureLoader()
textureLoader.setPath("");

const leftTexture = textureLoader.load("other/spine.png");
leftTexture.colorSpace = THREE.SRGBColorSpace;
/* const rightTexture = textureLoader.load("other_vertical.png");
rightTexture.colorSpace = THREE.SRGBColorSpace;
const topBottomTexture = textureLoader.load("other_horizontal.png");
topBottomTexture.colorSpace = THREE.SRGBColorSpace; */

// list of loaded game objects and their respective animation tweens
let gameObjects = []
let gameObjectTweens = []
for (let i = 0; i < gameTitles.length; i++) {
    let currentGame = gameTitles[i];
    let coverTexture = textureLoader.load(`game_covers/${currentGame}.jpg`);
    coverTexture.colorSpace = THREE.SRGBColorSpace;
    let backTexture = textureLoader.load(`game_backs/${currentGame}_back.jpg`);
    backTexture.colorSpace = THREE.SRGBColorSpace;
    let materials = [
        new THREE.MeshStandardMaterial( {color: 0x000000} ),
        new THREE.MeshStandardMaterial( {map: leftTexture} ),
        new THREE.MeshStandardMaterial( {color: 0x000000} ),
        new THREE.MeshStandardMaterial( {color: 0x000000} ),
        new THREE.MeshStandardMaterial( {map: coverTexture} ),
        new THREE.MeshStandardMaterial( {map: backTexture} )
    ]
    let box = new THREE.Mesh(
        gameCaseGeometry,
        materials
    )
    
    // add to scene and list of game objects for later reference
    box.position.set(i, 0, 0);
    scene.add(box);
    gameObjects.push(box);
    
    // create new empty tween arrays for later animation use
    gameObjectTweens.push([]);
}

// line of game objs will be centered on 0th index obj, set selected index to that one
let selectedGameIndex = 0;
// init rotation tweens of game index game
function initTweens() {
    let objRotTween = new TWEEN.Tween({y: 0})
        .to({y: 2*Math.PI}, 8000)
        .onUpdate((rotation) => {
            gameObjects[selectedGameIndex].rotation.y = rotation.y;
        })
        .repeat(Infinity);
    objRotTween.start();
    gameObjectTweens[selectedGameIndex].push(objRotTween);

    let objPosTween = new TWEEN.Tween({x: gameObjects[selectedGameIndex].position.x, z: gameObjects[selectedGameIndex].position.z})
        .to({x: 0, z: 0.333}, 333)
        .onUpdate((coords) => {
            gameObjects[selectedGameIndex].position.x = coords.x;
            gameObjects[selectedGameIndex].position.z = coords.z;
        })
        .easing(TWEEN.Easing.Exponential.Out);
    objPosTween.start();
    gameObjectTweens[selectedGameIndex].push(objPosTween);
}
initTweens();


// create HTML elements for text and store those in array much like the game obj
// game's text is accessed using same index
// tutorial from https://www.youtube.com/watch?v=LsoidaI-8qQ
// and https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement
let gameText = []
for (let i = 0; i < gameTitles.length; i++) {
    let currentGameTitle = gameTitles[i];
    let text = await readTextFile(`${currentGameTitle}`)
    // console.log(text);

    let textElement = document.createElement("div");
    let textContent = document.createTextNode(text);
    textElement.appendChild(textContent);
    textElement.setAttribute("id", `${currentGameTitle}_text`)
    textElement.setAttribute("class", `popup_text`)

    document.getElementById("text").appendChild(textElement);
    
    // add the game text to the array for later reference
    gameText.push(textElement);

    // place the text box off screen
    // let textHeight = textElement.offsetHeight;
    // console.log(textHeight);
    textElement.style.maxWidth = `${2 * window.innerWidth/5}px`
    textElement.style.maxHeight = `${4 * window.innerHeight/5}px`
    textElement.style.left = `${window.innerWidth/2}px`;
    textElement.style.top = `${(window.innerHeight/2) - (textElement.offsetHeight/2)}px`;
    textElement.style.visibility = "hidden";
}




// pointer raycaster from https://threejs.org/docs/index.html?q=ray#api/en/core/Raycaster
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let intersects = [];


// flag for current animation state
// can be either Library (line view) or Details (single game)
let animationState = "Library";


function animate(t) {
    TWEEN.update(t);
    requestAnimationFrame(animate);

    /* for (let i = 0; i < gameObjects.length; i++) {
        let currentGame = gameObjects[i];
        if (selectedGameIndex == i) {
            // currentGame.rotation.y += 0.01;
            // currentGame.rotation.y = currentGame.rotation.y % (2*Math.PI);
            // console.log(currentGame.rotation.y);
        }
    } */

    // update raycaster/pointer stuff
    raycaster.setFromCamera(pointer, camera);
    intersects = raycaster.intersectObjects(scene.children);
    // console.log(intersects.length);

    renderer.render(scene, camera);
}
// start scene animations
animate();


function scrollLibrary(scrollIndex) {
    // check for validity of scroll
    if (scrollIndex < 0 || scrollIndex > (gameObjects.length - 1)) {
        return;
    }

    if (scroll == selectedGameIndex) {
        return;
    }
    selectedGameIndex = scrollIndex;

    // adjust game obj positions
    for (let i = 0; i < gameObjects.length; i++) {
        let currentGame = gameObjects[i];

        // cancel any old tweens
        for (let j = 0; j < gameObjectTweens[i].length; j++) {
            gameObjectTweens[i][j].stop();
        }

        // use tween to add interpolation to scroll animations
        let currentObjTweens = [];

        let newX = i - scrollIndex;

        // tween code adapted from https://youtu.be/zXqCj8jeAi0?si=u8yoERJzGhgSXGRX
        if (scrollIndex == i) {
            let objPosTween = new TWEEN.Tween({x: currentGame.position.x, z: currentGame.position.z})
                .to({x: newX, z: 0.333}, 333)
                .onUpdate((coords) => {
                    currentGame.position.x = coords.x;
                    currentGame.position.z = coords.z;
                })
                .easing(TWEEN.Easing.Exponential.Out);
            objPosTween.start();
            currentObjTweens.push(objPosTween);

            let objRotTween = new TWEEN.Tween({y: currentGame.rotation.y  % (2*Math.PI)})
            .to({y: 2*Math.PI + currentGame.rotation.y}, 8000)
                .onUpdate((rotation) => {
                    currentGame.rotation.y = rotation.y;
                })
                .repeat(Infinity);
            objRotTween.start();
            currentObjTweens.push(objRotTween);
        }

        if (scrollIndex != i) {
            let objPosTween = new TWEEN.Tween({x: currentGame.position.x, z: currentGame.position.z})
                .to({x: newX, z: 0}, 333)
                .onUpdate((coords) => {
                    currentGame.position.x = coords.x;
                    currentGame.position.z = coords.z;
                })
                .easing(TWEEN.Easing.Exponential.Out);
            objPosTween.start();
            currentObjTweens.push(objPosTween);

            let objRotTween = new TWEEN.Tween({y: currentGame.rotation.y})
                .to({y: 0}, 1000)
                .onUpdate((rotation) => {
                    currentGame.rotation.y = rotation.y;
                })
                .easing(TWEEN.Easing.Exponential.Out);
            objRotTween.start();
            currentObjTweens.push(objRotTween);
        }
        gameObjectTweens[i] = currentObjTweens;
    }

    // console.log(event.deltaY);
    // console.log(deltaIndex);
    // console.log(scrollIndex);
}


// scroll wheel functionality
addEventListener("wheel", (event) => {
    // only works in library mode
    if (animationState != "Library" ) {
        return;
    }

    let deltaIndex = event.deltaY/Math.abs(event.deltaY);
    scrollLibrary(selectedGameIndex + deltaIndex);
});

// react to window resize
window.addEventListener("resize", onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight)

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // adjust game text
    for (let i = 0; i < gameText.length; i++) {
        // console.log(i);
        let textElement = gameText[i];
        textElement.style.maxWidth = `${2 * window.innerWidth/5}px`
        textElement.style.maxHeight = `${4 * window.innerHeight/5}px`
        textElement.style.left = `${window.innerWidth/2}px`;
        textElement.style.top = `${(window.innerHeight/2) - (textElement.offsetHeight/2)}px`;
        // console.log(textElement.clientHeight);
    }

    // console.log("resized");
}


// continuation of pointer raycaster from above
function onPointerMove(event) {
    // get normalized device coords from pointer coords
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
}

window.addEventListener("pointermove", onPointerMove);


// detect click on object
function onClick(event) {
    // if click again while in details mode, exit details mode and go back to library mode
    if (animationState == "Details") {
        libraryMode(selectedGameIndex);
        return;
    }
    if (intersects.length == 0) {
        return;
    }

    // hover over obj and click, do proper stuff

    // figure out which index user clicked on
    let raycastedObj = intersects[0].object;
    let raycastedIndex = -1;

    for (let i = 0; i < gameObjects.length; i++) {
        if (raycastedObj == gameObjects[i]) {
            raycastedIndex = i;
            break;
        }
    }
    if (raycastedIndex == -1) {
        console.log("raycast click failed");
        return;
    }
    // console.log(raycastedIndex);

    // clicked a valid object, do inspect mode
    detailsMode(raycastedIndex);
}
window.addEventListener("click", onClick);

// function for entering "details mode"
function detailsMode(inspectIndex) {
    // enter details mode
    animationState = "Details";

    
    // overwrite all other tweens
    for (let i = 0; i < gameObjects.length; i++) {
        for (let j = 0; j < gameObjectTweens[i].length; j++) {
            gameObjectTweens[i][j].stop();
        }
    }

    // change selected game index to raycasted so it returns to proper spot when inspect state is over
    selectedGameIndex = inspectIndex;

    // send all obj but selected away
    for (let i = 0; i < gameObjects.length; i++) {
        if (i == inspectIndex) {
            continue;
        }

        let currentObj = gameObjects[i];

        let objPosTween = new TWEEN.Tween({x: currentObj.position.x, z: currentObj.position.z})
            .to({x: (i - (inspectIndex)) * 4, z: 0}, 333)
            .onUpdate((coords) => {
                currentObj.position.x = coords.x;
                currentObj.position.z = coords.z;
            })
            .easing(TWEEN.Easing.Exponential.Out);
        objPosTween.start();

        let objRotTween = new TWEEN.Tween({y: currentObj.rotation.y})
            .to({y: 0}, 1000)
            .onUpdate((rotation) => {
                currentObj.rotation.y = rotation.y;
            })
            .easing(TWEEN.Easing.Exponential.Out);
        objRotTween.start();

        gameObjectTweens[i] = [objPosTween, objRotTween];
    }

    // give raycasted obj specific motion to show that it is selected
    let currentObj = gameObjects[inspectIndex];
    let objPosTween = new TWEEN.Tween({x: currentObj.position.x, z: currentObj.position.z})
        .to({x: -0.66, z: 0.5}, 333)
        .onUpdate((coords) => {
            currentObj.position.x = coords.x;
            currentObj.position.z = coords.z;
        })
        .easing(TWEEN.Easing.Exponential.Out);
    objPosTween.start();

    let objRotTween = new TWEEN.Tween({y: currentObj.rotation.y  % (2*Math.PI)})
        .to({y: 2*Math.PI + currentObj.rotation.y}, 10000)
        .onUpdate((rotation) => {
            currentObj.rotation.y = rotation.y;
        })
        .repeat(Infinity);
    objRotTween.start();

    gameObjectTweens[inspectIndex] = [objPosTween, objRotTween];


    // display game text
    let textElement = gameText[inspectIndex];
    textElement.style.visibility = "visible";
}


// function for entering "library scroll" mode
function libraryMode(libraryIndex) {
    animationState = "Library";
    // remove game text
    let textElement = gameText[libraryIndex];
    textElement.style.visibility = "hidden";
    scrollLibrary(libraryIndex);
}


// check for arrow keys
function stateToggle() {
    if (animationState == "Library") {
        detailsMode(selectedGameIndex);
    } else if (animationState == "Details") {
        libraryMode(selectedGameIndex);
    }
}
function keyboardInput(event) {
    switch (event.keyCode) {
        case 37:    // left arrow
            if (animationState == "Library") {
                scrollLibrary(selectedGameIndex - 1);
            }
            break;

        case 39:    // right arrow
            if (animationState == "Library") {
                scrollLibrary(selectedGameIndex + 1);
            }
            break;

        case 38:    // up arrow
            stateToggle();
            break;

        case 40:    // down arrow
            stateToggle();
            break;

        case 13:    // enter
            stateToggle();
            break;
        
        case 32:    // space
            stateToggle();
            break;
    }
}
window.addEventListener("keydown", keyboardInput);