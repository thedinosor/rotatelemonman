const rotateImage = document.getElementById('rotate-image');
const scoreCounter = document.getElementById('score-counter');
const scorePerSecond = document.getElementById('score-per-second');
const currentLevel = document.getElementById('current-level');
const scoreNeeded = document.getElementById('score-needed');
const upgradeButton = document.getElementById('upgrade-button');
const stressLevelDisplay = document.getElementById('stress-level');
const warningMessage = document.getElementById('warning-message');

// Audio setup with reduced volume
const spinSound = new Audio('spin.mp3');
spinSound.volume = 0.5; // Set volume to half
spinSound.loop = true; // Ensure it loops until stopped

const explodeSound = new Audio('explotano.mp3'); // Add explosion sound

let score = 0;
let level = 1;
const scoreThresholds = [2000, 6000, 12000, 20000, 50000, 10000, 200000];
let rotation = 0;
let scoreGainedPerSecond = 0;
let lastScore = 0;
let lastTimeStamp = Date.now();
let stressLevel = 0;
let resetInterval = null;
let countdownInterval = null; // Store the interval ID for the countdown
let isSpinning = false; // Track if the image is currently spinning
let decreaseInterval = null; // Interval for stress level decrease
let baseImageSize = 200;

rotateImage.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const initialX = e.clientX;

    const onMouseMove = (e) => {
        const deltaX = e.clientX - initialX;
        rotation += deltaX * 0.05;
        rotateImage.style.transform = `rotate(${rotation}deg)`;
        score += Math.abs(deltaX * 0.01);
        scoreCounter.innerText = `Score: ${Math.floor(score)}`;
        if (score >= scoreThresholds[level - 1]) {
            upgradeButton.disabled = false;
        }

        // Start playing spin sound if not already playing
        if (!isSpinning) {
            spinSound.play();
            isSpinning = true;
        }

        // Reset stress level decrease interval if spinning
        if (resetInterval) {
            clearInterval(resetInterval);
            resetInterval = null;
        }
    };

    const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        // Stop the spin sound
        if (isSpinning) {
            spinSound.pause();
            spinSound.currentTime = 0; // Reset sound to start
            isSpinning = false;
        }

        // Start faster stress level decrease if not spinning
        if (!resetInterval) {
            resetInterval = setInterval(() => {
                stressLevel -= 1; // Decrease stress level by 1 unit

                if (stressLevel <= 0) {
                    clearInterval(resetInterval);
                    resetInterval = null;
                    stressLevel = 0;

                    // Reset image styles to original
                    updateImageStyle();

                    // Reset stress level display color to yellow
                    stressLevelDisplay.classList.remove('high-stress');
                } else {
                    updateImageStyle();
                }

                updateStressLevelDisplay();
            }, 100); // Adjust the interval time for faster decrease
        }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    // Clear stress level decrease interval on mouse down (if any)
    if (decreaseInterval) {
        clearInterval(decreaseInterval);
        decreaseInterval = null;
    }
});

function updateScorePerSecond() {
    const currentTimeStamp = Date.now();
    const deltaTime = (currentTimeStamp - lastTimeStamp) / 1000;
    scoreGainedPerSecond = (score - lastScore) / deltaTime;
    scorePerSecond.innerText = `Score per second: ${scoreGainedPerSecond.toFixed(2)}`;
    lastScore = score;
    lastTimeStamp = currentTimeStamp;

    const sensitivityFactor = 0.05;
    stressLevel += scoreGainedPerSecond * sensitivityFactor / 100;

    if (stressLevel > 10) stressLevel = 10;
    if (stressLevel < 0) stressLevel = 0;

    updateImageStyle();

    // Clear stress level decrease interval if it's running
    if (decreaseInterval) {
        clearInterval(decreaseInterval);
        decreaseInterval = null;
    }

    // Start stress level decrease interval if not spinning and stress level > 0
    if (!isSpinning && stressLevel > 0) {
        decreaseInterval = setInterval(() => {
            stressLevel -= 1;

            if (stressLevel <= 0) {
                clearInterval(decreaseInterval);
                decreaseInterval = null;
                stressLevel = 0;

                // Reset image styles to original
                updateImageStyle();

                // Reset stress level display color to yellow
                stressLevelDisplay.classList.remove('high-stress');
            } else {
                updateImageStyle();
            }

            updateStressLevelDisplay();
        }, 1500); // Decrease every 1.5 seconds
    }

    // Update stress level display and check for high stress warning
    updateStressLevelDisplay();

    // Check if stress level is above 7 for warning message
    if (stressLevel >= 7) {
        stressLevelDisplay.classList.add('high-stress'); // Apply red color
        warningMessage.style.display = 'block'; // Show warning message

        // Start self-destruct countdown if it's not already running
        if (!countdownInterval) {
            let countdown = 5;
            warningMessage.innerText = `Stress level too high! Self-destruction in ${countdown} seconds...`;

            countdownInterval = setInterval(() => {
                countdown--;

                if (countdown >= 0) {
                    warningMessage.innerText = `Stress level too high! Self-destruction in ${countdown} seconds...`;
                } else {
                    clearInterval(countdownInterval);
                    countdownInterval = null;
                    warningMessage.style.display = 'none'; // Hide warning message

                    // Play explosion sound
                    explodeSound.play();

                    // Display the mess message
                    alert("Look at the mess you've made :-[");

                    // Reset the game
                    resetGame();
                }
            }, 1000);
        }
    } else {
        // Clear the countdown if stress level drops below 7
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
            warningMessage.style.display = 'none'; // Hide warning message
        }
    }
}

setInterval(updateScorePerSecond, 200);

function updateStressLevelDisplay() {
    stressLevelDisplay.innerText = `Stress Level: ${Math.round(stressLevel)}`;
}

function updateImageStyle() {
    const maxSizeIncrease = 10000;
    let imageSize = baseImageSize;
    let hueRotateValue = 0;

    if (stressLevel >= 3) {
        // Adjust image size based on stress level
        imageSize += stressLevel * (maxSizeIncrease / 500); // Increase size proportionally

        // Adjust hue rotation based on stress level (gradual increase in redness)
        hueRotateValue = Math.min(60 + (stressLevel - 3) * 10, 120); 
    }

    // Apply styles based on stress level
    rotateImage.style.width = `${imageSize}px`;

    if (stressLevel >= 3) {
        rotateImage.style.filter = `brightness(100%) hue-rotate(${hueRotateValue}deg)`;
    } else {
        rotateImage.style.filter = 'none'; // Reset filter to default (no color modification)
    }
}

function resetGame() {
    score = 0;
    level = 1;
    rotation = 0;
    scoreCounter.innerText = `Score: ${score}`;
    currentLevel.innerText = `Level ${level}`;
    scoreNeeded.innerText = `Score needed: ${scoreThresholds[level - 1]}`;
    rotateImage.src = `images/level1.png`;
    rotateImage.style.transform = `rotate(${rotation}deg)`;
    rotateImage.style.width = `${baseImageSize}px`;
    rotateImage.style.filter = 'none';
    upgradeButton.disabled = true;
    stressLevel = 0;
    updateStressLevelDisplay();
    updateImageStyle();
}

updateStressLevelDisplay();

upgradeButton.addEventListener('click', () => {
    if (score >= scoreThresholds[level - 1]) {
        level++;
        if (level <= 7) {
            currentLevel.innerText = `Level ${level}`;
            scoreNeeded.innerText = `Score needed: ${scoreThresholds[level - 1] || 'N/A'}`;
            rotateImage.src = `images/level${level}.png`;
            upgradeButton.disabled = true;
        } else {
            currentLevel.innerText = `Game Over`;
            scoreNeeded.innerText = ``;
            rotateImage.src = `images/final.png`;
            upgradeButton.disabled = true;
            alert('You won the game!');
        }
    }
});
