const canvas = document.querySelector("canvas"),
  toolBtns = document.querySelectorAll(".tool"),
  fillColor = document.querySelector("#fill-color"),
  sizeSlider = document.querySelector("#size-slider"),
  colorBtns = document.querySelectorAll(".colors .option"),
  colorPicker = document.querySelector("#color-picker"),
  clearCanvas = document.querySelector(".clear-canvas"),
  saveImg = document.querySelector(".save-img"),
  ctx = canvas.getContext("2d");

let prevMouseX,
  prevMouseY,
  snapshot,
  isDrawing = false,
  selectedTool = "brush",
  brushWidth = 5,
  selectedColor = "#000",
  undoStack = [],
  redoStack = [];

const setCanvasBackground = () => {
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = selectedColor;
};

window.addEventListener("load", () => {
  // setting canvas width/height
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  setCanvasBackground();
});

const saveState = () => {
  undoStack.push(canvas.toDataURL());
  redoStack = [];
};

const undo = () => {
  if (undoStack.length === 0) return;
  redoStack.push(canvas.toDataURL());
  const previousState = undoStack.pop();
  const img = new Image();
  img.src = previousState;
  img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
};

const redo = () => {
  if (redoStack.length === 0) return;
  undoStack.push(canvas.toDataURL());
  const nextState = redoStack.pop();
  const img = new Image();
  img.src = nextState;
  img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
};

const drawLine = (e) => {
  ctx.beginPath();
  ctx.moveTo(prevMouseX, prevMouseY);
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
};

const drawRect = (e) => {
  // if fillColor isn't checked draw rect with border else draw rect with background
  if (!fillColor.checked) {
    // creating circle according to the mouse pointer
    return ctx.strokeRect(
      e.offsetX,
      e.offsetY,
      prevMouseX - e.offsetX,
      prevMouseY - e.offsetY,
    );
  }
  ctx.fillRect(
    e.offsetX,
    e.offsetY,
    prevMouseX - e.offsetX,
    prevMouseY - e.offsetY,
  );
};

const drawCircle = (e) => {
  ctx.beginPath();
  // getting radius with mouse pointer
  let radius = Math.sqrt(
    Math.pow(prevMouseX - e.offsetX, 2) + Math.pow(prevMouseY - e.offsetY, 2),
  );
  ctx.arc(prevMouseX, prevMouseY, radius, 0, 2 * Math.PI);
  fillColor.checked ? ctx.fill() : ctx.stroke();
};

const drawTriangle = (e) => {
  ctx.beginPath();
  ctx.moveTo(prevMouseX, prevMouseY);
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.lineTo(prevMouseX * 2 - e.offsetX, e.offsetY);
  ctx.closePath();
  fillColor.checked ? ctx.fill() : ctx.stroke();
};

const drawPolygon = (e, sides = 6) => {
  const radius = Math.sqrt(
    Math.pow(e.offsetX - prevMouseX, 2) + Math.pow(e.offsetY - prevMouseY, 2),
  );
  const angleStep = (2 * Math.PI) / sides;

  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const x = prevMouseX + radius * Math.cos(angleStep * i);
    const y = prevMouseY + radius * Math.sin(angleStep * i);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  fillColor.checked ? ctx.fill() : ctx.stroke();
};

const startDraw = (e) => {
  isDrawing = true;
  prevMouseX = e.offsetX;
  prevMouseY = e.offsetY;
  ctx.beginPath();
  ctx.lineWidth = brushWidth;
  ctx.strokeStyle = selectedColor;
  ctx.fillStyle = selectedColor;
  // drag image fix
  snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
};

const drawing = (e) => {
  if (!isDrawing) return;
  ctx.putImageData(snapshot, 0, 0);

  if (selectedTool === "brush" || selectedTool === "eraser") {
    // if selected tool is eraser then strokeStyle white
    ctx.strokeStyle = selectedTool === "eraser" ? "#fff" : selectedColor;
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
  } else if (selectedTool === "rectangle") {
    drawRect(e);
  } else if (selectedTool === "circle") {
    drawCircle(e);
  } else if (selectedTool === "line") {
    drawLine(e);
  } else if (selectedTool === "polygon") {
    drawPolygon(e, 5); // Default to pentagon
  } else {
    drawTriangle(e);
  }
};

const getTouchPosition = (touch) => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top,
  };
};

const startDrawTouch = (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  const position = getTouchPosition(touch);
  prevMouseX = position.x;
  prevMouseY = position.y;
  isDrawing = true;
  ctx.beginPath();
  ctx.lineWidth = brushWidth;
  ctx.strokeStyle = selectedColor;
  ctx.fillStyle = selectedColor;
  snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
};

const drawingTouch = (e) => {
  if (!isDrawing) return;
  e.preventDefault();
  const touch = e.touches[0];
  const position = getTouchPosition(touch);
  ctx.putImageData(snapshot, 0, 0);

  if (selectedTool === "brush" || selectedTool === "eraser") {
    // if selected tool is eraser then strokeStyle white
    ctx.strokeStyle = selectedTool === "eraser" ? "#fff" : selectedColor;
    ctx.lineTo(position.x, position.y);
    ctx.stroke();
  } else if (selectedTool === "rectangle") {
    drawRect({ offsetX: position.x, offsetY: position.y });
  } else if (selectedTool === "circle") {
    drawCircle({ offsetX: position.x, offsetY: position.y });
  } else if (selectedTool === "line") {
    drawLine({ offsetX: position.x, offsetY: position.y });
  } else if (selectedTool === "polygon") {
    drawPolygon({ offsetX: position.x, offsetY: position.y }, 5);
  } else {
    drawTriangle({ offsetX: position.x, offsetY: position.y });
  }
};

const stopDrawTouch = (e) => {
  isDrawing = false;
};

toolBtns.forEach((btn) => {
  btn.addEventListener("pointerdown", () => {
    document.querySelector(".options .active").classList.remove("active");
    btn.classList.add("active");
    selectedTool = btn.id;
  });
});

colorBtns.forEach((btn) => {
  btn.addEventListener("pointerdown", () => {
    document.querySelector(".options .selected").classList.remove("selected");
    btn.classList.add("selected");
    selectedColor = window
      .getComputedStyle(btn)
      .getPropertyValue("background-color");
  });
});

// toolBtns.forEach((btn) => {
//   btn.addEventListener("click", () => {
//     // click event for tool options
//     // remove active class from previous, add current to clicked
//     document.querySelector(".options .active").classList.remove("active");
//     btn.classList.add("active");
//     selectedTool = btn.id;
//   });
// });

sizeSlider.addEventListener("change", () => (brushWidth = sizeSlider.value));

// colorBtns.forEach((btn) => {
//   btn.addEventListener("click", () => {
//     // add click event to color buttons
//     // remove selected class from previous and add current clicked
//     document.querySelector(".options .selected").classList.remove("selected");
//     btn.classList.add("selected");
//     // pass selected btn background color selectedColor value
//     selectedColor = window
//       .getComputedStyle(btn)
//       .getPropertyValue("background-color");
//   });
// });

colorPicker.addEventListener("change", () => {
  // pass picked color value from color picker to last color btn background
  colorPicker.parentElement.style.background = colorPicker.value;
  colorPicker.parentElement.click();
});

clearCanvas.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  setCanvasBackground();
});

saveImg.addEventListener("click", () => {
  const imgURL = canvas.toDataURL();
  if (window.confirm("Do you want to save this image?")) {
    const link = document.createElement("a");
    link.download = `${Date.now()}.jpg`;
    link.href = imgURL;
    link.click();
  }
});

document.addEventListener("keydown", (e) => {
  // Check if Control or Command is pressed with the key
  const isCtrlPressed = e.ctrlKey || e.metaKey;

  // Ctrl + Z for Undo
  if (isCtrlPressed && e.key === "z") {
    e.preventDefault();
    undo();
  }

  // Ctrl + Y for Redo
  if (isCtrlPressed && e.key === "y") {
    e.preventDefault();
    redo();
  }
});

const resizeCanvas = () => {
  // Save the current canvas content
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.drawImage(canvas, 0, 0);

  // Get the old canvas dimensions
  const oldWidth = canvas.width;
  const oldHeight = canvas.height;

  // Resize the canvas
  canvas.width = window.innerWidth * 0.9; // 90% of screen width
  canvas.height = window.innerHeight * 0.6; // 60% of screen height

  // Scale the content to fit the new canvas dimensions
  const scaleX = canvas.width / oldWidth;
  const scaleY = canvas.height / oldHeight;

  ctx.drawImage(
    tempCanvas,
    0,
    0,
    oldWidth,
    oldHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  setCanvasBackground();

  // Adjust the drawing context scale if needed (e.g., brush strokes, grid alignment)
  ctx.scale(scaleX, scaleY);
};

const adjustBrushSize = () => {
  const scaleX = canvas.width / oldWidth;
  const scaleY = canvas.height / oldHeight;
  brushWidth *= Math.max(scaleX, scaleY); // Scale brushWidth proportionally
};

resizeCanvas(); // Call adjustBrushSize after resizing

window.addEventListener("resize", resizeCanvas);
window.addEventListener("load", () => {
  resizeCanvas();
});

document.querySelector(".undo").addEventListener("click", undo);
document.querySelector(".redo").addEventListener("click", redo);

canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", drawing);
canvas.addEventListener("mouseup", () => (isDrawing = false));

// Add touch event listeners
canvas.addEventListener("touchstart", startDrawTouch);
canvas.addEventListener("touchmove", drawingTouch);
canvas.addEventListener("touchend", stopDrawTouch);

// Save state on drawing start
canvas.addEventListener("mousedown", (e) => {
  saveState();
  startDraw(e);
});
