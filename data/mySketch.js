let video;
let poseNet;
let poses = [];

let smile = []; // image 마스크
let smileNum = 0;

let cursor = []; // image 마스크
let cursorNum = 0; //

let colorPan = [];
let colorPanNum = 0; //
const develop = false;
let maskDraw = true; // 마스크활성

var capture;
var hold;
let canvas2;

let koFont; // font
let margin; //마진

let clientWidth;
let clientHeight;

function create2DArray(rows, columns) {
  var arr = new Array(rows);
  for (var i = 0; i < rows; i++) {
    arr[i] = new Array(columns);
  }
  return arr;
}

const MAXPHOTOSEQ = 3;
const PHOTO_W = 4;
const PHOTO_X = 5;
const PHOTO_Y = 6;
const PHOTO_R = 7;

const PHOTOSIZE = 300;
var photoSeq = create2DArray(PHOTOSIZE + 1, 8); //배열생성 = photoSeq[20][3]
var photoSeqTimer = 0;
var photoSeqOn = false;
var photoSeqNum = -1;

var photoViewSeqTimer = 0;

var saveSeconds;

const MAIN_IMAGE_SCALE = 0.8;
let mainImageW; //중앙이미지
let vGap; // w gap
let mainImageH;
let mainImageD = 0; //깊이
let mainImageX = 0; //깊이
let mainImageY = 0; //깊이

let imgTrans = false; // 이것은 사진이 다 찍히고 이동하는 것을 판단
let imgUp = false; // 이것은 들어올리는 것
let imgDown = false; // 이것은 들어올리는 것
let imgGo = false; //이미지가 가는 것
let imgBack = false; //이미지가 돌아오는 것
let imgView = false; //이미지가 돌아오는 것
let donotViewNum = 0;
let nullCheckImg = true;
let imgNewMove = false; //이미지가 돌아오는 것

function setup() {
  clientWidth = 1024; //clientWidth = document.querySelector('body').clientWidth;
  clientHeight = 768; //clientHeight = document.querySelector('body').clientHeight;
  if (clientWidth > clientHeight) {
    margin = clientHeight / 10; //마진
  } else {
    margin = clientWidth / 10; //마진
  }

  createCanvas(clientWidth * 2, clientHeight * 2);
  video = createCapture(VIDEO);
  ////pose net
  poseNet = ml5.poseNet(video, modelReady);
  poseNet.on("pose", function (results) {
    poses = results;
    //console.dir(poses);
  });
  video.hide();
}

function modelReady() {
  select("#status").html("Model Loaded");
}
var seconds = 0; //원랜 시간으로 할랬는데 그냥 프레임을 더하자..

let depEasing = 0.1;
let depTarget = 100;
let depStart = 0;
let dep = 0;

let imgEasing = 0.1;
let imgTarget = 100;
let imgStart = 0;
let imgPresent = 0;
let imgTargetX = 0;
let imgTargetY = 0;
let imgTargetR = 0; // R = rotate

let upEasing = 0.1;
let upTarget = 100;
let upStart = 0;
let upPresent = 0;

let downEasing = 0.1;
let downTarget = 100;
let downStart = 0;
let downPresent = 0;

let moveEasing = 0.05;
let moveTarget = 0;
let moveStart = 100;
let movePresent = 0;

function draw() {
  background("#F5F0EC");

  vWidth = video.width; //받는 비디오값
  vHeight = video.height;
  vGap = (vWidth - vHeight) / 2;

  mainImageW = vWidth - vGap * 2; //중앙이미지
  mainImageH = vHeight;

  seconds += 1; // 초
  var timeTrans = false; //시간이 바뀔때
  if (seconds > 30) {
    timeTrans = true;
    seconds = 0;
  }

  if (mouseIsPressed) {
    dep = dep + (depTarget - dep) * depEasing;
  } else {
    dep = dep + (depStart - dep) * depEasing;
  }

  let mainImageX =
    clientWidth - mainImageW / 2 - 50 + +mainImageW * 2 * (0.01 * movePresent);
  let mainImageY = clientHeight / 2 + 120;
  push();
  imageMode(CORNER);
  translate(mainImageX, mainImageY);
  translate(
    imgPresent * 0.01 * (imgTargetX - mainImageX),
    imgPresent * 0.01 * (imgTargetY - mainImageY)
  );
  var depth = 0.01 * (upPresent - downPresent);
  scale(-1, 1);
  scale(1 + 0.001 * upPresent - 0.6 * 0.01 * downPresent);
  scale(MAIN_IMAGE_SCALE);
  rotate(-imgTargetR * 0.01 * upPresent);
  drawingContext.shadowOffsetX = 0 + 50 * depth;
  drawingContext.shadowOffsetY = 0 + 50 * depth;
  drawingContext.shadowBlur = 30 * depth;
  drawingContext.shadowColor = "#00000022";
  imageMode(CENTER);
  image(
    video,
    0,
    0,
    mainImageW,
    mainImageH,
    vGap,
    0,
    vWidth - vGap * 2,
    vHeight
  );
  push();
  translate(-mainImageW / 2, -mainImageW / 2);
  blend(
    colorPan[colorPanNum],
    0,
    0,
    480,
    360,
    0,
    0,
    mainImageW,
    mainImageH,
    OVERLAY
  );
  pop();
  drawingContext.shadowOffsetX = 0;
  drawingContext.shadowOffsetY = 0;
  drawingContext.shadowBlur = 0;
  drawingContext.shadowColor = 0;
  noTint();
  translate(-vGap, 0);
  translate(-mainImageW / 2, -mainImageW / 2);
  imageMode(CENTER);
  if (maskDraw == true) {
    drawKeypoints();
  }
  pop();

  if (
    photoSeqOn == true &&
    timeTrans == true &&
    imgTrans == false &&
    imgUp == false &&
    imgDown == false &&
    imgNewMove == false
  ) {
    //
    seqSave(
      mainImageX - (mainImageW / 2) * MAIN_IMAGE_SCALE,
      mainImageY - (mainImageW / 2) * MAIN_IMAGE_SCALE,
      mainImageW * MAIN_IMAGE_SCALE,
      mainImageH * MAIN_IMAGE_SCALE
    );
  }

  push();
  imageMode(CENTER);
  //translate(clientWidth/2, clientHeight/2);
  if (nullCheckImg) {
    var maxI = PHOTOSIZE;
    if (photoSeqNum <= PHOTOSIZE) {
      maxI = photoSeqNum;
    }

    for (var i = 1; i <= maxI; i++) {
      if (imgView == false && i == photoSeqNum % PHOTOSIZE) {
      } else {
        push();
        imageMode(CENTER);
        translate(photoSeq[i][PHOTO_X], photoSeq[i][PHOTO_Y]);
        scale(photoSeq[i][PHOTO_W]);
        rotate(photoSeq[i][PHOTO_R]);
        image(photoSeq[i][photoViewSeqTimer], 0, 0);
        pop();
      }
    }
  }
  if (timeTrans == true) {
    photoViewSeqTimer++;
    if (photoViewSeqTimer == MAXPHOTOSEQ) {
      photoViewSeqTimer = 0;
    }
  }
  pop();
  /*
  textFont(koFont);
  textSize(40);
  fill(255, 0, 0);
  text(photoSeqNum,500,100);
  text(photoViewSeqTimer,500,200);
  if(photoSeqNum>=0){
    text(photoSeq[photoSeqNum % (PHOTOSIZE )][PHOTO_X],500,300);
    text(photoSeq[photoSeqNum % (PHOTOSIZE )][PHOTO_Y],550,300);
  }
  text(mainImageD,500,400);
 */
  push();
  imageMode(CORNER);
  translate(mainImageX, mainImageY);
  translate(
    imgPresent * 0.01 * (imgTargetX - mainImageX),
    imgPresent * 0.01 * (imgTargetY - mainImageY)
  );
  var depth = 0.01 * (upPresent - downPresent);
  scale(-1, 1);
  scale(1 + 0.001 * upPresent - 0.6 * 0.01 * downPresent);
  scale(MAIN_IMAGE_SCALE);
  rotate(-imgTargetR * 0.01 * upPresent);
  drawingContext.shadowOffsetX =
    10 + 10 * (0.01 * (1 - downPresent)) + 50 * depth;
  drawingContext.shadowOffsetY =
    10 + 10 * (0.01 * (1 - downPresent)) + 50 * depth;
  drawingContext.shadowBlur = 20 + 20 * (0.01 * (1 - downPresent)) + 30 * depth;
  drawingContext.shadowColor = "#00000044";
  imageMode(CENTER);
  image(
    video,
    0,
    0,
    mainImageW,
    mainImageH,
    vGap,
    0,
    vWidth - vGap * 2,
    vHeight
  );
  push();
  translate(-mainImageW / 2, -mainImageW / 2);
  blend(
    colorPan[colorPanNum],
    0,
    0,
    480,
    360,
    0,
    0,
    mainImageW,
    mainImageH,
    OVERLAY
  );
  pop();
  drawingContext.shadowOffsetX = 0;
  drawingContext.shadowOffsetY = 0;
  drawingContext.shadowBlur = 0;
  drawingContext.shadowColor = 0;
  noTint();
  translate(-vGap, 0);
  translate(-mainImageW / 2, -mainImageW / 2);
  imageMode(CENTER);
  if (maskDraw == true) {
    drawKeypoints();
  }
  pop();
  push();
  translate(mainImageX, mainImageY);
  translate(
    imgPresent * 0.01 * (imgTargetX - mainImageX),
    imgPresent * 0.01 * (imgTargetY - mainImageY)
  );
  translate(+downPresent * 0.01 * (clientWidth + 50), 0);
  //rotate(+imgTargetR*0.01*upPresent);
  drawingContext.shadowOffsetX = 0 + 20 * (1 - depth);
  drawingContext.shadowOffsetY = 0 + 20 * (1 - depth);
  drawingContext.shadowBlur = 5;
  drawingContext.shadowColor = "#00000022";
  image(cursor[cursorNum], 160, -150, 50, 50);
  drawingContext.shadowOffsetX = 0;
  drawingContext.shadowOffsetY = 0;
  drawingContext.shadowBlur = 0;
  drawingContext.shadowColor = 0;
  pop();
  if (imgUp == true) {
    upPresent = upPresent + (upTarget - upPresent) * upEasing;
    //upPresent = upPresent + (upStart - upPresent) * upEasing;
    if (upPresent >= upTarget - 0.5) {
      upPresent = upTarget;
      imgUp = false;
      imgTrans = true;
    }
  }
  if (imgTrans == true) {
    imgPresent = imgPresent + (imgTarget - imgPresent) * imgEasing;
    if (imgPresent >= imgTarget - 0.5) {
      imgPresent = imgTarget;
      imgTrans = false;
      imgDown = true;
    }
  }
  if (imgDown == true) {
    downPresent = downPresent + (downTarget - downPresent) * downEasing;
    if (downPresent >= downTarget - 0.5) {
      downPresent = downStart;
      upPresent = upStart;
      imgPresent = 0;
      imgDown = false;
      imgView = true; // 이미지가 보이게 된다.
      imgNewMove = true;
      movePresent = moveStart;
      smileNum = Math.floor(Math.random() * 15);
      if (smileNum > smile.length) {
        smileNum = 0;
      }
      cursorNum = Math.floor(Math.random() * 8);
      colorPanNum = Math.floor(Math.random() * 9);
    }
  }
  if (imgNewMove == true) {
    movePresent = movePresent + (moveTarget - movePresent) * moveEasing;
    if (movePresent <= moveTarget + 0.2) {
      movePresent = 0;
      imgNewMove = false;
    }
  }
  /*
  textFont(koFont);
  textSize(40);
  fill(0);
  textAlign(CENTER);
  textFont("Gugi");
  text("여길 봐주세요!",clientWidth - mainImageW/2+100 ,clientHeight/2 + 100 - mainImageW/2);
  textSize(23);
  text("Please Look here",clientWidth - mainImageW/2+100 ,clientHeight/2 + 100 - mainImageW/2 + 30);
  */
}
function seqSave(w, h, x, y) {
  var num = photoSeqNum % PHOTOSIZE;
  donotViewNum = num + 1;
  //document.getElementById('PLEASE').style.color = "#ff0";
  photoSeq[num + 1][photoSeqTimer] = get(w, h, x, y);
  photoSeqTimer++;
  if (photoSeqTimer == 3) {
    photoSeqTimer = 0;
    photoSeqOn = false;
    imgView = false; // 이미지가 보이게 된다.
    var x = 0;
    var y = 0;
    var r = 0;
    x = Math.floor(Math.random() * (clientWidth - 200)) + 100; //- clientWidth/2;
    y = Math.floor(Math.random() * (clientHeight - 200)) + 100; //- clientHeight/2;
    r = Math.floor(Math.random() * 10) - 5; //- clientHeight/2;
    var reviseValue = 20;
    var whileVal = true;
    // while(whileVal){
    //   var xBool = (x < -clientWidth/2 + reviseValue || x > clientWidth/2 - reviseValue ||( x >= -1 * mainImageW/2 - reviseValue && x <= mainImageW/2 + reviseValue ));
    //   var yBool = (y < -clientHeight/2 + reviseValue || y > clientHeight/2 - reviseValue ||( y >= -1 * mainImageW/2 - reviseValue && y <= mainImageW/2 + reviseValue ));
    //   if(xBool && yBool){
    //     x = Math.floor(Math.random() * clientWidth) - clientWidth/2;
    //     y = Math.floor(Math.random() * clientHeight) - clientHeight/2;
    //   }
    //   else{
    //     whileVal = false;
    //   }
    // }
    photoSeq[num + 1][PHOTO_W] = 0.5; //0.2 + 0.1 * Math.random();
    photoSeq[num + 1][PHOTO_X] = x;
    photoSeq[num + 1][PHOTO_Y] = y;
    photoSeq[num + 1][PHOTO_R] = r;
    photoSeqNum++;
    imgTargetX = x;
    imgTargetY = y;
    imgTargetR = r;
    imgUp = true;
    nullCheckImg = true;
  }
  //photoSeq[photoSeqNum+1][PHOTO_W] = Math.floor(Math.random() * 3);
}

function mousePressed() {
  if (mouseX > 0 && mouseX < 300 && mouseY > 0 && mouseY < 300) {
    //startRecording(); 캡쳐
    maskDraw = true;
    photoSeqOn = true;
  }
}
function keyPressed() {
  if (keyCode === LEFT_ARROW) {
    photoSeqOn = true;
  } else if (keyCode === RIGHT_ARROW) {
  }
  return false;
}
function preload() {
  smile[0] = loadImage("./data/images/mouth.png");
  for (var i = 1; i < 16; i++) {
    smile[i] = loadImage("./data/images/mouth_" + i + ".png");
  }
  for (var i = 1; i < 9; i++) {
    cursor[i - 1] = loadImage("./data/images/mouse0" + i + ".png");
  }
  koFont = loadFont(
    "https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/GmarketSansMedium.woff"
  );
  colorPan[0] = loadImage("./data/images/yellow.png");
  for (var i = 1; i < 11; i++) {
    colorPan[i - 1] = loadImage("./data/images/c" + i + ".png");
  }
}

let getPose = [];
function drawKeypoints() {
  let savePoseX; //이전 pose값 복사
  let savePoseY; //이전 pose값 복사
  let saveDist; //이전 dist 값 복사
  let cn = 0.2; //정확도
  let minDist = 50; //최소크기
  let nullCheck = 1;

  for (let i = 0; i < poses.length; i++) {
    // For each pose detected, loop through all the keypoints
    let pose = poses[i].pose;
    let poseX = (pose.leftEye.x + pose.rightEye.x) / 2;
    let poseY = (pose.leftEye.y + pose.rightEye.y) / 2;

    // Only draw an ellipse is the pose probability is bigger than 0.2
    if (pose.leftEye.confidence > cn && pose.rightEye.confidence > cn) {
      if (
        nullCheck == 1 ||
        ((savePoseX + saveDist >= poseX || savePoseX - saveDist <= poseX) &&
          (savePoseY + saveDist >= poseY || savePoseY - saveDist <= poseY))
      ) {
        let w = dist(
          pose.leftEar.x,
          pose.leftEar.y,
          pose.rightEar.x,
          pose.rightEar.y
        );
        let faceWidth = w;

        if (w >= minDist) {
          // if(b_faceCheckDraw){
          //   rectMode(CENTER);
          //   noFill();
          //   stroke(255, 204, 0,100);
          //   strokeWeight(2);
          //   rect(poseX, poseY, faceWidth+10, faceWidth+10,20);
          //   //ellipse(pose.nose.x, pose.nose.y, faceWidth, faceHeight);
          // }
          photoSeqOn = true;

          let maskX = (pose.leftEye.x + pose.rightEye.x) / 2;
          let maskY = (pose.leftEye.y + pose.rightEye.y) / 2;
          let maskPadding = (faceWidth * 3) / 10;
          if (
            maskX > vGap + maskPadding &&
            maskX < video.width - vGap - maskPadding &&
            maskY > maskPadding &&
            maskY < video.height - maskPadding
          ) {
            push();
            imageMode(CENTER);

            translate(maskX, maskY);
            angleMode(DEGREES);
            let angle = getAngle2(
              pose.leftEye.x,
              pose.leftEye.y,
              pose.rightEye.x,
              pose.rightEye.y
            );
            rotate(180 + angle);
            translate(0, faceWidth / 3);
            scale(-1, 1);
            image(
              smile[smileNum],
              0,
              0,
              (faceWidth * 4) / 5,
              ((faceWidth / 2) * 4) / 5
            );
            pop();
          }
        } else {
        }
        saveDist = w / 2;
        nullCheck++;
      }
    }
    savePoseX = poseX;
    savePoseY = poseY;
  }
}

function getAngle2(cx, cy, ex, ey) {
  var dy = ey - cy;
  var dx = ex - cx;
  var theta = Math.atan2(dy, dx);
  theta *= 180 / Math.PI;
  return theta;
}
