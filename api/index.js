/***********************************************
 * SECTION: Imports
 ***********************************************/
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcrypt');

/***********************************************
 * SECTION: Middleware
 ***********************************************/
require('dotenv').config();
const app = express();
const port = 3000;
const cors = require('cors');
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

/***********************************************
 * SECTION: Multer Config
 ***********************************************/
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Set the destination folder where uploaded files will be stored
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Set the filename to be the original filename
  },
});

const upload = multer({ storage: storage });
var jwt = require('jsonwebtoken');

/***********************************************
 * SECTION: Cloudinary & functions
 ***********************************************/
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET_KEY,
});

// Function to extract public ID from Cloudinary URL
// this is basically just the folder name (userId), and file name in cloudinary
// if there is a single url
function extractPublicIdFromUrl(imageUrl) {
  // Extract the public ID from the Cloudinary URL
  const parts = imageUrl.split('/');
  // Get the last part of the URL
  const lastPart = parts[parts.length - 1];
  // Remove the file extension (.jpg)
  const publicId = lastPart.split('.')[0];
  return publicId;
}

// if there is an array of urls
function extractPublicIdsFromUrls(imageUrls) {
  // Extract the public IDs from the Cloudinary URLs
  const publicIds = imageUrls.map((imageUrl) => {
    // Extract the public ID from each URL
    const parts = imageUrl.split('/');
    const lastPart = parts[parts.length - 1];
    const publicId = lastPart.split('.')[0];
    return publicId;
  });
  return publicIds;
}

/***********************************************
 * SECTION: Models
 ***********************************************/
const User = require('./models/user');
const Recipe = require('./models/recipe');

// database is defined in the env file connectionstring/dbname
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    console.log('Connected to Mongodb');
  })
  .catch((err) => {
    console.log('Error connecting to MongoDB', err.message);
  });

// for localhost:3000
app.listen(port, () => {
  console.log('Server is listening on port ' + port);
});

/***********************************************
 * SECTION: User Auth
 ***********************************************/
// Generate a secret key
const generateSecretKey = () => {
  const secretKey = crypto.randomBytes(32).toString('hex');
  return secretKey;
};
// create the secret key
const secretKey = generateSecretKey();

// send the user a verification email on registration success
const sendVerificationEmail = async (email, verificationToken) => {
  // setup our email transporter
  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.BREVO_USERNAME,
      pass: process.env.BREVO_PASS,
    },
  });

  // create our email we send
  const mailOptions = {
    from: process.env.BREVO_EMAIL,
    to: email,
    subject: 'Recpipes Email Verification',
    html: `<p>Please click on the following link to verify your email for Recipes App: </p> <a href="http://192.168.0.102:3000/verify/${verificationToken}">Verify</a>`,
  };

  // try to send the verification email on registration success
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log('Error sending verification email');
  }
};

/***********************************************
 * SECTION: User Signup, Login, Verification
 ***********************************************/
// endpoint to register user
app.post('/register', async (req, res) => {
  try {
    // get the form input data
    const { name, email, password } = req.body;

    // Check for missing fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    // check if email is already registered in our db
    const existingUser = await User.findOne({ email });

    // If user already exists, send response
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // hash the password here for security
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(password, salt);

    // Create a new user and hash the password for the database
    const newUser = new User({
      name,
      email,
      password: hash, // Hash the password before saving
    });

    // generate verification token
    newUser.verificationToken = crypto.randomBytes(20).toString('hex');

    // save the user to our database
    await newUser.save();

    // send the verification email to the user
    await sendVerificationEmail(newUser.email, newUser.verificationToken);

    // Send success response
    res.status(200).json({ message: 'Registration successful' });
  } catch (error) {
    console.log('Error registering user', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Endpoint to login the user
app.post('/login', async (req, res) => {
  try {
    // get email and password, we use these to login
    const { email, password } = req.body;

    // check if user exists
    const user = await User.findOne({ email });

    //   if the user doesn't exist, send an error
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // check if password is correct based on the hash
    const passwordMatch = bcrypt.compareSync(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Generate a token, send to frontend
    const token = jwt.sign({ userId: user._id }, secretKey);
    res.status(200).json({ token: token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Login Failed' });
  }
});

// Verify the user
app.get('/verify/:token', async (req, res) => {
  try {
    const token = req.params.token;
    const user = await User.findOne({ verificationToken: token });

    // check if there is a user
    if (!user) {
      return res.status(400).json({ message: 'Invalid verification token' });
    }

    // Mark the user as verified if passed checks
    user.verified = true;
    user.verificationToken = undefined;

    await user.save();
    res.status(200).json({ message: 'Email verification successful' });
  } catch (error) {
    console.log('Error', error);
    res.status(500).json({ message: 'Email verification failed' });
  }
});

/***********************************************
 * SECTION: User Details
 ***********************************************/
app.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    // Find the user by ID
    const user = await User.findById(userId);
    // If user not found, return 404
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If user found, return user data
    res.status(200).json(user);
  } catch (error) {
    // If any error occurs, return 500
    console.error('Error retrieving user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/***********************************************
 * SECTION: Recipes
 ***********************************************/
// Get all recipes for a user
app.get('/users/:userId/recipes', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate('recipes');
    res.json(user.recipes);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

// get a single recipe by id
app.get('/recipe/:recipeId', async (req, res) => {
  try {
    const { recipeId } = req.params;

    // Query the database to find the recipe by its ID
    const recipe = await Recipe.findById(recipeId);

    if (!recipe) {
      // If no recipe is found, return a 404 Not Found response
      return res.status(404).json({ message: 'Recipe not found' });
    }

    // If the recipe is found, return it in the response
    res.json(recipe);
  } catch (error) {
    // If there's an error, return a 500 Internal Server Error response
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// endpoint to create a single recipe
app.post('/recipe', upload.array('images', 10), async (req, res) => {
  try {
    const { title, ingredients, instructions, showcaseIndex, createdBy } =
      req.body;

    // Parse the ingredients and instructions from the request body
    const parsedIngredients = JSON.parse(ingredients);
    const parsedInstructions = JSON.parse(instructions);

    // Log the request body and files
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);

    const localImageUrls = [];

    // Upload images to local uploads folder
    for (const file of req.files) {
      try {
        console.log('Processing file:', file.originalname);

        // Move the file to the uploads folder
        const destination = `uploads/${file.originalname}`;
        fs.renameSync(file.path, destination);

        // Push the local file path to the array
        localImageUrls.push(destination);
      } catch (error) {
        console.error('Error uploading image locally:', error);
        // Handle error as needed
      }
    }

    // Array to store Cloudinary image URLs
    const cloudinaryImageUrls = [];

    // Upload images to Cloudinary
    for (const imagePath of localImageUrls) {
      try {
        console.log('Uploading image to Cloudinary:', imagePath);

        const result = await cloudinary.uploader.upload(imagePath, {
          folder: `recipes/${createdBy}`,
          upload_preset: 'recipes',
        });

        console.log('Upload result:', result);

        // Push the Cloudinary URL to the array
        cloudinaryImageUrls.push(result.secure_url);
      } catch (error) {
        console.error('Error uploading image to Cloudinary:', error);
        // Handle error as needed
      }
    }

    // Delete local image files after successful upload to Cloudinary
    for (const imagePath of localImageUrls) {
      try {
        console.log('Deleting local image:', imagePath);
        fs.unlinkSync(imagePath);
      } catch (error) {
        console.error('Error deleting local image:', error);
        // Handle error as needed
      }
    }

    // Get the Cloudinary URL for the showcase image
    const showcaseImageUrl =
      showcaseIndex !== undefined ? cloudinaryImageUrls[showcaseIndex] : null;

    const recipe = new Recipe({
      title,
      ingredients: parsedIngredients,
      instructions: parsedInstructions,
      images: cloudinaryImageUrls, // Set images to cloudinaryImageUrls
      showcaseImage: showcaseImageUrl, // Set showcase image URL
      createdBy,
    });

    await recipe.save();

    // Add the recipe to the user's recipes array
    const user = await User.findById(createdBy);
    user.recipes.push(recipe._id);
    await user.save();

    res.status(201).json(recipe);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a recipe
app.put('/recipe/:recipeId', upload.array('images', 10), async (req, res) => {
  try {
    const { recipeId } = req.params;
    const { title, ingredients, instructions } = req.body;

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    recipe.title = title;
    recipe.ingredients = ingredients;
    recipe.instructions = instructions;

    await recipe.save();
    res.json(recipe);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update the isFavorite field of a recipe
app.patch('/recipe/:recipeId/favorite', async (req, res) => {
  try {
    const { recipeId } = req.params;
    const recipe = await Recipe.findById(recipeId);

    // Toggle the isFavorite field
    recipe.isFavorite = !recipe.isFavorite;
    await recipe.save();

    res.status(200).json(recipe); // Sending 200 status code along with the updated recipe
    console.log(
      `Recipe with ID ${recipeId} favorite status toggled successfully.`
    );
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/recipe/:recipeId', async (req, res) => {
  try {
    const { recipeId } = req.params;
    const { images, createdBy } = req.body;
    console.log('Images url: ', images);

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: 'recipe not found' });
    }

    const publicId = extractPublicIdsFromUrls(images);
    console.log(publicId);
    await cloudinary.api
      .delete_resources(
        publicId.map((id) => `recipes/${createdBy}/${id}`),
        {
          type: 'upload',
          resource_type: 'image',
        }
      )
      .then(console.log);

    await Recipe.findByIdAndDelete(recipeId).then(console.log);

    return res.status(200).json({
      message: `Recipe: ${recipeId} Data deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return res.status(500).json({ message: 'Error deleting recipe' });
  }
});

// get the favorites only
app.get('/users/:userId/recipes/favorite', async (req, res) => {
  try {
    const { userId } = req.params;

    // Assuming you have a 'favorites' field in your user schema
    const user = await User.findById(userId).populate('recipes');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Filter out only the favorite recipes
    const favoriteRecipes = user.recipes.filter((recipe) => recipe.isFavorite);
    console.log(favoriteRecipes);
    res.json(favoriteRecipes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});
/***********************************************
 * SECTION:
 ***********************************************/
/***********************************************
 * SECTION:
 ***********************************************/
/***********************************************
 * SECTION:
 ***********************************************/
