const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const quietOverlay = document.getElementById("quietOverlay");
const quietOpeners = document.querySelectorAll("[data-quiet-open]");
const quietCloseButton = document.getElementById("closeQuiet");

const openQuiet = () => {
  if (!quietOverlay) return;
  document.body.classList.add("quiet-open");
  quietOverlay.setAttribute("aria-hidden", "false");
};

const closeQuiet = () => {
  if (!quietOverlay) return;
  document.body.classList.remove("quiet-open");
  quietOverlay.setAttribute("aria-hidden", "true");
};

quietOpeners.forEach((button) => button.addEventListener("click", openQuiet));

if (quietCloseButton) {
  quietCloseButton.addEventListener("click", closeQuiet);
}

if (quietOverlay) {
  quietOverlay.addEventListener("click", (event) => {
    if (event.target === quietOverlay) {
      closeQuiet();
    }
  });
}

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && document.body.classList.contains("quiet-open")) {
    closeQuiet();
  }
});

const breathingCircle = document.querySelector(".breathing-circle");
const breathingStatus = document.getElementById("breathingStatus");
const breathButtons = document.querySelectorAll("[data-breath]");
const breathDurations = {
  slow: 9,
  slower: 13,
};
const breathLabels = {
  slow: "Slow",
  slower: "Slower",
};

const setBreathSpeed = (speed) => {
  if (!breathingCircle || !breathingStatus) return;
  const duration = breathDurations[speed] || breathDurations.slow;
  breathingCircle.style.animationDuration = `${duration}s`;
  breathButtons.forEach((button) => {
    const isActive = button.dataset.breath === speed;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  breathingStatus.textContent = `Current rhythm: ${breathLabels[speed] || breathLabels.slow}`;
};

breathButtons.forEach((button) => {
  button.addEventListener("click", () => setBreathSpeed(button.dataset.breath));
});

setBreathSpeed("slow");

const canvas = document.getElementById("softCanvas");
if (canvas) {
  const ctx = canvas.getContext("2d");

  if (ctx) {
    const particles = [];
    const particleCount = 12;
    let width = 0;
    let height = 0;
    let dpr = window.devicePixelRatio || 1;
    let animationFrame = null;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const seedParticles = () => {
      particles.length = 0;
      for (let index = 0; index < particleCount; index += 1) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: 28 + Math.random() * 36,
          speedX: (Math.random() - 0.5) * 0.2,
          speedY: (Math.random() - 0.5) * 0.2,
          hue: 160 + Math.random() * 40,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      ctx.fillRect(0, 0, width, height);

      particles.forEach((particle) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        if (particle.x < -particle.radius) particle.x = width + particle.radius;
        if (particle.x > width + particle.radius) particle.x = -particle.radius;
        if (particle.y < -particle.radius) particle.y = height + particle.radius;
        if (particle.y > height + particle.radius) particle.y = -particle.radius;

        ctx.beginPath();
        ctx.fillStyle = `hsla(${particle.hue}, 30%, 85%, 0.35)`;
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      if (!prefersReducedMotion) {
        animationFrame = requestAnimationFrame(draw);
      }
    };

    const handleResize = () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
      resizeCanvas();
      seedParticles();
      draw();
    };

    window.addEventListener("resize", handleResize);
    handleResize();
  }
}

const soundToggle = document.getElementById("toggleSound");
let audioContext = null;
let oscillator = null;
let gainNode = null;
let soundOn = false;

const startHum = async () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  oscillator = audioContext.createOscillator();
  gainNode = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = 110;
  gainNode.gain.value = 0.02;

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start();
};

const stopHum = () => {
  if (!oscillator || !gainNode || !audioContext) return;
  const now = audioContext.currentTime;
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
  oscillator.stop(now + 0.5);
  oscillator = null;
  gainNode = null;
};

if (soundToggle) {
  soundToggle.addEventListener("click", async () => {
    soundOn = !soundOn;
    soundToggle.setAttribute("aria-pressed", String(soundOn));
    soundToggle.textContent = soundOn ? "Low hum: On" : "Low hum: Off";

    if (soundOn) {
      try {
        await startHum();
      } catch (error) {
        soundOn = false;
        soundToggle.setAttribute("aria-pressed", "false");
        soundToggle.textContent = "Low hum: Off";
      }
    } else {
      stopHum();
    }
  });
}

const releaseField = document.getElementById("releaseField");
const pressureRange = document.getElementById("pressureRange");
const pressureStatus = document.getElementById("pressureStatus");
const scatterButton = document.getElementById("scatterButton");

if (releaseField && pressureRange && scatterButton) {
  const bubbleCount = 16;
  const bubbles = [];
  const basePositions = [];
  let currentScale = 0.8;
  let currentOpacity = 0.5;

  const createBubbles = () => {
    for (let index = 0; index < bubbleCount; index += 1) {
      const bubble = document.createElement("span");
      releaseField.appendChild(bubble);
      bubbles.push(bubble);
      basePositions.push({ x: 0, y: 0 });
    }
  };

  const getRandomPosition = (rect) => {
    const padding = 18;
    const rangeX = Math.max(0, rect.width - padding * 2 - 44);
    const rangeY = Math.max(0, rect.height - padding * 2 - 44);
    return {
      x: padding + Math.random() * rangeX,
      y: padding + Math.random() * rangeY,
    };
  };

  const resetBubbles = () => {
    bubbles.forEach((bubble) => {
      bubble.style.transform = `translate(0, 0) scale(${currentScale})`;
      bubble.style.opacity = `${currentOpacity}`;
    });
  };

  const layoutBubbles = () => {
    const rect = releaseField.getBoundingClientRect();
    bubbles.forEach((bubble, index) => {
      const position = getRandomPosition(rect);
      basePositions[index] = position;
      bubble.style.left = `${position.x}px`;
      bubble.style.top = `${position.y}px`;
    });
    resetBubbles();
  };

  const updatePressure = (value) => {
    const numericValue = Number(value);
    const normalized = numericValue / 100;
    currentScale = 0.6 + normalized * 0.7;
    currentOpacity = 0.35 + normalized * 0.45;
    if (pressureStatus) {
      pressureStatus.textContent = `Current pressure: ${numericValue} / 100`;
    }
    resetBubbles();
  };

  const pushFromPoint = (x, y) => {
    bubbles.forEach((bubble, index) => {
      const base = basePositions[index];
      const centerX = base.x + 22;
      const centerY = base.y + 22;
      const dx = centerX - x;
      const dy = centerY - y;
      const distance = Math.max(Math.hypot(dx, dy), 20);
      const force = Math.min(90, 160 / distance);
      const moveX = (dx / distance) * force;
      const moveY = (dy / distance) * force;
      bubble.style.transform = `translate(${moveX}px, ${moveY}px) scale(${currentScale})`;
      bubble.style.opacity = `${Math.min(1, currentOpacity + 0.15)}`;
    });
  };

  const scatterBubbles = () => {
    const rect = releaseField.getBoundingClientRect();
    bubbles.forEach((bubble, index) => {
      const position = getRandomPosition(rect);
      basePositions[index] = position;
      bubble.style.left = `${position.x}px`;
      bubble.style.top = `${position.y}px`;
    });
    resetBubbles();
  };

  let pointerActive = false;

  releaseField.addEventListener("pointerdown", (event) => {
    pointerActive = true;
    releaseField.setPointerCapture(event.pointerId);
    const rect = releaseField.getBoundingClientRect();
    pushFromPoint(event.clientX - rect.left, event.clientY - rect.top);
  });

  releaseField.addEventListener("pointermove", (event) => {
    if (!pointerActive) return;
    const rect = releaseField.getBoundingClientRect();
    pushFromPoint(event.clientX - rect.left, event.clientY - rect.top);
  });

  releaseField.addEventListener("pointerup", () => {
    pointerActive = false;
    resetBubbles();
  });

  releaseField.addEventListener("pointercancel", () => {
    pointerActive = false;
    resetBubbles();
  });

  releaseField.addEventListener("pointerleave", () => {
    if (!pointerActive) {
      resetBubbles();
    }
  });

  scatterButton.addEventListener("click", scatterBubbles);
  pressureRange.addEventListener("input", (event) => updatePressure(event.target.value));

  createBubbles();
  updatePressure(pressureRange.value);
  layoutBubbles();
  window.addEventListener("resize", layoutBubbles);
}

const groundingButtons = document.querySelectorAll("[data-ground-step]");
const groundingStatus = document.getElementById("groundingStatus");
const resetGroundingButton = document.getElementById("resetGrounding");
const completedGroundingSteps = new Set();

const updateGroundingStatus = () => {
  if (!groundingStatus) return;
  const completedCount = completedGroundingSteps.size;
  groundingButtons.forEach((button) => {
    const step = button.dataset.groundStep;
    const isDone = completedGroundingSteps.has(step);
    button.classList.toggle("is-done", isDone);
    button.setAttribute("aria-pressed", String(isDone));
  });

  if (completedCount === groundingButtons.length && groundingButtons.length > 0) {
    groundingStatus.textContent = "Completed 5 / 5. Pause for a moment and notice whether your body feels a little more present.";
    return;
  }

  groundingStatus.textContent = `Completed ${completedCount} / ${groundingButtons.length}. Start with the easiest step.`;
};

groundingButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const step = button.dataset.groundStep;
    if (!step) return;
    if (completedGroundingSteps.has(step)) {
      completedGroundingSteps.delete(step);
    } else {
      completedGroundingSteps.add(step);
    }
    updateGroundingStatus();
  });
});

if (resetGroundingButton) {
  resetGroundingButton.addEventListener("click", () => {
    completedGroundingSteps.clear();
    updateGroundingStatus();
  });
}

updateGroundingStatus();

const emotionButtons = document.querySelectorAll("[data-emotion]");
const emotionRange = document.getElementById("emotionRange");
const emotionLevel = document.getElementById("emotionLevel");
const emotionResult = document.getElementById("emotionResult");
const emotionSummary = emotionResult?.querySelector(".insight-summary");
const emotionAdviceList = emotionResult?.querySelector(".advice-list");

const emotionMessages = {
  anxious: {
    label: "Anxious",
    low: {
      summary: "You have already noticed some tension in your body. That is a useful first step.",
      advice: ["Lengthen one exhale before deciding what comes next.", "Stay with the nearest task instead of thinking through the whole outcome."],
    },
    medium: {
      summary: "Acknowledge that you feel tense right now, then shrink the next action.",
      advice: ["Let your shoulders drop once, then exhale slowly.", "Handle only the nearest step instead of the whole sequence."],
    },
    high: {
      summary: "Right now, stabilizing your body matters more than forcing yourself into performance mode.",
      advice: ["Pause for 30 seconds and touch the desk or chair beneath you.", "Reduce the task to “open the material and stop there.”"],
    },
  },
  irritated: {
    label: "Irritated",
    low: {
      summary: "You do not have to crush that irritation. Start by giving it a little space.",
      advice: ["Relax your hands, then breathe out more slowly.", "Choose one action that will not get you stuck, like turning the page."],
    },
    medium: {
      summary: "Irritation often means you are overloaded. Lowering stimulation can help more than pushing harder.",
      advice: ["Look away from the screen for 10 seconds.", "Clear one thing from your space that feels especially noisy."],
    },
    high: {
      summary: "It is more important to stop being pushed forward by that feeling than to hide it perfectly.",
      advice: ["Pause what you are doing and squeeze then release both hands.", "Step half a pace away from the task and keep only one tiny entry point."],
    },
  },
  hurt: {
    label: "Hurt",
    low: {
      summary: "You are already noticing that something feels tender. That is not an overreaction.",
      advice: ["Place a hand on your chest or arm for a moment.", "Do not rush to explain yourself before you soften the moment a little."],
    },
    medium: {
      summary: "Let yourself admit that this feels painful before deciding whether to keep going.",
      advice: ["Try saying, “This hurts right now, and I am still here.”", "Reduce the task to something that requires beginning, not performing."],
    },
    high: {
      summary: "Protecting yourself matters more than proving you are fine.",
      advice: ["Fix your eyes on one steady point until your breathing settles a little.", "If it helps, use the help-request module below to borrow support."],
    },
  },
  tired: {
    label: "Tired",
    low: {
      summary: "Your body is already asking for a slower pace. Working with that is more realistic than fighting it.",
      advice: ["Stretch your neck or shoulders once, then return.", "Choose one low-effort action to begin with."],
    },
    medium: {
      summary: "This level of tiredness usually responds better to low-energy actions than to willpower.",
      advice: ["Take a sip of water or change your sitting position.", "Shift the task to organizing or highlighting instead of jumping into the hardest part."],
    },
    high: {
      summary: "When tiredness is strong, recovering a little is more realistic than chasing efficiency.",
      advice: ["Close or lower your eyes for 20 seconds before deciding the next step.", "If you must continue, use only the 3-minute version of the task."],
    },
  },
  numb: {
    label: "Numb",
    low: {
      summary: "Feeling blank for a while is allowed. You do not have to force yourself to feel something immediately.",
      advice: ["Name 3 things you can see so your mind has somewhere to land.", "Choose one mechanical action, such as opening your notes."],
    },
    medium: {
      summary: "Blankness can be a protective response after overload. Try giving yourself one simple instruction.",
      advice: ["Describe what is in front of you without asking yourself to understand it yet.", "Do one small organizing action that does not require much thought."],
    },
    high: {
      summary: "If your mind feels empty, return to your body and surroundings before pushing study again.",
      advice: ["Try one round of grounding, even if you only do the first two steps.", "Reduce the task to “sit here and look at the material for 30 seconds.”"],
    },
  },
};

const getIntensityBand = (value) => {
  if (value <= 33) return "low";
  if (value <= 66) return "medium";
  return "high";
};

const getIntensityLabel = (value) => {
  if (value <= 20) return "Very light";
  if (value <= 40) return "Low";
  if (value <= 66) return "Medium";
  if (value <= 85) return "High";
  return "Very high";
};

let activeEmotion = "anxious";

const renderEmotionAdvice = (items) => {
  if (!emotionAdviceList) return;
  emotionAdviceList.innerHTML = "";
  items.forEach((item) => {
    const listItem = document.createElement("li");
    listItem.textContent = item;
    emotionAdviceList.appendChild(listItem);
  });
};

const updateEmotionModule = () => {
  if (!emotionRange || !emotionLevel || !emotionSummary) return;
  const intensity = Number(emotionRange.value);
  const band = getIntensityBand(intensity);
  const copy = emotionMessages[activeEmotion][band];

  emotionButtons.forEach((button) => {
    const isActive = button.dataset.emotion === activeEmotion;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  emotionLevel.textContent = `Current intensity: ${intensity} / 100 · ${getIntensityLabel(intensity)}`;
  emotionSummary.textContent = copy.summary;
  renderEmotionAdvice(copy.advice);
};

emotionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeEmotion = button.dataset.emotion || "anxious";
    updateEmotionModule();
  });
});

if (emotionRange) {
  emotionRange.addEventListener("input", updateEmotionModule);
}

updateEmotionModule();

const worryInput = document.getElementById("worryInput");
const addWorryButton = document.getElementById("addWorryButton");
const clearWorriesButton = document.getElementById("clearWorriesButton");
const worryStatus = document.getElementById("worryStatus");
const worryList = document.getElementById("worryList");
const worries = [];
const maxWorries = 6;

const renderWorries = () => {
  if (!worryList || !clearWorriesButton) return;
  worryList.innerHTML = "";

  if (worries.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent = "There is nothing parked here right now. You can also leave it empty and simply rest.";
    worryList.appendChild(emptyState);
  } else {
    worries.forEach((worry, index) => {
      const card = document.createElement("article");
      card.className = "worry-card";

      const header = document.createElement("div");
      header.className = "worry-card-header";

      const content = document.createElement("p");
      content.textContent = worry;

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "worry-card-remove";
      removeButton.dataset.removeWorry = String(index);
      removeButton.textContent = "Remove";

      header.appendChild(content);
      header.appendChild(removeButton);
      card.appendChild(header);
      worryList.appendChild(card);
    });
  }

  clearWorriesButton.disabled = worries.length === 0;
};

const updateWorryStatus = (message) => {
  if (worryStatus) {
    worryStatus.textContent = message;
  }
};

if (addWorryButton && worryInput) {
  addWorryButton.addEventListener("click", () => {
    const value = worryInput.value.trim();

    if (!value) {
      updateWorryStatus("There is nothing written yet. You can also leave it blank and use a different module.");
      return;
    }

    if (worries.length >= maxWorries) {
      updateWorryStatus("The board is full. Remove one item first if you want to add another.");
      return;
    }

    worries.unshift(value);
    worryInput.value = "";
    renderWorries();
    updateWorryStatus(`Stored ${worries.length} / ${maxWorries} items. Once it is written down, you do not have to hold it so tightly.`);
  });
}

if (clearWorriesButton) {
  clearWorriesButton.addEventListener("click", () => {
    worries.length = 0;
    renderWorries();
    updateWorryStatus("The board is clear. Nothing here is saved after you leave the page.");
  });
}

if (worryList) {
  worryList.addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-remove-worry]");
    if (!(removeButton instanceof HTMLElement)) return;
    const index = Number(removeButton.dataset.removeWorry);
    if (Number.isNaN(index)) return;
    worries.splice(index, 1);
    renderWorries();
    updateWorryStatus(
      worries.length === 0
        ? "That thought has been moved aside. Let your mind hold a little less for now."
        : `${worries.length} parked item${worries.length === 1 ? "" : "s"} left.`
    );
  });
}

renderWorries();

const contactButtons = document.querySelectorAll("[data-contact]");
const needButtons = document.querySelectorAll("[data-need]");
const supportOutput = document.getElementById("supportOutput");
const copySupportButton = document.getElementById("copySupportButton");
const supportStatus = document.getElementById("supportStatus");

const supportMessages = {
  teacher: {
    pause: "I am feeling tense right now and need a short pause before I continue. Would that be okay?",
    listen: "I am feeling overloaded right now. Could I have a little time to explain where I am stuck?",
    "first-step": "My mind feels scattered right now. Could you help me find the very first step?",
  },
  classmate: {
    pause: "I am getting overwhelmed right now and need a short pause. Could you stay with me for a moment?",
    listen: "My mind feels messy right now. Could you listen for a minute? I do not need advice right away.",
    "first-step": "I am really stuck right now. Could you help me find the smallest first step?",
  },
  family: {
    pause: "I am feeling overloaded right now and need a short pause. Could you give me a little room first?",
    listen: "I am having a hard moment right now. Could you listen first without trying to fix it immediately?",
    "first-step": "My mind feels scattered right now. Could you help me break this into the first small step?",
  },
};

let activeContact = "teacher";
let activeNeed = "pause";

const updateSupportModule = () => {
  const message = supportMessages[activeContact][activeNeed];

  contactButtons.forEach((button) => {
    const isActive = button.dataset.contact === activeContact;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  needButtons.forEach((button) => {
    const isActive = button.dataset.need === activeNeed;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  if (supportOutput) {
    supportOutput.value = message;
  }

  if (copySupportButton) {
    copySupportButton.disabled = false;
  }

  if (supportStatus) {
    supportStatus.textContent = "The line is ready. You can copy it or adjust the wording to sound more like you.";
  }
};

contactButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeContact = button.dataset.contact || "teacher";
    updateSupportModule();
  });
});

needButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeNeed = button.dataset.need || "pause";
    updateSupportModule();
  });
});

if (copySupportButton && supportOutput && supportStatus) {
  copySupportButton.addEventListener("click", async () => {
    const message = supportOutput.value.trim();
    if (!message) return;

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }
      await navigator.clipboard.writeText(message);
      supportStatus.textContent = "Copied. You can send it as is or adjust the tone before you do.";
    } catch (error) {
      supportOutput.focus();
      supportOutput.select();
      supportOutput.setSelectionRange(0, supportOutput.value.length);
      supportStatus.textContent = "Auto-copy is unavailable. The text is selected so you can copy it manually.";
    }
  });
}

updateSupportModule();

const taskTypeButtons = document.querySelectorAll("[data-task-type]");
const taskMinuteButtons = document.querySelectorAll("[data-task-minutes]");
const generateTaskButton = document.getElementById("generateTaskButton");
const microTaskOutput = document.getElementById("microTaskOutput");
const taskStatus = document.getElementById("taskStatus");
const taskTimerDisplay = document.getElementById("taskTimerDisplay");
const startTaskTimerButton = document.getElementById("startTaskTimer");
const pauseTaskTimerButton = document.getElementById("pauseTaskTimer");
const resetTaskTimerButton = document.getElementById("resetTaskTimer");

const microTaskMessages = {
  read: {
    3: "Read only the most important sentence on this page and mark it.",
    5: "Read the whole prompt once and only mark the keywords. Do not solve it yet.",
    10: "Separate the prompt from the given information and list the parts you already understand.",
  },
  organize: {
    3: "Gather only the 3 materials you need right now and leave everything else alone.",
    5: "Bring together only the files or tools directly related to this task.",
    10: "Sort what is in front of you into “need now” and “can wait” without trying to finish organizing everything.",
  },
  write: {
    3: "Write only the first sentence. It does not need to be polished yet.",
    5: "Write one opening sentence and add one point you feel most certain about.",
    10: "Write the core sentence of the first paragraph, then add two supporting words or short phrases.",
  },
  "first-problem": {
    3: "Look only at the first part and write down the first condition you know.",
    5: "Do only the first step of the first part. You do not need to finish it in one go.",
    10: "Split the first part into two steps and attempt only the first one.",
  },
};

let selectedTaskType = "read";
let selectedTaskMinutes = 5;
let generatedTaskMinutes = 5;
let taskGenerated = false;
let remainingSeconds = generatedTaskMinutes * 60;
let taskTimer = null;

const formatTime = (seconds) => {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${secs}`;
};

const updateTaskSelectionState = () => {
  taskTypeButtons.forEach((button) => {
    const isActive = button.dataset.taskType === selectedTaskType;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  taskMinuteButtons.forEach((button) => {
    const isActive = Number(button.dataset.taskMinutes) === selectedTaskMinutes;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  if (!taskGenerated && taskTimerDisplay) {
    taskTimerDisplay.textContent = formatTime(selectedTaskMinutes * 60);
  }
};

const stopTaskTimer = () => {
  if (taskTimer) {
    clearInterval(taskTimer);
    taskTimer = null;
  }
};

const updateTaskTimerButtons = ({ startDisabled, pauseDisabled, resetDisabled }) => {
  if (startTaskTimerButton) startTaskTimerButton.disabled = startDisabled;
  if (pauseTaskTimerButton) pauseTaskTimerButton.disabled = pauseDisabled;
  if (resetTaskTimerButton) resetTaskTimerButton.disabled = resetDisabled;
};

const setTaskStatus = (message) => {
  if (taskStatus) {
    taskStatus.textContent = message;
  }
};

const refreshTaskTimerDisplay = () => {
  if (taskTimerDisplay) {
    taskTimerDisplay.textContent = formatTime(remainingSeconds);
  }
};

const generateMicroTask = () => {
  const message = microTaskMessages[selectedTaskType][selectedTaskMinutes];
  generatedTaskMinutes = selectedTaskMinutes;
  remainingSeconds = generatedTaskMinutes * 60;
  taskGenerated = true;
  stopTaskTimer();
  refreshTaskTimerDisplay();

  if (microTaskOutput) {
    microTaskOutput.textContent = message;
  }

  updateTaskTimerButtons({
    startDisabled: false,
    pauseDisabled: true,
    resetDisabled: false,
  });
  setTaskStatus(`Generated a ${generatedTaskMinutes}-minute tiny step. Start the timer only when you are ready.`);
};

taskTypeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedTaskType = button.dataset.taskType || "read";
    updateTaskSelectionState();
  });
});

taskMinuteButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedTaskMinutes = Number(button.dataset.taskMinutes) || 5;
    updateTaskSelectionState();
  });
});

if (generateTaskButton) {
  generateTaskButton.addEventListener("click", generateMicroTask);
}

if (startTaskTimerButton) {
  startTaskTimerButton.addEventListener("click", () => {
    if (!taskGenerated || taskTimer || remainingSeconds <= 0) return;

    updateTaskTimerButtons({
      startDisabled: true,
      pauseDisabled: false,
      resetDisabled: false,
    });
    setTaskStatus("The timer has started. You only need to do this one small step.");

    taskTimer = window.setInterval(() => {
      remainingSeconds -= 1;
      refreshTaskTimerDisplay();

      if (remainingSeconds <= 0) {
        remainingSeconds = 0;
        refreshTaskTimerDisplay();
        stopTaskTimer();
        updateTaskTimerButtons({
          startDisabled: true,
          pauseDisabled: true,
          resetDisabled: false,
        });
        setTaskStatus("Time is up. You finished this small block and can pause before choosing the next step.");
      }
    }, 1000);
  });
}

if (pauseTaskTimerButton) {
  pauseTaskTimerButton.addEventListener("click", () => {
    if (!taskGenerated) return;
    stopTaskTimer();
    updateTaskTimerButtons({
      startDisabled: remainingSeconds <= 0,
      pauseDisabled: true,
      resetDisabled: false,
    });
    setTaskStatus("The timer is paused. You can continue, or you can rest first.");
  });
}

if (resetTaskTimerButton) {
  resetTaskTimerButton.addEventListener("click", () => {
    if (!taskGenerated) return;
    stopTaskTimer();
    remainingSeconds = generatedTaskMinutes * 60;
    refreshTaskTimerDisplay();
    updateTaskTimerButtons({
      startDisabled: false,
      pauseDisabled: true,
      resetDisabled: false,
    });
    setTaskStatus("The timer has been reset. Start again only when you are ready.");
  });
}

updateTaskSelectionState();
refreshTaskTimerDisplay();

const returnButtons = document.querySelectorAll("[data-return]");
const transitionMessage = document.getElementById("transitionMessage");
const returnMessages = {
  ready: "You can return through one small study action, such as reading the prompt or organizing materials, instead of restoring everything at once.",
  more: "It is okay to stay here a little longer. Coming back when your body feels steadier is still a valid pace.",
};

returnButtons.forEach((button) => {
  button.addEventListener("click", () => {
    returnButtons.forEach((item) => {
      const isActive = item === button;
      item.classList.toggle("active", isActive);
      item.setAttribute("aria-pressed", String(isActive));
    });

    if (transitionMessage) {
      const key = button.dataset.return;
      transitionMessage.textContent = returnMessages[key] || returnMessages.ready;
    }
  });
});

if (!prefersReducedMotion) {
  const revealElements = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  revealElements.forEach((element) => observer.observe(element));
} else {
  document.querySelectorAll(".reveal").forEach((element) => {
    element.classList.add("is-visible");
  });
}
