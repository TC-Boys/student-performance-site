let questions = [];

async function handleUpload() {
  const file = document.getElementById('noteInput').files[0];
  if (!file) return alert("Please upload a file.");

  const ext = file.name.split('.').pop().toLowerCase();
  let text = '';

  if (ext === 'txt') {
    text = await file.text();
  } else if (ext === 'pdf') {
    text = await extractTextFromPDF(file);
  } else {
    return alert("Upload a PDF or TXT file.");
  }

  // Generate real MCQs using OpenAI
  await generateMCQsFromText(text);
}

async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    text += pageText + '\n';
  }

  return text;
}

async function generateMCQsFromText(text) {
  const prompt = `Generate 5 multiple-choice questions based on the following content:\n\n${text}`;

  try {
    // Call OpenAI API to generate MCQs
    const response = await fetch('https://api.openai.com/v1/completions', {
      method: 'POST',
      headers: {
        'Authorization': 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, // Replace with your OpenAI API Key
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // Or 'gpt-4' depending on your subscription
        prompt: prompt,
        max_tokens: 500
      })
    });

    const data = await response.json();

    if (data.choices && data.choices[0].text) {
      // Parse the generated MCQs
      questions = parseGeneratedMCQs(data.choices[0].text);
      displayQuiz();
    } else {
      alert("Failed to generate MCQs.");
    }
  } catch (error) {
    console.error('Error:', error);
    alert('There was an issue generating the MCQs.');
  }
}

function parseGeneratedMCQs(text) {
  const mcqText = text.split('\n').filter(line => line.trim() !== '');
  const questions = [];

  mcqText.forEach((line, index) => {
    const parts = line.split('|');
    if (parts.length === 5) {
      questions.push({
        question: parts[0].trim(),
        options: parts.slice(1, 5).map(option => option.trim()),
        answer: parts[5].trim()
      });
    }
  });

  return questions;
}

function displayQuiz() {
  document.getElementById('quiz').style.display = 'block';
  const form = document.getElementById('quizForm');
  form.innerHTML = '';
  questions.forEach((q, index) => {
    const qBlock = document.createElement('div');
    qBlock.innerHTML = `<p>${index + 1}. ${q.question}</p>` +
      q.options.map(opt =>
        `<label><input type="radio" name="q${index}" value="${opt}"/> ${opt}</label><br>`
      ).join('');
    form.appendChild(qBlock);
  });
}

function submitQuiz() {
  let score = 0;
  questions.forEach((q, i) => {
    const selected = document.querySelector(`input[name="q${i}"]:checked`);
    if (selected && selected.value === q.answer) {
      score++;
    }
  });

  document.getElementById('score').innerText = `You scored ${score}/${questions.length}`;
  document.getElementById('result').style.display = 'block';
  drawChart(score);
  saveProgress(score);
}

function drawChart(score) {
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

function saveProgress(score) {
  const prevScores = JSON.parse(localStorage.getItem('scores')) || [];
  prevScores.push(score);
  localStorage.setItem('scores', JSON.stringify(prevScores));
}
