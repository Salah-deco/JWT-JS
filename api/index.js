const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
app.use(express.json());

// require process
const process = require('process');


// Users DB (in memory)
const users = [
    { id: 1, username: 'admin', password: 'admin', isAdmin: true},
    { id: 2, username: 'john', password: 'password', isAdmin: false},
    { id: 3, username: 'jane', password: 'password', isAdmin: false},
];
var refreshTokens = [];

// method to generate refresh token
const generateRefreshToken = (user) => {
    return jwt.sign(user, 'myrefreshsecretkey', { expiresIn: '7d' });
}
// method to generate access token
const generateAccessToken = (user) => {
    return jwt.sign(user, 'myscretkey', { expiresIn: '30s' });
}

app.post('/api/refresh', (req, res) => {
    // take the refresh token from the user
    const refreshToken = req.body.token;

    // if there is no token provided
    if (refreshToken == null) return res.sendStatus(401);
    if (!refreshTokens.includes(refreshToken)) return res.sendStatus(403);
    
    // if everything is ok, create new access token and send it to the user
    jwt.verify(refreshToken, 'myrefreshsecretkey', (err, user) => {
        if (err) {
            refreshTokens = refreshTokens.filter(token => token !== refreshToken);
            return res.sendStatus(403);
        }
        const accessToken = generateAccessToken({ id: user.id, username: user.username, isAdmin: user.isAdmin });
        res.json({ accessToken: accessToken });
    });
})

// login method
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        // Generate an access token
        const accessToken = generateAccessToken({ id: user.id, username: user.username, isAdmin: user.isAdmin });
        const refreshToken = generateRefreshToken({ id: user.id, username: user.username, isAdmin: user.isAdmin });
        refreshTokens.push(refreshToken);

        res.json({
            username: user.username,
            isAdmin: user.isAdmin,
            accessToken: 'Bearer ' + accessToken,
            refreshToken: 'Bearer ' + refreshToken
        });
    } else {
        res.status(400).json({ message: 'Username or password is incorrect' });
    }
});

// verify token middleware
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, 'myscretkey', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// get all users
app.get('/api/users', verifyToken, (req, res) => {
    if (req.user.isAdmin) {
        res.json(users);
    } else {
        res.status(403).json({ message: 'You are not allowed to see all users' });
    }
});

// get user by id
app.get('/api/users/:id', verifyToken, (req, res) => {
    const user = users.find(u => u.id === parseInt(req.params.id));
    if (user) {
        const {password, ...userWithoutPassword} = user;
        res.json(userWithoutPassword);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});


// logout method
app.post('/api/logout', (req, res) => {
    let refreshToken = req.body.token;
    refreshTokens = refreshTokens.filter(token => token !== refreshToken);
    res.sendStatus(204);
});

app.listen(5000, () => {
    console.log('Server started on port 5000')
});