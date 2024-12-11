let express = require("express");
let app = express();
let path = require("path");

const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

//This is where the connection goes 


const knex = require("knex")({
  client: "pg",
  connection: {
    host:
      process.env.RDS_HOSTNAME ||
      "awseb-e-2pm9wxdypv-stack-awsebrdsdatabase-p0uhggqyvn0y.chiykskmafi4.us-east-1.rds.amazonaws.com",
    user: process.env.RDS_USERNAME || "postgres",
    password: process.env.RDS_PASSWORD || "gocougs123",
    database: process.env.RDS_DB_NAME || "ebdb",
    port: process.env.RDS_PORT || 5432,
    ssl: { rejectUnauthorized: false }, // Adjust SSL as needed
  },
  pool: {
    min: 0,
    max: 15,
    acquireTimeoutMillis: 30000,
  },
});

// test database connection
knex
  .raw("SELECT 1")
  .then(() => console.log("Database connection successful!"))
  .catch((err) => console.error("Database connection failed:", err));


  
  app.get("/", (req, res) => {
    res.render("login", {
      title: "Admin Login",
      errorMessage: null
    });
  });
  
  
  app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
      const admin = await knex("users").where({ username }).first();
      if (admin && admin.password === password) {
        // Successful login
        console.log('Success')
        res.redirect("/index");
      } else {
        // Invalid credentials
        res.render("login", {
          title: "Admin Login",
          errorMessage: "Invalid username or password."
        });
      }
    } catch (error) {
      // Log the error and show a generic message
      console.error("Error during login:", error);
      res.status(500).render("login", {
        title: "Admin Login",
        errorMessage: "An error occurred. Please try again later."
      });
    }
  });
  
  
  app.get("/index", (req, res) => {
    res.render("index", { title: "Home Page" });
  });
  

  app.get('/procedures/pdf', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'files', 'whenandwhere.pdf');
    res.sendFile(filePath);
  });


// FAQ Get Route
app.get("/faqs", async (req, res) => {
  try {
    // Fetch FAQs and their associated categories
    const faqs = await knex("faqs")
      .join("categories", "faqs.category_id", "=", "categories.category_id")
      .select("faqs.faq_id", "faqs.question", "faqs.answer", "categories.name AS category_name");
    
    // Group FAQs by category for easier rendering
    const groupedFaqs = faqs.reduce((acc, faq) => {
      acc[faq.category_name] = acc[faq.category_name] || [];
      acc[faq.category_name].push({ question: faq.question, answer: faq.answer });
      return acc;
    }, {});

    res.render("faqs", { groupedFaqs });
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    res.status(500).send("An error occurred while fetching FAQs.");
  }
});


//route for the documents.ejs page
app.get("/documents", (req, res) => {
  res.render("documents", { title: "Tax Documents" });
});



// Route to display the procedures page
app.get('/procedures', (req, res) => {
  res.render('procedures');
});










app.listen(port, () => console.log(`Server is listening!`));