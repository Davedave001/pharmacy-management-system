const { execSync } = require('child_process');
const fs = require('fs');

// Date range: February 1, 2020 to September 30, 2020
const startDate = new Date('2020-02-01');
const endDate = new Date('2020-09-30');

// Generate dates with natural distribution
// Pattern: Sparse early (Feb-Mar), Moderate middle (Apr-Jun), High later (Jul-Sep)
function generateCommitDates() {
  const dates = [];
  const totalDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
  
  // Weight distribution: early months get fewer commits, later months get more
  const weights = {
    feb: 0.05,  // Very sparse
    mar: 0.08,  // Sparse
    apr: 0.12,  // Light
    may: 0.15,  // Moderate
    jun: 0.18,  // Moderate-high
    jul: 0.20,  // High
    aug: 0.15,  // High
    sep: 0.07   // Very high (last month)
  };
  
  // Generate dates for each month
  for (let month = 1; month <= 8; month++) {
    const monthStart = new Date(2020, month, 1);
    const monthEnd = new Date(2020, month + 1, 0);
    const daysInMonth = monthEnd.getDate();
    
    let monthKey;
    if (month === 1) monthKey = 'feb';
    else if (month === 2) monthKey = 'mar';
    else if (month === 3) monthKey = 'apr';
    else if (month === 4) monthKey = 'may';
    else if (month === 5) monthKey = 'jun';
    else if (month === 6) monthKey = 'jul';
    else if (month === 7) monthKey = 'aug';
    else if (month === 8) monthKey = 'sep';
    
    const weight = weights[monthKey];
    const commitsForMonth = Math.floor(170 * weight);
    
    // Distribute commits across days in the month
    for (let i = 0; i < commitsForMonth; i++) {
      const day = Math.floor(Math.random() * daysInMonth) + 1;
      const date = new Date(2020, month, day);
      
      // Prefer weekdays (Monday-Friday) with 70% probability
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        // Weekend - less likely, but still possible
        if (Math.random() > 0.3) {
          // Skip some weekends
          continue;
        }
      }
      
      // Random time between 8 AM and 10 PM
      const hour = 8 + Math.floor(Math.random() * 14);
      const minute = Math.floor(Math.random() * 60);
      const second = Math.floor(Math.random() * 60);
      
      date.setHours(hour, minute, second);
      
      dates.push(date);
    }
  }
  
  // Sort dates chronologically
  dates.sort((a, b) => a - b);
  
  // Ensure we have at least 170 commits
  while (dates.length < 170) {
    const randomDay = Math.floor(Math.random() * totalDays);
    const date = new Date(startDate);
    date.setDate(date.getDate() + randomDay);
    
    const hour = 8 + Math.floor(Math.random() * 14);
    const minute = Math.floor(Math.random() * 60);
    const second = Math.floor(Math.random() * 60);
    date.setHours(hour, minute, second);
    
    dates.push(date);
  }
  
  // Sort again after adding more
  dates.sort((a, b) => a - b);
  
  return dates.slice(0, 170); // Ensure exactly 170
}

// Commit messages that look natural
const commitMessages = [
  'Update dependencies',
  'Fix bug in authentication',
  'Add new feature',
  'Refactor code',
  'Update documentation',
  'Fix typo',
  'Improve error handling',
  'Add validation',
  'Update UI components',
  'Fix database query',
  'Add tests',
  'Update configuration',
  'Improve performance',
  'Add comments',
  'Fix styling',
  'Update API endpoints',
  'Add error messages',
  'Fix routing issue',
  'Update package.json',
  'Add new route',
  'Fix date formatting',
  'Update middleware',
  'Add logging',
  'Fix security issue',
  'Update dependencies',
  'Improve code structure',
  'Add helper functions',
  'Fix validation logic',
  'Update README',
  'Add environment variables',
  'Fix async/await issue',
  'Update database schema',
  'Add error boundaries',
  'Fix memory leak',
  'Update styles',
  'Add new component',
  'Fix CORS issue',
  'Update authentication',
  'Add pagination',
  'Fix sorting',
];

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function createCommit(date, message) {
  const dateStr = formatDate(date);
  
  // Set environment variables for this commit
  process.env.GIT_AUTHOR_DATE = dateStr;
  process.env.GIT_COMMITTER_DATE = dateStr;
  
  try {
    // Create an empty commit with the backdated timestamp
    execSync(`git commit --allow-empty -m "${message}"`, {
      env: {
        ...process.env,
        GIT_AUTHOR_DATE: dateStr,
        GIT_COMMITTER_DATE: dateStr
      },
      stdio: 'inherit'
    });
    
    console.log(`✓ Created commit: ${dateStr} - ${message}`);
  } catch (error) {
    console.error(`✗ Failed to create commit: ${dateStr} - ${message}`);
    console.error(error.message);
  }
}

// Main execution
console.log('Generating commit dates...');
const commitDates = generateCommitDates();
console.log(`Generated ${commitDates.length} commit dates`);

console.log('\nCreating backdated commits...');
console.log('This may take a few minutes...\n');

commitDates.forEach((date, index) => {
  const message = commitMessages[Math.floor(Math.random() * commitMessages.length)];
  createCommit(date, message);
  
  // Progress indicator
  if ((index + 1) % 20 === 0) {
    console.log(`Progress: ${index + 1}/${commitDates.length} commits created`);
  }
});

console.log(`\n✓ Successfully created ${commitDates.length} backdated commits!`);
console.log('You can now push to GitHub with: git push origin main');

