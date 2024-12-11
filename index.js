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


// Route to display the users page with the correct columns
app.get('/users', async (req, res) => {
  try {
    // Fetch all users (admins) data from the database
    const users = await knex("users")
      .select("user_id", "username", "email", "password", "role", "created_at") // Include password, role, and created_at
      .orderBy("user_id", "asc");

    res.render('users', { users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send("Failed to load users.");
  }
});

//delete admin
app.post('/deleteAdmin/:user_id', async (req, res) => {
  const { user_id } = req.params;

  console.log("Delete request received for user_id:", user_id); // Logs the user_id

  try {
    // Delete the admin with the provided user_id
    await knex('users')
      .where({ user_id })
      .del();

    console.log(`Admin with user_id ${user_id} deleted successfully.`);

    // Redirect back to the user list page
    res.redirect('/users');
  } catch (error) {
    console.error("Error deleting admin:", error);
    res.status(500).send("Failed to delete admin.");
  }
});

// Route to display the "Add New Admin" form
app.get("/addAdmin", (req, res) => {
  res.render("addadmin");
});

// Route to handle the form submission for adding a new admin
app.post("/addAdmin", async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    // Insert the new admin into the database
    await knex("users").insert({
      username,
      email,
      password,
      role,
      created_at: new Date(), // Automatically set the creation date
    });

    // Redirect to the users list page after adding the admin
    res.redirect("/users");
  } catch (error) {
    console.error("Error adding admin:", error);
    res.status(500).send("Failed to add new admin.");
  }
});
  
app.get("/editAdmin/:adminid", async (req, res) => {
  const adminId = req.params.adminid; // Extract admin ID from URL

  try {
    // Fetch the admin's details by ID
    const admin = await knex("users").where({ user_id: adminId }).first();

    if (admin) {
      res.render("edituser", { admin }); // Render the form with admin details
    } else {
      res.status(404).send("Admin not found");
    }
  } catch (error) {
    console.error("Error fetching admin:", error);
    res.status(500).send("Internal Server Error");
  }
});


app.post("/editAdmin/:adminid", async (req, res) => {
  const adminId = req.params.adminid; // Extract admin ID from URL
  const { username, email, password, role } = req.body; // Extract updated details from the form

  try {
    // Update the admin's details in the database
    await knex("users")
      .where({ user_id: adminId })
      .update({
        username,
        email,
        password,
        role,
        created_at: new Date(), // Optionally track when the admin was last updated
      });

    // Redirect back to the admin list page after updating
    res.redirect("/users");
  } catch (error) {
    console.error("Error updating admin:", error);
    res.status(500).send("Failed to update admin.");
  }
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
      acc[faq.category_name].push({
        faq_id: faq.faq_id, // Include faq_id
        question: faq.question,
        answer: faq.answer,
      });
      return acc;
    }, {});
    

    res.render("faqs", { groupedFaqs });
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    res.status(500).send("An error occurred while fetching FAQs.");
  }
});


app.get("/documents", async (req, res) => {
  try {
    const documents = await knex.select("*").from("documents");
    res.render("documents", { title: "Tax Documents", documents });
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).send("An error occurred while fetching documents.");
  }
});




// Route to display the procedures page
app.get('/procedures', (req, res) => {
  res.render('procedures');
});


app.listen(port, () => console.log(`Server is listening!`));