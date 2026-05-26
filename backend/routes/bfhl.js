const express = require('express');
const router = express.Router();

// Helper function to check if a number is prime
function isPrime(num) {
  if (num <= 1) return false;
  if (num === 2) return true;
  if (num % 2 === 0) return false;
  for (let i = 3; i <= Math.sqrt(num); i += 2) {
    if (num % i === 0) return false;
  }
  return true;
}

// Helper function to guess MIME type from base64 buffer magic bytes if not provided in data URI
function detectMimeType(buffer) {
  if (buffer.length >= 4) {
    const hex = buffer.toString('hex', 0, 4).toLowerCase();
    if (hex === '25504446') return 'application/pdf';
    if (hex === '89504e47') return 'image/png';
    if (hex.substring(0, 6) === 'ffd8ff') return 'image/jpeg';
    if (hex === '47494638') return 'image/gif';
  }
  return null;
}

// GET Route: returns the operation_code
router.get('/', (req, res) => {
  return res.status(200).json({
    operation_code: 1
  });
});

// POST Route: main processing endpoint
router.post('/', (req, res) => {
  try {
    const { data, file_b64 } = req.body;

    // Validate that 'data' is provided and is an array
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        is_success: false,
        message: "'data' must be an array of strings/characters"
      });
    }

    // Retrieve environment variables for personal details
    const userName = process.env.USER_NAME || "harsh_poonia";
    const userDob = process.env.USER_DOB || "27062006";
    const userEmail = process.env.USER_EMAIL || "harshpoonis231199@acropolis.in";
    const userRollNumber = process.env.USER_ROLL_NUMBER || "0827CS231101";

    // Generate user_id format: fullname_dob (lowercase with spaces replaced by underscores)
    const formattedName = userName.toLowerCase().trim().replace(/\s+/g, '_');
    const userId = `${formattedName}_${userDob}`;

    const numbers = [];
    const alphabets = [];

    // Parse elements to separate numbers and alphabets
    for (const item of data) {
      const itemStr = String(item).trim();
      if (/^\d+$/.test(itemStr)) {
        numbers.push(itemStr);
      } else if (/^[a-zA-Z]$/.test(itemStr)) {
        alphabets.push(itemStr);
      }
    }

    // Determine if any prime numbers are in the input array
    const isPrimeFound = numbers.some(numStr => isPrime(parseInt(numStr, 10)));

    // Find the highest lowercase alphabet
    const lowercaseAlphabets = alphabets.filter(char => char >= 'a' && char <= 'z');
    let highestLowercaseAlphabet = [];
    if (lowercaseAlphabets.length > 0) {
      lowercaseAlphabets.sort();
      highestLowercaseAlphabet = [lowercaseAlphabets[lowercaseAlphabets.length - 1]];
    }

    // Base64 file handling
    let fileValid = false;
    let fileMimeType = null;
    let fileSizeKb = null;

    if (file_b64) {
      try {
        let rawBase64 = null;
        let mimeType = null;

        // Check if it's a data URL prefix representation
        if (file_b64.startsWith('data:')) {
          const parts = file_b64.match(/^data:([^;]+);base64,(.+)$/);
          if (parts) {
            mimeType = parts[1];
            rawBase64 = parts[2];
          }
        } else {
          // Standard raw base64 string
          if (/^[A-Za-z0-9+/=\s]+$/.test(file_b64)) {
            rawBase64 = file_b64.replace(/\s/g, ''); // strip any whitespaces
          }
        }

        if (rawBase64) {
          const fileBuffer = Buffer.from(rawBase64, 'base64');
          if (fileBuffer.length > 0) {
            fileValid = true;
            fileSizeKb = String(Math.round(fileBuffer.length / 1024));
            
            // If data URL prefix did not specify MIME type, detect from magic bytes
            if (!mimeType) {
              mimeType = detectMimeType(fileBuffer);
            }
            fileMimeType = mimeType || 'application/octet-stream';
          }
        }
      } catch (fileErr) {
        fileValid = false;
      }
    }

    // Build the JSON response object dynamically
    const response = {
      is_success: true,
      user_id: userId,
      email: userEmail,
      roll_number: userRollNumber,
      numbers,
      alphabets,
      highest_lowercase_alphabet: highestLowercaseAlphabet,
      is_prime_found: isPrimeFound,
      file_valid: fileValid
    };

    // Include file fields only if a file was validly supplied, matches PDF expectations
    if (fileValid) {
      response.file_mime_type = fileMimeType;
      response.file_size_kb = fileSizeKb;
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error processing POST /bfhl request:", error);
    return res.status(500).json({
      is_success: false,
      message: "Internal server error"
    });
  }
});

module.exports = router;
