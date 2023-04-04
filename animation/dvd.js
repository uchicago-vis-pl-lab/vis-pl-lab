/******** PARAMETERS ************/
const pallete = ["#ff8800", "#e124ff", "#6a19ff", "#ff2188", "#5faa91",
                 "#59a9c0", "#90df84", "#5c58c7", "#6dc2e5", "#a0df6b"];

let bouncing = false;
let spinningX = false;
let spinningY = false;
let spinningZ = false;
let spinSpeed = 2;
let speed = 2;

const dvd = document.getElementById("dvd");
const background = document.getElementById("background");

/*********** HELPER FUNCTIONS ************/
let currentColorIndex = 0;
function newColor() {
  const currentPallete = [...pallete];
  currentPallete.splice(currentColorIndex, 1);
  const random = Math.floor(Math.random() * currentPallete.length);
  currentColorIndex = random < currentColorIndex ? random : random + 1;
  return currentPallete[random];
}

/*********** ANIMATION FUNCTIONS ************/
/* current positions state */
let x = 0;
let y = 0;
let dirX = 1;
let dirY = 1;

function bounce() {
  const dvdWidth = dvd.clientWidth;
  const dvdHeight = dvd.clientHeight;

  const screenHeight = document.body.clientHeight;
  const screenWidth = document.body.clientWidth;

  if (y < 0 || y + dvdHeight > screenHeight) {
    dirY *= -1;
    dvd.style.backgroundColor = newColor();
  }

  if (x < 0 || x + dvdWidth > screenWidth) {
    dirX *= -1;
    dvd.style.backgroundColor = newColor();
  }

  x += dirX * speed;
  y += dirY * speed;

  dvd.style.left = x + "px";
  dvd.style.top  = y + "px";
}

let spinDegrees = {'x': 0, 'y': 0, 'z': 0};
function spin(x, y, z) {
  if (x) {
    spinDegrees.x = (spinDegrees.x + spinSpeed) % 360;
  }
  if (y) {
    spinDegrees.y = (spinDegrees.y + spinSpeed) % 360;
  }
  if (z) {
    spinDegrees.z = (spinDegrees.z + spinSpeed) % 360;
  }

  dvd.style.transform =
    `rotateX(${spinDegrees.x}deg) rotateY(${spinDegrees.y}deg) rotateZ(${spinDegrees.z}deg)`;
}

/*********** ENTRY POINTS **********/
function initialize() {
  let params = (new URL(document.location)).searchParams;
  bouncing = params.has('bounce');
  spinningX = params.has('spinX');
  spinningY = params.has('spinY');
  spinningZ = params.has('spinZ');

  if (params.has('spinSpeed')) {
    spinSpeed = +params.get('spinSpeed');
  }
  if (params.has('spinSpeed')) {
    speed = +params.get('bounceSpeed');
  }

  if (params.has('image')) {
    let image_url = params.get('image');
    dvd.style.maskImage = "url('" + image_url + "')";

    let placeholder = document.createElement('img');
    placeholder.src = image_url;
    placeholder.style.height = dvd.clientHeight + 'px';
    placeholder.style.visibility = 'hidden';
    dvd.appendChild(placeholder);
  } else if (params.has('text')) {
    let text = params.get('text');
    dvd.innerText = text;
    dvd.style.backgroundClip = 'text';
    dvd.style.fontSize = dvd.clientHeight + 'px';
    if (params.has('font')) {
      dvd.style.fontFamily = params.get('font');
    }
  } else {
    console.error("dvd.js: need either image or text content");
  }

  dvd.style.left = x + "px";
  dvd.style.top  = y + "px";
  dvd.style.backgroundColor = newColor();
}

function animate() {
  if (bouncing)
    bounce();
  if (spinningX || spinningY || spinningZ)
    spin(spinningX, spinningY, spinningZ);

  window.requestAnimationFrame(animate);
}

initialize();
window.requestAnimationFrame(animate);
