(() => {
  "use strict";

  const levels = {
    school: ["O Level", "IGCSE", "AS Level", "A Level", "University", "Postgraduate", "PhD / Research"],
    senior: ["AS Level", "A Level", "University", "Postgraduate", "PhD / Research"],
    language: ["O Level", "IGCSE", "AS Level", "A Level", "University", "Postgraduate"],
    university: ["University", "Postgraduate", "PhD / Research"],
    professional: ["University", "Postgraduate", "PhD / Research"]
  };
  const topics = {
    physics: ["Physical quantities and units", "Kinematics", "Dynamics", "Forces", "Density and pressure", "Work, energy and power", "Deformation of solids", "Waves", "Superposition", "Electricity", "D.C. circuits", "Particle physics", "Nuclear physics"],
    chemistry: ["Atomic structure", "Atoms, molecules and stoichiometry", "Chemical bonding", "States of matter", "Chemical energetics", "Electrochemistry", "Equilibria", "Reaction kinetics", "Periodicity", "Group 2", "Group 17", "Nitrogen compounds", "Organic chemistry", "Analytical techniques"],
    mathematics: ["Quadratics", "Functions", "Coordinate geometry", "Circular measure", "Trigonometry", "Differentiation", "Integration", "Sequences and series", "Vectors", "Probability", "Statistics", "Mechanics"],
    furtherMaths: ["Complex numbers", "Matrices and linear transformations", "Roots of polynomial equations", "Series and summations", "Polar coordinates", "Hyperbolic functions", "Differential equations", "Further vectors", "Groups and abstract algebra", "Further mechanics"],
    biology: ["Cell structure and organisation", "Biological molecules", "Enzymes", "Membranes and transport", "DNA and protein synthesis", "Genetics and inheritance", "Natural selection", "Gas exchange", "Homeostasis", "Ecosystems and conservation"],
    english: ["Reading for meaning", "Writing for audience and purpose", "Argument and persuasion", "Language and identity", "Spoken language", "Creative writing", "Critical reading", "Comparative texts"],
    literature: ["Poetry analysis", "Prose and narrative", "Drama and performance", "Character and voice", "Themes and context", "Literary movements", "Critical approaches", "Comparative literature"],
    urdu: ["Urdu script and Nastaliq", "Reading comprehension", "Vocabulary and idiom", "Grammar and sentence structure", "Essay and letter writing", "Urdu poetry and ghazal", "Prose and short stories", "Translation and expression"],
    computing: ["Algorithms and computational thinking", "Programming fundamentals", "Data representation", "Computer systems and architecture", "Operating systems", "Databases and SQL", "Networks and the internet", "Cybersecurity principles", "Software development", "Ethics and digital society"],
    data: ["Data collection and quality", "Exploratory data analysis", "Probability and distributions", "Statistical inference", "Data visualisation", "Machine learning foundations", "Data engineering and pipelines", "Responsible data practice"],
    ai: ["Search and problem solving", "Knowledge representation", "Machine learning", "Neural networks", "Natural language processing", "Computer vision", "AI evaluation and safety", "Ethics and responsible AI"],
    economics: ["Scarcity and opportunity cost", "Supply, demand and elasticity", "Market structures", "Market failure", "National income", "Inflation and unemployment", "Fiscal and monetary policy", "International trade", "Development and inequality"],
    business: ["Business purpose and stakeholders", "Business planning", "Marketing fundamentals", "Operations and quality", "People and leadership", "Finance and cash flow", "Business growth", "Strategy and competition", "Ethics and sustainability"],
    accounting: ["Accounting concepts and principles", "Double-entry bookkeeping", "Trial balances", "Financial statements", "Adjustments and accruals", "Cost accounting", "Budgeting and variance", "Cash flow and interpretation"],
    law: ["Legal systems and sources of law", "Constitutional principles", "Contract law", "Tort and civil liability", "Criminal law", "Evidence and procedure", "Human rights", "Legal research and argument"],
    media: ["Media language and representation", "Audience and interpretation", "Media industries", "News and journalism", "Advertising and persuasion", "Digital platforms", "Media regulation and ethics", "Production and analysis"],
    history: ["Working with historical evidence", "Chronology and causation", "Revolutions and reform", "Empires and encounters", "Conflict and diplomacy", "Social and cultural change", "Historical interpretation", "Researching the past"],
    geography: ["Maps and geospatial skills", "Physical landscapes", "Weather and climate", "Population and migration", "Cities and urban change", "Resources and development", "Hazards and resilience", "Global interconnections"],
    sociology: ["Sociological perspectives", "Culture and socialisation", "Research methods", "Families and relationships", "Education and inequality", "Class, gender and identity", "Power and institutions", "Social change"],
    psychology: ["Research methods and ethics", "Biological approaches", "Cognitive processes", "Learning and behaviour", "Development across the lifespan", "Social influence", "Mental health and wellbeing", "Individual differences"],
    philosophy: ["Logic and critical reasoning", "Knowledge and scepticism", "Ethics and moral theories", "Mind and consciousness", "Political philosophy", "Metaphysics and reality", "Philosophy of science", "Argument analysis"],
    politics: ["Political ideas and ideologies", "Constitutions and institutions", "Elections and representation", "Power and legitimacy", "Public policy", "Comparative government", "Political participation", "Rights and citizenship"],
    ir: ["International systems and order", "Diplomacy and negotiation", "Conflict and security", "International law and institutions", "Global political economy", "Human rights and humanitarian action", "Foreign policy analysis", "Global governance"],
    art: ["Drawing and observation", "Colour and composition", "Painting and mixed media", "Printmaking and process", "Art history and movements", "Visual research", "Portfolio development", "Critique and reflection"],
    music: ["Rhythm and metre", "Pitch, melody and harmony", "Music notation", "Listening and analysis", "Composition and arrangement", "Performance practice", "Music history and traditions", "Recording and production"],
    drama: ["Voice and movement", "Character and objectives", "Improvisation", "Script and text analysis", "Directing and staging", "Ensemble performance", "Theatre practitioners", "Lighting, sound and design"],
    environmental: ["Ecosystems and biodiversity", "Earth systems", "Climate change science", "Pollution and waste", "Natural resources", "Conservation and restoration", "Environmental policy", "Sustainability assessment"],
    engineering: ["Engineering design process", "Materials and properties", "Statics and mechanics", "Energy systems", "Circuits and control", "Modelling and simulation", "Manufacturing and testing", "Safety and sustainability"],
    statistics: ["Data collection and sampling", "Descriptive statistics", "Probability models", "Random variables", "Estimation and confidence intervals", "Hypothesis testing", "Regression and correlation", "Experimental design"],
    architecture: ["Architectural drawing and representation", "Form, space and proportion", "History of architecture", "Structures and materials", "Climate-responsive design", "Building systems", "Urban context", "Studio design project"],
    design: ["Design brief and user needs", "Research and ideation", "Sketching and visualisation", "Materials and making", "Prototyping and testing", "Product life cycle", "Inclusive design", "Evaluation and iteration"],
    physical: ["Movement and physical literacy", "Anatomy and physiology", "Training principles", "Fitness assessment", "Skill acquisition", "Sport psychology", "Nutrition and recovery", "Inclusion and wellbeing"],
    religion: ["Religious traditions and texts", "Belief, meaning and practice", "Ethics and moral questions", "Ritual and community", "Religion in society", "Worldviews and dialogue", "Interfaith understanding"],
    language: ["Listening and comprehension", "Speaking and conversation", "Reading authentic texts", "Writing for different purposes", "Grammar and sentence building", "Vocabulary and idiom", "Culture and society", "Translation and interpretation"],
    film: ["Film form and visual language", "Cinematography and lighting", "Editing and montage", "Sound and score", "Genre and authorship", "Film history and movements", "Production and screenplay", "Representation and audience"],
    photography: ["Exposure and camera controls", "Composition and framing", "Light and colour", "Portrait and documentary", "Image editing and workflow", "Photography history", "Ethics and representation", "Portfolio and sequencing"],
    communication: ["Communication models", "Interpersonal communication", "Rhetoric and persuasion", "Public speaking", "Organisational communication", "Digital communication", "Media and society", "Research and presentation"],
    anthropology: ["Culture and society", "Ethnographic methods", "Kinship and social organisation", "Language and meaning", "Power and identity", "Material culture", "Anthropological theory", "Research ethics"],
    archaeology: ["Archaeological methods", "Field survey and excavation", "Dating and chronology", "Artefacts and material culture", "Human origins and prehistory", "Heritage and conservation", "Archaeological interpretation", "Ethics and communities"],
    astronomy: ["The night sky and observation", "The solar system", "Stars and stellar evolution", "Galaxies and cosmology", "Light and spectroscopy", "Gravity and orbital motion", "Exoplanets", "Space science and instrumentation"],
    medicine: ["Anatomy and physiology", "Cellular and molecular medicine", "Clinical reasoning", "Pathology and disease", "Pharmacology", "Epidemiology and public health", "Evidence-based practice", "Medical ethics and communication"],
    nursing: ["Foundations of nursing practice", "Health assessment", "Person-centred care", "Pharmacology and safe medicines", "Clinical skills and decision-making", "Community and public health", "Evidence-based nursing", "Professional ethics"],
    dentistry: ["Oral anatomy and development", "Oral biology", "Dental materials", "Preventive dentistry", "Restorative practice", "Periodontology", "Patient assessment and care", "Professional ethics"],
    pharmacy: ["Pharmaceutical chemistry", "Pharmacology and therapeutics", "Pharmaceutics and formulation", "Clinical pharmacy", "Medicines safety", "Pharmacokinetics", "Public health and pharmacy", "Professional practice"],
    veterinary: ["Animal anatomy and physiology", "Comparative pathology", "Animal nutrition", "Veterinary pharmacology", "Diagnostic methods", "Animal health and welfare", "Population medicine", "Clinical practice and ethics"],
    agriculture: ["Soil science and fertility", "Crop science", "Animal production", "Plant health and protection", "Water and irrigation", "Agricultural systems", "Food security", "Sustainable agriculture"],
    finance: ["Financial statements and analysis", "Time value of money", "Investment principles", "Capital markets", "Risk and return", "Corporate finance", "Personal financial planning", "Ethics and regulation"],
    marketing: ["Customer needs and insight", "Market research", "Segmentation and positioning", "Brand strategy", "Product and pricing", "Digital and social marketing", "Campaign planning", "Measurement and analytics"],
    entrepreneurship: ["Problem discovery", "Value proposition and business models", "Customer validation", "Prototyping and iteration", "Funding and financial planning", "Go-to-market strategy", "Team and leadership", "Impact and responsible growth"],
    management: ["Management foundations", "Organisational behaviour", "Leadership and teams", "Operations management", "Strategy and decision-making", "Human resource management", "Project management", "Ethics and change"],
    university: ["Disciplinary foundations and key debates", "Core concepts, theories and methods", "Module 1: principles and applications", "Module 2: evidence, analysis and practice", "Advanced seminar: current scholarship", "Interdisciplinary perspectives", "Independent project and literature review", "Research methods, ethics and dissemination"],
    research: ["Research area: foundational literature", "Research area: current debates and gaps", "Advanced methods and study design", "Data, evidence and reproducibility", "Ethics, impact and responsible practice", "Critical synthesis and peer review", "Interdisciplinary research directions", "Thesis development and dissemination"]
  };

  const groups = [
    ["Physics", "physics", "school"], ["Chemistry", "chemistry", "school"],
    ["Mathematics", "mathematics", "school"], ["Further Mathematics", "furtherMaths", "senior"],
    ["Biology", "biology", "school"], ["English", "english", "school"],
    ["English Language", "english", "school"], ["English Literature", "literature", "school"],
    ["Urdu", "urdu", "language"], ["Computer Science", "computing", "school"],
    ["Information Technology (IT)", "computing", "school"], ["Economics", "economics", "school"],
    ["Business Studies", "business", "school"], ["Accounting", "accounting", "school"],
    ["Law", "law", "senior"], ["Media Studies", "media", "school"],
    ["History", "history", "school"], ["World History", "history", "school"],
    ["Geography", "geography", "school"], ["Sociology", "sociology", "senior"],
    ["Psychology", "psychology", "senior"], ["Philosophy", "philosophy", "senior"],
    ["Political Science", "politics", "senior"], ["International Relations", "ir", "senior"],
    ["Art", "art", "school"], ["Arts and Design", "design", "school"],
    ["Music", "music", "school"], ["Drama", "drama", "school"],
    ["Theatre Studies", "drama", "school"], ["Literature", "literature", "school"],
    ["Environmental Science", "environmental", "school"], ["Environmental Studies", "environmental", "school"],
    ["Engineering", "engineering", "senior"], ["Statistics", "statistics", "senior"],
    ["Architecture", "architecture", "senior"], ["Design Technology", "design", "school"],
    ["Physical Education", "physical", "school"], ["Religious Studies", "religion", "school"],
    ["Languages", "language", "language"], ["French", "language", "language"],
    ["Arabic", "language", "language"], ["Spanish", "language", "language"],
    ["German", "language", "language"], ["Film Studies", "film", "school"],
    ["Photography", "photography", "school"], ["Communication Studies", "communication", "senior"],
    ["Anthropology", "anthropology", "senior"], ["Archaeology", "archaeology", "senior"],
    ["Astronomy", "astronomy", "school"], ["Data Science", "data", "senior"],
    ["Artificial Intelligence", "ai", "senior"], ["Medicine", "medicine", "professional"],
    ["Nursing", "nursing", "professional"], ["Dentistry", "dentistry", "professional"],
    ["Pharmacy", "pharmacy", "professional"], ["Veterinary Science", "veterinary", "professional"],
    ["Agriculture", "agriculture", "school"], ["Computer Engineering", "engineering", "senior"],
    ["Electrical Engineering", "engineering", "senior"], ["Mechanical Engineering", "engineering", "senior"],
    ["Civil Engineering", "engineering", "senior"], ["Finance", "finance", "senior"],
    ["Marketing", "marketing", "senior"], ["Entrepreneurship", "entrepreneurship", "senior"],
    ["Management", "management", "senior"]
  ];
  const icons = {
    Physics: "⚛️", Chemistry: "🧪", Mathematics: "📐", "Further Mathematics": "📈", Biology: "🧬",
    English: "📚", "English Language": "✍️", "English Literature": "📖", Urdu: "📜",
    "Computer Science": "💻", "Information Technology (IT)": "🖥️", Economics: "📊",
    "Business Studies": "💼", Accounting: "🧾", Law: "⚖️", "Media Studies": "🎙️",
    History: "🏺", "World History": "🌍", Geography: "🗺️", Sociology: "👥", Psychology: "🧠",
    Philosophy: "💭", "Political Science": "🏛️", "International Relations": "🤝", Art: "🎨",
    "Arts and Design": "🖌️", Music: "🎼", Drama: "🎭", "Theatre Studies": "🎟️",
    Literature: "📚", "Environmental Science": "🌿", "Environmental Studies": "🌱",
    Engineering: "⚙️", Statistics: "📊", Architecture: "🏙️", "Design Technology": "📏",
    "Physical Education": "🏃", "Religious Studies": "🕊️", Languages: "🌐", French: "🥐",
    Arabic: "🪬", Spanish: "💃", German: "🏰", "Film Studies": "🎬", Photography: "📷",
    "Communication Studies": "💬", Anthropology: "🗿", Archaeology: "⛏️", Astronomy: "🔭",
    "Data Science": "📉", "Artificial Intelligence": "🤖", Medicine: "🩺", Nursing: "🩹",
    Dentistry: "🦷", Pharmacy: "💊", "Veterinary Science": "🐾", Agriculture: "🌾",
    "Computer Engineering": "🖱️", "Electrical Engineering": "🔌", "Mechanical Engineering": "🔩",
    "Civil Engineering": "🌉", Finance: "💰", Marketing: "📣", Entrepreneurship: "🚀", Management: "🗂️"
  };
  const levelTitles = {
    "O Level": "O Level", IGCSE: "IGCSE", "AS Level": "AS Level", "A Level": "A Level",
    University: "University", Postgraduate: "Postgraduate", "PhD / Research": "PhD / Research"
  };

  window.StudySpaceLibrary = {
    levels: levelTitles,
    subjects: groups.map(([name, category, levelSet]) => ({
      name, category, levels: levels[levelSet], emoji: icons[name] || "📘",
      topics: topics[category] || topics.university
    })),
    topicStyle: level => level === "PhD / Research" ? "Research area" : "Module"
  };
})();
