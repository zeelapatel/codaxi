import React, { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import LanguageBadge from "@/components/shared/language-badge";
import AnalysisTabs from "@/components/shared/analysis-tabs";

const Documentation: React.FC = () => {
  const { id } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("project-overview");
  
  // For real implementation, fetch project data from API
  const { data: project, isLoading } = useQuery({
    queryKey: [`/api/projects/${id}`],
    initialData: { language: "nodejs" } // Default language if data is not available
  });
  
  // For real implementation, fetch documentation data from API
  const { data: documentation, isLoading: isLoadingDocs } = useQuery({
    queryKey: [`/api/projects/${id}/documentation`]
  });

  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
    // Smooth scroll to section
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (isLoading || isLoadingDocs) {
    return (
      <section className="py-12 bg-[#121212]">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-6 w-32" />
          </div>
          
          <Skeleton className="h-14 mb-8 rounded-xl" />
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-96 lg:col-span-3 rounded-xl" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-[#121212] fade-in">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-light text-white">Documentation</h1>
          <div className="text-gray-300 flex items-center">
            <LanguageBadge language={project?.language || "nodejs"} />
          </div>
        </div>
        
        <AnalysisTabs projectId={id || ""} activeTab="documentation" />
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Table of Contents */}
          <div className="bg-[#1e1e1e] rounded-xl shadow-md p-6">
            <div className="mb-4">
              <div className="relative">
                <span className="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">search</span>
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#2d2d2d] border border-[#333333] rounded-md pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder="Search documentation..."
                />
              </div>
            </div>
            
            <h2 className="text-xl font-medium text-white mb-4">Table of Contents</h2>
            
            <nav className="space-y-1">
              <a 
                href="#project-overview" 
                className={`flex items-center py-2 px-3 rounded-md transition-colors ${activeSection === 'project-overview' ? 'text-[#f50057] bg-[#2d2d2d]' : 'text-gray-300 hover:bg-[#2d2d2d]'}`}
                onClick={(e) => { e.preventDefault(); handleSectionClick('project-overview'); }}
              >
                <span className="material-icons text-sm mr-2">description</span>
                Project Overview
              </a>
              <a 
                href="#installation" 
                className={`flex items-center py-2 px-3 rounded-md transition-colors ${activeSection === 'installation' ? 'text-[#f50057] bg-[#2d2d2d]' : 'text-gray-300 hover:bg-[#2d2d2d]'}`}
                onClick={(e) => { e.preventDefault(); handleSectionClick('installation'); }}
              >
                <span className="material-icons text-sm mr-2">install_desktop</span>
                Installation
              </a>
              <a 
                href="#structure" 
                className={`flex items-center py-2 px-3 rounded-md transition-colors ${activeSection === 'structure' ? 'text-[#f50057] bg-[#2d2d2d]' : 'text-gray-300 hover:bg-[#2d2d2d]'}`}
                onClick={(e) => { e.preventDefault(); handleSectionClick('structure'); }}
              >
                <span className="material-icons text-sm mr-2">account_tree</span>
                Project Structure
              </a>
              <a 
                href="#api-reference" 
                className={`flex items-center py-2 px-3 rounded-md transition-colors ${activeSection === 'api-reference' ? 'text-[#f50057] bg-[#2d2d2d]' : 'text-gray-300 hover:bg-[#2d2d2d]'}`}
                onClick={(e) => { e.preventDefault(); handleSectionClick('api-reference'); }}
              >
                <span className="material-icons text-sm mr-2">api</span>
                API Reference
              </a>
              
              <div className="pt-2 pb-1 pl-2 text-gray-400 text-sm">Core Modules</div>
              
              <a 
                href="#auth-module" 
                className={`flex items-center py-2 px-3 rounded-md transition-colors ${activeSection === 'auth-module' ? 'text-[#f50057] bg-[#2d2d2d]' : 'text-gray-300 hover:bg-[#2d2d2d]'}`}
                onClick={(e) => { e.preventDefault(); handleSectionClick('auth-module'); }}
              >
                <span className="material-icons text-sm mr-2">lock</span>
                Authentication
              </a>
              <a 
                href="#user-module" 
                className={`flex items-center py-2 px-3 rounded-md transition-colors ${activeSection === 'user-module' ? 'text-[#f50057] bg-[#2d2d2d]' : 'text-gray-300 hover:bg-[#2d2d2d]'}`}
                onClick={(e) => { e.preventDefault(); handleSectionClick('user-module'); }}
              >
                <span className="material-icons text-sm mr-2">person</span>
                User Management
              </a>
              <a 
                href="#product-module" 
                className={`flex items-center py-2 px-3 rounded-md transition-colors ${activeSection === 'product-module' ? 'text-[#f50057] bg-[#2d2d2d]' : 'text-gray-300 hover:bg-[#2d2d2d]'}`}
                onClick={(e) => { e.preventDefault(); handleSectionClick('product-module'); }}
              >
                <span className="material-icons text-sm mr-2">inventory_2</span>
                Products
              </a>
              <a 
                href="#order-module" 
                className={`flex items-center py-2 px-3 rounded-md transition-colors ${activeSection === 'order-module' ? 'text-[#f50057] bg-[#2d2d2d]' : 'text-gray-300 hover:bg-[#2d2d2d]'}`}
                onClick={(e) => { e.preventDefault(); handleSectionClick('order-module'); }}
              >
                <span className="material-icons text-sm mr-2">shopping_cart</span>
                Orders
              </a>
            </nav>
          </div>
          
          {/* Documentation Content */}
          <div className="lg:col-span-3 bg-[#1e1e1e] rounded-xl shadow-md p-6">
            <div className="prose-custom">
              <section id="project-overview">
                <h2>Project Overview</h2>
                <p>
                  This Node.js API provides a RESTful backend for an e-commerce application. It handles user authentication, product management, order processing, and payments. The API is built using Express.js and connects to a MongoDB database using Mongoose ODM.
                </p>
                <p>
                  The project follows a modular architecture with clean separation of concerns:
                </p>
                <ul>
                  <li><strong>Routes</strong>: Define API endpoints and connect them to controllers</li>
                  <li><strong>Controllers</strong>: Handle business logic and request/response processing</li>
                  <li><strong>Models</strong>: Define data schemas and database interactions</li>
                  <li><strong>Middleware</strong>: Implement cross-cutting concerns like authentication and error handling</li>
                  <li><strong>Config</strong>: Manage application configuration and environment variables</li>
                </ul>
              </section>
              
              <section id="installation" className="mt-8">
                <h2>Installation & Setup</h2>
                <p>
                  Follow these steps to set up the project locally:
                </p>
                
                <pre>
                  <div className="text-gray-300"># Clone the repository</div>
                  <div className="text-white">git clone https://github.com/example/ecommerce-api.git</div>
                  <div className="text-white">cd ecommerce-api</div>
                  <div className="mt-2 text-gray-300"># Install dependencies</div>
                  <div className="text-white">npm install</div>
                  <div className="mt-2 text-gray-300"># Set up environment variables</div>
                  <div className="text-white">cp .env.example .env</div>
                  <div className="text-gray-300"># Edit .env with your values</div>
                  <div className="mt-2 text-gray-300"># Start the development server</div>
                  <div className="text-white">npm run dev</div>
                </pre>
                
                <p>
                  The server will start on <code>http://localhost:5000</code> by default. You can change the port in the .env file.
                </p>
              </section>
              
              <section id="structure" className="mt-8">
                <h2>Project Structure</h2>
                <p>
                  The project is organized using a feature-based structure:
                </p>
                
                <pre>
ecommerce-api/
├── config/
│   ├── db.js                # Database configuration
│   └── default.js           # Default configuration
├── controllers/
│   ├── auth.js              # Authentication controllers
│   ├── users.js             # User management
│   ├── products.js          # Product management
│   └── orders.js            # Order processing
├── middleware/
│   ├── auth.js              # JWT authentication middleware
│   └── error.js             # Error handling middleware
├── models/
│   ├── User.js              # User model schema
│   ├── Product.js           # Product model schema
│   └── Order.js             # Order model schema
├── routes/
│   ├── api/
│   │   ├── auth.js          # Auth routes
│   │   ├── users.js         # User routes
│   │   ├── products.js      # Product routes
│   │   └── orders.js        # Order routes
│   └── index.js             # Route aggregator
├── utils/
│   └── validation.js        # Input validation helpers
├── .env                     # Environment variables
├── .gitignore
├── package.json
├── README.md
└── server.js                # Entry point
                </pre>
              </section>
              
              <section id="api-reference" className="mt-8">
                <h2>API Reference</h2>
                
                <div className="mb-6">
                  <h3>Authentication Endpoints</h3>
                  <div className="overflow-x-auto">
                    <table>
                      <thead>
                        <tr>
                          <th>Method</th>
                          <th>Endpoint</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="text-green-400 font-mono">POST</td>
                          <td className="text-white font-mono">/api/auth/register</td>
                          <td className="text-gray-300">Register a new user</td>
                        </tr>
                        <tr>
                          <td className="text-green-400 font-mono">POST</td>
                          <td className="text-white font-mono">/api/auth/login</td>
                          <td className="text-gray-300">Authenticate user and get token</td>
                        </tr>
                        <tr>
                          <td className="text-blue-400 font-mono">GET</td>
                          <td className="text-white font-mono">/api/auth/me</td>
                          <td className="text-gray-300">Get current user profile</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div>
                  <h3>User Endpoints</h3>
                  <div className="overflow-x-auto">
                    <table>
                      <thead>
                        <tr>
                          <th>Method</th>
                          <th>Endpoint</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="text-blue-400 font-mono">GET</td>
                          <td className="text-white font-mono">/api/users</td>
                          <td className="text-gray-300">Get all users (admin only)</td>
                        </tr>
                        <tr>
                          <td className="text-blue-400 font-mono">GET</td>
                          <td className="text-white font-mono">/api/users/:id</td>
                          <td className="text-gray-300">Get user by ID</td>
                        </tr>
                        <tr>
                          <td className="text-yellow-400 font-mono">PUT</td>
                          <td className="text-white font-mono">/api/users/:id</td>
                          <td className="text-gray-300">Update user</td>
                        </tr>
                        <tr>
                          <td className="text-red-400 font-mono">DELETE</td>
                          <td className="text-white font-mono">/api/users/:id</td>
                          <td className="text-gray-300">Delete user</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
              
              <section id="auth-module" className="mt-8">
                <h2>Authentication Module</h2>
                <p>
                  The authentication module handles user registration, login, and token verification. It uses JSON Web Tokens (JWT) for secure authentication.
                </p>
                <pre>
{`const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Register a new user
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }
    
    // Create new user
    user = new User({
      username,
      email,
      password
    });
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    // Save user to database
    await user.save();
    
    // Generate JWT
    const payload = {
      user: {
        id: user.id
      }
    };
    
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};`}
                </pre>
              </section>
              
              <section id="user-module" className="mt-8">
                <h2>User Management Module</h2>
                <p>
                  The user module provides functionality for managing user accounts, including creating, retrieving, updating, and deleting users.
                </p>
                <pre>
{`const User = require('../models/User');

// Get all users (admin only)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server error');
  }
};`}
                </pre>
              </section>
              
              <section id="product-module" className="mt-8">
                <h2>Products Module</h2>
                <p>
                  The products module handles product management, including product creation, retrieval, updates, and deletion.
                </p>
              </section>
              
              <section id="order-module" className="mt-8">
                <h2>Orders Module</h2>
                <p>
                  The orders module manages the creation and processing of customer orders, including order status updates and payment processing.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Documentation;
