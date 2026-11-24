const express = require('express');
const router = express.Router();

/** In this project, I am not using controllers- since the project 
 * is not so complex, however I would use it in a real world project. **/

router.post('/register',  async (req, res) => {
    try {
        // Registration logic here
    }
    catch (error) {
        res.status(500).json({ message: `${error.message}` });
    }
})

module.exports = router;