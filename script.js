const awsconfig = {
  Auth: {
    region: 'us-east-1', // e.g., 'us-east-1'
    userPoolId: 'ap-south-1_nYjMAhrSo',
    userPoolWebClientId: '18mgfq7ouah0h4j9e2t97vp9at',
  }
};
aws_amplify.Amplify.configure(awsconfig);

const themeSelect = document.getElementById("theme-select");
const selectedTheme = localStorage.getItem("selectedTheme") || "fruits";
themeSelect.value = selectedTheme;

function getImageUrls(theme) {
  const themes = {
    fruits: [
      "https://aws-image-matching-game.s3.us-east-1.amazonaws.com/apple.jpg",
      "https://aws-image-matching-game.s3.us-east-1.amazonaws.com/banana.jpg",
      "https://aws-image-matching-game.s3.us-east-1.amazonaws.com/grapes.jpg",
      "https://aws-image-matching-game.s3.us-east-1.amazonaws.com/kiwi.jpg",
      "https://aws-image-matching-game.s3.us-east-1.amazonaws.com/melon.jpg",
      "https://aws-image-matching-game.s3.us-east-1.amazonaws.com/orange.jpg",
      "https://aws-image-matching-game.s3.us-east-1.amazonaws.com/papaya.jpg",
      "https://aws-image-matching-game.s3.us-east-1.amazonaws.com/pineapple.jpg"
    ],
    animals: [
      "https://aws-image-matching-game.s3.us-east-1.amazonaws.com/animals/bear.jpg",
      "https://aws-image-matching-game.s3.us-east-1.amazonaws.com/animals/cati.jpg",
      "https://aws-image-matching-game.s3.us-east-1.amazonaws.com/animals/cow.jpg",
      "https://aws-image-matching-game.s3.us-east-1.amazonaws.com/animals/horse.jpg",
      "https://aws-image-matching-game.s3.us-east-1.amazonaws.com/animals/lion.jpg",
      "https://aws-image-matching-game.s3.us-east-1.amazonaws.com/animals/monkey.jpg",
      "https://aws-image-matching-game.s3.us-east-1.amazonaws.com/animals/og.jpg",
      "https://aws-image-matching-game.s3.us-east-1.amazonaws.com/animals/tiger.jpg"
    ],
    memes: [
      "https://aws-image-matching-game.s3.us-east-1.amazonaws.com/memes/1.jpg",
      "https://aws-image-matching-game.s3.us-east-1.amazonaws.com/memes/2.jpg",
      "https://aws-image-matching-game.s3.us-east-1.amazonaws.com/memes/3.jpg",
      "https://aws-image-matching-game.s3.us-east-1.amazonaws.com/memes/4.jpg",
      "https://aws-image-matching-game.s3.us-east-1.amazonaws.com/memes/5.jpg",
      "https://aws-image-matching-game.s3.us-east-1.amazonaws.com/memes/6.jpg",
      "https://aws-image-matching-game.s3.us-east-1.amazonaws.com/memes/7.jpg",
      "https://aws-image-matching-game.s3.us-east-1.amazonaws.com/memes/8.jpg"
    ]
  };
  return themes[theme];
}

const imageUrls = getImageUrls(selectedTheme);
let cards = [...imageUrls, ...imageUrls].sort(() => 0.5 - Math.random());
const gameBoard = document.getElementById("game-board");

let firstCard = null;
let secondCard = null;
let lockBoard = false;
let matchedPairs = 0;
let moves = 0;
const movesElement = document.getElementById("moves");

let timer;
let time = 0;
const timerElement = document.getElementById("timer");

let highScore = localStorage.getItem("highScore_" + selectedTheme) || null;
const highScoreElement = document.getElementById("high-score");

const flipSound = new Audio("https://www.soundjay.com/button/sounds/button-16.mp3");

function startTimer() {
  timer = setInterval(() => {
    time++;
    timerElement.textContent = `Time: ${formatTime(time)}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timer);
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateHighScoreDisplay() {
  if (highScore) {
    highScoreElement.textContent = `Best Time: ${formatTime(highScore)}`;
  } else {
    highScoreElement.textContent = `Best Time: --:--`;
  }
}

function incrementMoves() {
  moves++;
  movesElement.textContent = `Moves: ${moves}`;
}

updateHighScoreDisplay();
const Auth = aws_amplify.Auth;
document.getElementById('signup-btn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    await Auth.signUp({ username: email, password });
    document.getElementById('auth-message').textContent = 'Check your email to confirm.';
  } catch (err) {
    document.getElementById('auth-message').textContent = err.message;
  }
});

document.getElementById('signin-btn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const user = await Auth.signIn(email, password);
    document.getElementById('auth-message').textContent = `Welcome, ${user.username}!`;
    // Optional: Hide login form, show game board
  } catch (err) {
    document.getElementById('auth-message').textContent = err.message;
  }
});
const user = await Auth.currentAuthenticatedUser();
const highScoreKey = `highScore_${selectedTheme}_${user.username}`;
localStorage.setItem(highScoreKey, time);

cards.forEach((url) => {
  const card = document.createElement("div");
  card.classList.add("card");

  const cardInner = document.createElement("div");
  cardInner.classList.add("card-inner");

  const front = document.createElement("div");
  front.classList.add("card-front");
  front.textContent = "🎴";

  const back = document.createElement("div");
  back.classList.add("card-back");
  const img = document.createElement("img");
  img.src = url;
  img.alt = "Card image";
  back.appendChild(img);

  cardInner.appendChild(front);
  cardInner.appendChild(back);
  card.appendChild(cardInner);
  card.dataset.url = url;

  card.addEventListener("click", () => {
    if (lockBoard || card.classList.contains("flipped") || firstCard === card) return;

    if (time === 0 && !timer) startTimer();

    flipSound.play();
    card.classList.add("flipped");

    if (!firstCard) {
      firstCard = card;
    } else {
      secondCard = card;
      incrementMoves();
      checkMatch();
    }
  });

  gameBoard.appendChild(card);
});

function checkMatch() {
  if (firstCard.dataset.url === secondCard.dataset.url) {
    matchedPairs++;
    resetTurn();

    if (matchedPairs === imageUrls.length) {
      stopTimer();

      if (!highScore || time < highScore) {
        highScore = time;
        localStorage.setItem("highScore_" + selectedTheme, highScore);
        updateHighScoreDisplay();
      }

      setTimeout(() => {
        alert(`🎉 Congratulations! You matched all cards in ${formatTime(time)} with ${moves} moves!`);
      }, 500);
    }
  } else {
    lockBoard = true;
    setTimeout(() => {
      firstCard.classList.remove("flipped");
      secondCard.classList.remove("flipped");
      resetTurn();
    }, 1000);
  }
}

function resetTurn() {
  [firstCard, secondCard] = [null, null];
  lockBoard = false;
}

document.getElementById("reset-btn").addEventListener("click", () => {
  location.reload();
});

themeSelect.addEventListener("change", () => {
  localStorage.setItem("selectedTheme", themeSelect.value);
  location.reload();
});

const coords = { x: 0, y: 0 };
const circles = document.querySelectorAll('.circle');
const colors = ["#ffc8c8", "#feb1bc", "#fc99b7", "#f680b7", "#e96abc", "#d45dbf", "#b857bc", "#9c54b3", "#8050a5", "#674b94", "#514580", "#3e3e6b"];

circles.forEach(function (circle, index) {
  circle.x = 0;
  circle.y = 0;
  circle.style.backgroundColor = colors[index % colors.length];
});

window.addEventListener('mousemove', function (e) {
  coords.x = e.clientX;
  coords.y = e.clientY;
});

function animateCircles() {
  let x = coords.x;
  let y = coords.y;
  circles.forEach(function (circle, index) {
    circle.style.left = x - 12 + 'px';
    circle.style.top = y - 12 + 'px';
    const scaleValue = (circles.length - index) / 30;
    circle.style.transform = `scale(${scaleValue})`;
    circle.x = x;
    circle.y = y;
    const nextCircle = circles[index + 1] || circles[0];
    x += (nextCircle.x - x) * 0.3;
    y += (nextCircle.y - y) * 0.3;
  });
  requestAnimationFrame(animateCircles);
}

animateCircles();