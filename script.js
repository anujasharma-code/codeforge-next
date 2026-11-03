
// ===== TUTORIAL DATABASE =====

const tutorialCourses = [
  {
    name: "C Programming",
    icon: "💻",
    category: "Programming",
    description: "Learn variables, loops, functions, arrays and pointers.",
    hindi: "CodeWithHarry C programming full course Hindi",
    english: "freeCodeCamp C programming full course beginners"
  },
  {
    name: "C++ Programming",
    icon: "⚙️",
    category: "Programming",
    description: "Learn C++, OOP, classes, objects and STL.",
    hindi: "CodeWithHarry C++ full course Hindi",
    english: "freeCodeCamp C++ programming full course"
  },
  {
    name: "Java Programming",
    icon: "☕",
    category: "Programming",
    description: "Learn Java basics, OOP, collections and exceptions.",
    hindi: "Apna College Java full course Hindi",
    english: "freeCodeCamp Java programming full course"
  },
  {
    name: "Python",
    icon: "🐍",
    category: "Programming",
    description: "Start Python programming and build beginner projects.",
    hindi: "CodeWithHarry Python full course Hindi",
    english: "freeCodeCamp Python full course beginners"
  },
  {
    name: "DSA",
    icon: "🧠",
    category: "Programming",
    description: "Learn arrays, linked lists, trees, graphs and algorithms.",
    hindi: "Apna College DSA full course Hindi",
    english: "freeCodeCamp data structures algorithms full course"
  },
  {
    name: "HTML & CSS",
    icon: "🎨",
    category: "Web Development",
    description: "Build responsive websites from scratch.",
    hindi: "CodeWithHarry HTML CSS full course Hindi",
    english: "freeCodeCamp HTML CSS full course"
  },
  {
    name: "JavaScript",
    icon: "⚡",
    category: "Web Development",
    description: "Learn functions, DOM, events and interactive websites.",
    hindi: "CodeWithHarry JavaScript full course Hindi",
    english: "freeCodeCamp JavaScript full course beginners"
  },
  {
    name: "React.js",
    icon: "⚛️",
    category: "Web Development",
    description: "Build modern interfaces using React components and hooks.",
    hindi: "React JS full course Hindi beginners",
    english: "freeCodeCamp React JS full course"
  },
  {
    name: "Node.js",
    icon: "🖥️",
    category: "Web Development",
    description: "Learn backend development, Express and REST APIs.",
    hindi: "Chai aur Code Node.js backend Hindi",
    english: "freeCodeCamp Node.js Express full course"
  },
  {
    name: "PHP",
    icon: "🐘",
    category: "Web Development",
    description: "Create dynamic websites using PHP and forms.",
    hindi: "CodeWithHarry PHP full course Hindi",
    english: "freeCodeCamp PHP full course"
  },
  {
    name: "SQL",
    icon: "🗄️",
    category: "Database",
    description: "Learn queries, joins, grouping and database fundamentals.",
    hindi: "CodeWithHarry SQL full course Hindi",
    english: "freeCodeCamp SQL full course beginners"
  },
  {
    name: "UI/UX Design",
    icon: "🖌️",
    category: "Design",
    description: "Learn user research, wireframes, layouts and prototypes.",
    hindi: "UI UX design complete course Hindi beginners",
    english: "UI UX design full course beginners English"
  },
  {
    name: "Figma",
    icon: "🧩",
    category: "Design",
    description: "Design interfaces, components and interactive prototypes.",
    hindi: "Figma complete tutorial Hindi beginners",
    english: "Figma official beginner tutorial"
  },
  {
    name: "AI & Machine Learning",
    icon: "🤖",
    category: "AI & Data",
    description: "Explore machine learning, Python and AI fundamentals.",
    hindi: "CampusX machine learning course Hindi",
    english: "freeCodeCamp machine learning full course"
  },
  {
    name: "Data Analytics",
    icon: "📊",
    category: "AI & Data",
    description: "Learn data analysis, SQL, spreadsheets and dashboards.",
    hindi: "Codebasics data analytics Hindi course",
    english: "Alex The Analyst data analyst full course"
  },
  {
    name: "Git & GitHub",
    icon: "🌿",
    category: "Tools",
    description: "Track code changes and collaborate on projects.",
    hindi: "CodeWithHarry Git GitHub tutorial Hindi",
    english: "freeCodeCamp Git and GitHub full course"
  },
  {
    name: "Cybersecurity",
    icon: "🔐",
    category: "Programming",
    description: "Learn networking, security fundamentals and safe practices.",
    hindi: "Cybersecurity fundamentals course Hindi beginners",
    english: "freeCodeCamp cybersecurity full course beginners"
  },
  {
    name: "Computer Networks",
    icon: "🌐",
    category: "Programming",
    description: "Understand IP, DNS, HTTP, TCP/IP and networking basics.",
    hindi: "Computer networks full course Hindi",
    english: "Computer networking full course English beginners"
  }
];


// ===== ELEMENTS =====

const tutorialGrid = document.getElementById("tutorialGrid");
const tutorialSearch = document.getElementById("tutorialSearch");
const noTutorials = document.getElementById("noTutorials");
const filterButtons = document.querySelectorAll(".filter-btn");

let activeCategory = "All";
let searchQuery = "";


// ===== YOUTUBE SEARCH URL =====

function createYouTubeURL(query) {
  return "https://www.youtube.com/results?search_query=" +
    encodeURIComponent(query);
}


// ===== CREATE ONE TUTORIAL CARD =====

function createTutorialCard(course) {
  const card = document.createElement("article");
  card.className = "tutorial-card";

  const top = document.createElement("div");
  top.className = "tutorial-card-top";

  const icon = document.createElement("div");
  icon.className = "tutorial-icon";
  icon.textContent = course.icon;

  const category = document.createElement("span");
  category.className = "tutorial-category";
  category.textContent = course.category;

  top.append(icon, category);

  const title = document.createElement("h3");
  title.textContent = course.name;

  const description = document.createElement("p");
  description.textContent = course.description;

  const label = document.createElement("div");
  label.className = "language-label";
  label.textContent = "CHOOSE YOUR LANGUAGE";

  const buttons = document.createElement("div");
  buttons.className = "language-buttons";

  const hindiButton = document.createElement("a");
  hindiButton.className = "language-btn hindi-btn";
  hindiButton.href = createYouTubeURL(course.hindi);
  hindiButton.target = "_blank";
  hindiButton.rel = "noopener noreferrer";
  hindiButton.textContent = "🇮🇳 Hindi ↗";

  const englishButton = document.createElement("a");
  englishButton.className = "language-btn english-btn";
  englishButton.href = createYouTubeURL(course.english);
  englishButton.target = "_blank";
  englishButton.rel = "noopener noreferrer";
  englishButton.textContent = "🌎 English ↗";

  buttons.append(hindiButton, englishButton);

  card.append(top, title, description, label, buttons);

  return card;
}


// ===== DISPLAY AND FILTER TUTORIALS =====

function displayTutorials() {
  const filteredCourses = tutorialCourses.filter(course => {
    const matchesCategory =
      activeCategory === "All" ||
      course.category === activeCategory;

    const searchableContent = [
      course.name,
      course.category,
      course.description,
      course.hindi,
      course.english
    ].join(" ").toLowerCase();

    const matchesSearch =
      searchableContent.includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  tutorialGrid.replaceChildren();

  filteredCourses.forEach(course => {
    tutorialGrid.appendChild(createTutorialCard(course));
  });

  noTutorials.hidden = filteredCourses.length !== 0;
}


// ===== SEARCH EVENT =====

tutorialSearch.addEventListener("input", event => {
  searchQuery = event.target.value.trim();
  displayTutorials();
});


// ===== CATEGORY FILTER EVENTS =====

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.category;

    filterButtons.forEach(item => {
      const active = item === button;

      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });

    displayTutorials();
  });
});


// ===== INITIAL DISPLAY =====

displayTutorials();

