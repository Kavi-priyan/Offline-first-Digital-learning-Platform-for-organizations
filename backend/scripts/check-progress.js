import { query } from '../src/db.js';

async function checkProgress() {
  try {
    console.log('Checking progress table...');
    const { rows } = await query('SELECT * FROM progress ORDER BY updated_at DESC LIMIT 10');
    console.log('Progress records:', rows);
    
    // Check for null student_id values
    const { rows: nullStudentIds } = await query('SELECT * FROM progress WHERE student_id IS NULL');
    console.log('Records with null student_id:', nullStudentIds);
    
    // Check for empty student_id values
    const { rows: emptyStudentIds } = await query('SELECT * FROM progress WHERE student_id = \'\'');
    console.log('Records with empty student_id:', emptyStudentIds);
    
  } catch (error) {
    console.error('Error checking progress:', error);
  }
  process.exit(0);
}

checkProgress();
