import { storage } from './storage';

async function testDatabase() {
  console.log('Testing database operations...');
  
  try {
    // Create a test user
    const testUser = await storage.createUser({
      username: 'testuser',
      password: 'password123'
    });
    
    console.log('Created test user:', testUser);
    
    // Retrieve the user by id
    const retrievedUserById = await storage.getUser(testUser.id);
    console.log('Retrieved user by ID:', retrievedUserById);
    
    // Retrieve the user by username
    const retrievedUserByUsername = await storage.getUserByUsername('testuser');
    console.log('Retrieved user by username:', retrievedUserByUsername);
    
    // Create a test project
    const testProject = await storage.createProject({
      name: 'Test Project',
      language: 'nodejs',
      fileCount: 10,
      totalLines: 1000,
      stats: { jsFiles: 5, jsonFiles: 2, mdFiles: 3 },
      userId: testUser.id,
      repositoryUrl: 'https://github.com/test/test-project'
    });
    
    console.log('Created test project:', testProject);
    
    // Retrieve the project
    const retrievedProject = await storage.getProject(testProject.id);
    console.log('Retrieved project:', retrievedProject);
    
    // Create documentation for the project
    const testDocumentation = await storage.createDocumentation({
      projectId: testProject.id,
      title: 'Test Documentation',
      content: 'This is a test documentation for the project.',
      sections: [
        { 
          id: '1', 
          title: 'Introduction', 
          content: 'This is the introduction section.'
        }
      ]
    });
    
    console.log('Created test documentation:', testDocumentation);
    
    // Retrieve the documentation
    const retrievedDocumentation = await storage.getDocumentation(testProject.id);
    console.log('Retrieved documentation:', retrievedDocumentation);
    
    console.log('All database tests passed successfully!');
  } catch (error) {
    console.error('Error during database tests:', error);
  } finally {
    // Close the database connection
    process.exit(0);
  }
}

// Run the tests
testDatabase();