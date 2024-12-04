const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

// Default admin credentials
const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "password123",
};

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Upload configuration
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Serve static files and pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/enrollstudents", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "enrollstudents.html"));
});

app.get("/dashboard.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

app.get("/results", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "results.html"));
});

// API to get students
app.get("/api/students", (req, res) => {
  const studentsFilePath = path.join(__dirname, "students.json");
  fs.readFile(studentsFilePath, "utf8", (err, data) => {
    if (err) {
      if (err.code === "ENOENT") {
        return res.json([]);
      } else {
        return res.status(500).json({ error: "Error reading student data." });
      }
    }
    res.json(JSON.parse(data || "[]"));
  });
});

// API to add students
app.post("/api/students", upload.single("photo"), (req, res) => {
  const { firstName, lastName, studentClass, admissionNumber, house } = req.body;

  if (
    !firstName ||
    !lastName ||
    !studentClass ||
    !admissionNumber ||
    !house ||
    !req.file
  ) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const student = {
    id: Date.now(),
    firstName,
    lastName,
    studentClass,
    admissionNumber,
    house,
    photoUrl: `/uploads/${req.file.filename}`,
  };

  const studentsFilePath = path.join(__dirname, "students.json");

  fs.readFile(studentsFilePath, "utf8", (err, data) => {
    const students =
      err && err.code === "ENOENT" ? [] : JSON.parse(data || "[]");

    students.push(student);

    fs.writeFile(
      studentsFilePath,
      JSON.stringify(students, null, 2),
      (err) => {
        if (err) {
          return res
            .status(500)
            .json({ message: "Error saving student data." });
        }

        res.status(201).json(student);
      }
    );
  });
});

// Login API
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (
    username === ADMIN_CREDENTIALS.username &&
    password === ADMIN_CREDENTIALS.password
  ) {
    return res.json({ redirectUrl: "/dashboard.html" });
  }

  res.status(401).json({ message: "Invalid credentials." });
});

app.post("/submit-result", upload.single("photo"), (req, res) => {
  const formData = req.body;
  const photo = req.file;

  // Construct the data to save
  const studentData = {
    full_name: formData.full_name,
    term: formData.term,
    admission_number: formData.admission_number,
    year: formData.year,
    class: formData.class,
    house: formData.house,
    age: formData.age,
    attendance: formData.attendance,
    class_average: formData.class_average,
    final_average: formData.final_average,
    photo_path: photo ? photo.filename : null,
    // Affective Traits and Comments
    punctuality: formData.punctuality,
    alertness: formData.alertness,
    neatness: formData.neatness,
    honesty: formData.honesty,
    relationship_with_others: formData.relationship_with_others,
    politeness: formData.politeness,
    form_master_comment: formData.form_master_comment,
    principal_comment: formData.principal_comment,
    next_term_begins: formData.next_term_begins,
    // Results
    results: [],
    total_marks: 0, // Initialize total marks
  };

  // List of subjects
  const subjects = [
    "mathematics", "english_studies", "national_values", "basic_science", "basic_technology",
    "cultural_and_creative_art", "agricultural_science", "home_economics",
    "literature_in_english", "computer_studies", "business_studies",
    "irs", "p.h.e."
  ];

  // Format subject names
  const formattedSubjects = subjects.map(subject => {
    return subject
      .replace(/_/g, " ")
      .split(" ")
      .map((word, index) => {
        const lowercaseWords = ["and", "in", "of"];
        return index > 0 && lowercaseWords.includes(word.toLowerCase())
          ? word.toLowerCase()
          : word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
  });

  // Process the subject results and calculate totals
  let overallTotal = 0; // Variable to store the overall total marks

  subjects.forEach((subject, index) => {
    // Parse numerical values for each assessment
    const first = parseFloat(formData[`${subject}_first`] || 0);
    const second = parseFloat(formData[`${subject}_second`] || 0);
    const mid = parseFloat(formData[`${subject}_mid`] || 0);
    const exam = parseFloat(formData[`${subject}_exam`] || 0);
    const position = parseInt(formData[`${subject}_position`] || 0);

    // Calculate the total for the subject
    const total = first + second + mid + exam;

    // Add to overall total
    overallTotal += total;

    // Handle specific formatting for IRS and P.H.E.
    let formattedSubject = formattedSubjects[index];
    if (subject === "irs") {
      formattedSubject = "IRS";
    } else if (subject === "p.h.e.") {
      formattedSubject = "P.H.E.";
    }

    studentData.results.push({
      subject: formattedSubject,
      first_assessment: first,
      second_assessment: second,
      mid_term_test: mid,
      exam: exam,
      total_marks: total, // Total marks for this subject
      subject_average: formData[`${subject}_subject_average`] || null,
      grade: formData[`${subject}_grade`] || null,
      position: formData[`${subject}_position`] || null,
      remark: formData[`${subject}_remark`] || null,
    });
  });

  // Save the overall total in the student data
  studentData.total_marks = overallTotal;

  // Save the data to a file
  const resultFilePath = path.join(__dirname, "data", `${formData.admission_number}-${formData.term}.json`);

  // Ensure the directory exists
  if (!fs.existsSync(path.dirname(resultFilePath))) {
    fs.mkdirSync(path.dirname(resultFilePath), { recursive: true });
  }

  // Write the student data to a file
  fs.writeFile(resultFilePath, JSON.stringify(studentData, null, 2), (err) => {
    if (err) {
      console.error("Error saving the data:", err);
      return res.status(500).send("Error saving the result data");
    }
    return res.status(200).send("Results successfully submitted");
  });
});

app.get("/addresult",(req,res) => {
  res.sendFile(path.join(__dirname, "public", "addresult.html"));
});

app.get('/fetch-result/:admission_number/:term', (req, res) => {
  const { admission_number,term } = req.params;

  const resultFilePath = path.join(__dirname, 'data', `${admission_number}-${term}.json`);

  fs.exists(resultFilePath, (exists) => {
    if (exists) {
      fs.readFile(resultFilePath, 'utf8', (err, data) => {
        if (err) {
          console.error('Error reading the result file:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        // Parse the data and send it as JSON
        const resultData = JSON.parse(data);
        return res.json(resultData);
      });
    } else {
      // If the file doesn't exist, return a 404 error
      return res.status(404).json({ error: 'Result not found for this admission number' });
    }
  });
});

app.get("/check/:a/:b",(req,res) => {
   res.sendFile(path.join(__dirname, "public", "new.html"));
});

app.post('/check-result', (req, res) => {
  const { admissionNumber, term } = req.body;

  if (!admissionNumber || !term) {
    return res.status(400).json({ error: 'Admission number and term are required' });
  }
  
  const resultFilePath = path.join(__dirname, 'data', `${admissionNumber}-${term}.json`);

  fs.exists(resultFilePath, (exists) => {
    if (exists) {
      fs.readFile(resultFilePath, 'utf8', (err, data) => {
        if (err) {
          console.error('Error reading the result file:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        try {
          return res.status(301).redirect(`/fetch-result/${admissionNumber}/${term}`);
        } catch (parseError) {
          console.error('Error parsing result file:', parseError);
          return res.status(500).json({ error: 'Invalid result data format' });
        }
      });
    } else {
      return res.status(404).json({ error: 'Result not found for this admission number and term' });
    }
  });
});

// Serve uploaded files
app.use("/uploads", express.static(uploadDir));

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).send("404 Not Found");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://127.0.0.1:${PORT}`);
});

