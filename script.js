let questions = [];

function generateMCQs() {
  const fileInput = document.getElementById('noteInput');
  const file = fileInput.files[0];
  if (!file) {
    alert('Please upload a file first.');
    return;
  }

  const reader = new FileReader();
  reader.onload = async function(event) {
    const text = event.target.result;
    const mcqs = await fetchMCQsFromAPI(text);
    questions = mcqs;
    displayQuiz();
  };
  reader.readAsText(file);
}

async function fetchMCQsFromAPI(text) {
  const response = await fetch('https://api.openai.com/v1/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer YOUR_OPENAI_API_KEY`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      prompt: `Generate 5 multiple-choice questions with answers from the following text:\n\n${text}`,
      max_tokens: 500
    })
  });
  const data = await response.json();
  return data.choices[0].text.split('\n').map(q => {
    const parts = q.split('|');
    return {
      question: parts[0].trim(),
      options: parts.slice(1, 5).map(opt => opt.trim()),
      answer: parts[5].trim()
    };
  });
}

function displayQuiz() {
  const quizForm = document.getElementById('quizForm');
  quizForm.innerHTML = '';
  questions.forEach((q, index) => {
    const div = document.createElement('div');
    div.classList.add('question');
    div.innerHTML = `<p>${index + 1}. ${q.question}</p>` +
      q.options.map((opt, i) => `
        <label>
          <input type="radio" name="q${index}" value="${opt}"> ${opt}
        </label><br>
      `).join('');
    quizForm.appendChild(div);
  });
  document.getElementById('quiz').style.display = 'block';
}

function submitQuiz() {
  let score = 0;
  questions.forEach((q, index) => {
    const selected = document.querySelector(`input[name="q${index}"]:checked`);
    if (selected && selected.value === q.answer) {
      score++;
    }
  });
  document.getElementById('score').innerText = `You scored ${score} out of ${questions.length}`;
  displayProgressChart(score);
  saveScore(score);
  document.getElementById('result').style.display = 'block';
}

function displayProgressChart(score) {
  const ctx = document.getElementById('progressChart').getContext('2d');
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Correct', 'Incorrect'],
      datasets: [{
        data: [score, questions.length - score],
        backgroundColor: ['#28a745', '#dc3545']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

function saveScore(score) {
  const scores = JSON.parse(localStorage.getItem('quizScores')) || [];
  scores.push(score);
  localStorage.setItem('quizScores', JSON.stringify(scores));
}
